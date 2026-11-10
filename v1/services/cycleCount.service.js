
import mongoose from "mongoose";
import CycleCount from "../models/cycleCount.model.js";
import CountTask from "../models/countTask.model.js";
import Usuario from "../models/usuario.model.js";
import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";
import { getProductStockLocations } from "./stockLocation.service.js";
import { ROLES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";

export const createCycleCount = async (data, createdBy) => {

    const { warehouse, products, group1Operators, group2Operators } = data;

    // Verificar que se hayan seleccionado productos y operarios
    if (
        !Array.isArray(products) || products.length === 0 ||
        !Array.isArray(group1Operators) || group1Operators.length === 0 ||
        !Array.isArray(group2Operators) || group2Operators.length === 0
    ) {
        throw createError(400, "Debe seleccionar productos y operarios para ambos grupos");
    }

    const allOperators = [...group1Operators, ...group2Operators];
    const allIds = [warehouse, ...products, ...allOperators];

    if (allIds.some((id) => !mongoose.isValidObjectId(id))) {
        throw createError(400, "Alguno de los identificadores no es válido");
    }

    // No permitir productos ni operarios repetidos
    if (new Set(products.map(String)).size !== products.length) {
        throw createError(400, "No se puede repetir un producto");
    }

    if (new Set(allOperators.map(String)).size !== allOperators.length) {
        throw createError(400, "Los grupos deben tener operarios diferentes");
    }

    // Verificar que la planta exista
    const warehouseExists = await Warehouse.exists({ _id: warehouse });

    if (!warehouseExists) {
        throw createError(404, "La planta no existe");
    }

    // Verificar que todos los productos existan
    const productCount = await Product.countDocuments({
        _id: { $in: products }
    });

    if (productCount !== products.length) {
        throw createError(400, "Alguno de los productos no existe");
    }

    // Verificar operarios y plantas asignadas
    const operators = await Usuario.find({
        _id: { $in: allOperators },
        rol: ROLES.OPERATOR
    }).select("warehouses");

    if (operators.length !== allOperators.length) {
        throw createError(400, "Todos los usuarios asignados deben ser operarios existentes");
    }

    const invalidWarehouse = operators.some(
        (operator) => !operator.warehouses.some(
            (id) => id.equals(warehouse)
        )
    );

    if (invalidWarehouse) {
        throw createError(400, "Algún operario no tiene asignada esta planta");
    }
    
    // Obtener todas las posiciones de los productos seleccionados
    const countedItems = [];
    const expectedStock = [];

    for (const productId of products) {
        const locations = await getProductStockLocations(warehouse, productId);

        if (locations.length === 0) {
            throw createError(400, "Uno de los productos no tiene ubicaciones registradas");
        }

        for (const location of locations) {
            countedItems.push({
                product: productId,
                elementId: location.elementId,
                positionId: location.positionId,
                locationName: location.location,
                countedQuantity: null
            });
            expectedStock.push({
                product: productId,
                elementId: location.elementId,
                positionId: location.positionId,
                locationName: location.location,
                expectedQuantity: location.quantity
            });
        }
    }

    // Crear el inventario y las dos tareas
    return mongoose.connection.transaction(async (session) => {

        const [cycleCount] = await CycleCount.create([{
            warehouse,
            products,
            expectedStock,
            createdBy
        }], { session, ordered: true });

        const tasks = await CountTask.create([
            {
                cycleCount: cycleCount._id,
                groupNumber: 1,
                assignedOperators: group1Operators,
                countedItems: countedItems 
            },
            {
                cycleCount: cycleCount._id,
                groupNumber: 2,
                assignedOperators: group2Operators,
                countedItems: countedItems   
            }
        ], { session, ordered: true });

        return { cycleCount, tasks };
    });
};


export const getMyCountTasks = async (userId) => {

    const tasks = await CountTask.find({
        assignedOperators: userId
    })
    .select("cycleCount groupNumber status createdAt submittedAt")
    .sort({ createdAt: -1 });

    return tasks;
};


export const getCountTaskDetail = async (taskId, userId) => {

    const task = await CountTask.findOne({
        _id: taskId,
        assignedOperators: userId
    }).populate("countedItems.product", "sapCode description");

    if (!task) {
        throw createError(404, "Tarea no encontrada");
    }

    return task;
};


export const saveCountItem = async (taskId, userId, data) => {

    const { product, elementId, positionId, countedQuantity } = data;

    // Validar el identificador de la tarea
    if (!mongoose.isValidObjectId(taskId)) {
        throw createError(400, "El identificador de la tarea no es válido");
    }

    // Buscar la tarea asignada al operario
    const task = await CountTask.findOne({
        _id: taskId,
        assignedOperators: userId
    });

    if (!task) {
        throw createError(404, "Tarea no encontrada");
    }

    // No permitir cambios en tareas finalizadas
    if (task.status !== "pending") {
        throw createError(409, "Esta tarea ya fue enviada");
    }

    // Buscar la posición dentro de la tarea
    const itemIndex = task.countedItems.findIndex(item =>
        String(item.product) === product &&
        String(item.elementId) === elementId &&
        String(item.positionId) === String(positionId)
    );

    if (itemIndex === -1) {
        throw createError(400, "La posición no pertenece a esta tarea");
    }

    if (task.countedItems[itemIndex].countedQuantity !== null) {
        throw createError(409, "Esta posición ya fue contada");
    }
    
    // Actualizar solamente la cantidad de esa posición
    const updatedTask = await CountTask.findOneAndUpdate(
        {
            _id: taskId,
            assignedOperators: userId,
            status: "pending",
            [`countedItems.${itemIndex}.product`]: product,
            [`countedItems.${itemIndex}.elementId`]: elementId,
            [`countedItems.${itemIndex}.positionId`]: positionId,
            [`countedItems.${itemIndex}.countedQuantity`]: null
        },
        {
            $set: {
                [`countedItems.${itemIndex}.countedQuantity`]: countedQuantity
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        throw createError(409, "La tarea ya no está disponible para modificar");
    }

    return updatedTask;
};


export const saveCountObservation = async (taskId, userId, data) => {

    const { product, elementId, positionId, observation } = data;

    if (!mongoose.isValidObjectId(taskId)) {
        throw createError(400, "El identificador de la tarea no es válido");
    }

    // Verificar que la observación tenga contenido
    if (typeof observation !== "string" || observation.trim() === "") {
        throw createError(400, "Debe ingresar una observación");
    }

    // Buscar la tarea asignada al operario
    const task = await CountTask.findOne({
        _id: taskId,
        assignedOperators: userId
    });

    if (!task) {
        throw createError(404, "Tarea no encontrada");
    }

    if (task.status !== "pending") {
        throw createError(409, "La tarea ya fue finalizada");
    }

    // Buscar la posición correspondiente
    const itemIndex = task.countedItems.findIndex(item =>
        String(item.product) === String(product) &&
        String(item.elementId) === String(elementId) &&
        String(item.positionId) === String(positionId)
    );

    if (itemIndex === -1) {
        throw createError(400, "La posición no pertenece a esta tarea");
    }

    // Evitar sobrescribir una observación anterior
    if (task.countedItems[itemIndex].observation) {
        throw createError(409, "Esta posición ya tiene una observación");
    }

    // Guardar solamente la observación
    const updatedTask = await CountTask.findOneAndUpdate(
        {
            _id: taskId,
            assignedOperators: userId,
            status: "pending",
            [`countedItems.${itemIndex}.product`]: product,
            [`countedItems.${itemIndex}.elementId`]: elementId,
            [`countedItems.${itemIndex}.positionId`]: positionId,
            [`countedItems.${itemIndex}.observation`]: null
        },
        {
            $set: {
                [`countedItems.${itemIndex}.observation`]: observation.trim()
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        throw createError(409, "La observación ya no está disponible para guardar");
    }

    return updatedTask;
};


export const finishCountTask = async (taskId, userId) => {

    if (!mongoose.isValidObjectId(taskId)) {
        throw createError(400, "El identificador de la tarea no es válido");
    }

    // Buscar la tarea asignada al operario
    const task = await CountTask.findOne({
        _id: taskId,
        assignedOperators: userId
    });

    if (!task) {
        throw createError(404, "Tarea no encontrada");
    }

    // Evitar finalizar una tarea ya enviada
    if (task.status !== "pending") {
        throw createError(409, "Esta tarea ya fue finalizada");
    }

    // Verificar que todas las posiciones estén contadas
    const incompleteItems = task.countedItems.some(
        item => item.countedQuantity === null
    );

    if (task.countedItems.length === 0 || incompleteItems) {
        throw createError(400, "Debe contar todas las posiciones antes de finalizar");
    }

    // Finalizar la tarea
    const updatedTask = await CountTask.findOneAndUpdate(
        {
            _id: taskId,
            assignedOperators: userId,
            status: "pending",
            "countedItems.0": { $exists: true },
            countedItems: {
                $not: {
                    $elemMatch: { countedQuantity: null }
                }
            }
        },
        {
            $set: {
                status: "submitted",
                submittedBy: userId,
                submittedAt: new Date()
            }
        },
        { new: true, runValidators: true }
    );

    if (!updatedTask) {
        throw createError(409, "La tarea ya no está disponible para finalizar");
    }
    
    // Comparar los conteos cuando ambos grupos hayan terminado
    if (updatedTask.groupNumber === 1 || updatedTask.groupNumber === 2) {

        // Identificar cuál es el otro grupo
        let otherGroupNumber = 1;

        if (updatedTask.groupNumber === 1) {
            otherGroupNumber = 2;
        }

        // Buscar la tarea del otro grupo
        const otherTask = await CountTask.findOne({
            cycleCount: updatedTask.cycleCount,
            groupNumber: otherGroupNumber
        });

        // Comparar solamente si el otro grupo también terminó
        if (otherTask && otherTask.status === "submitted") {

            const comparison = await compareCountTasks(updatedTask.cycleCount);

            if (comparison.hasDifferences) {
                await CycleCount.findByIdAndUpdate(updatedTask.cycleCount, {
                    status: "third_count"
                });
            } else {
                await CycleCount.findByIdAndUpdate(updatedTask.cycleCount, {
                    status: "review"
                });
            }
        }
    }

    // Si terminó el tercer grupo, pasar a revisión administrativa
    if (updatedTask.groupNumber === 3) {
        await CycleCount.findByIdAndUpdate(
            updatedTask.cycleCount,
            { status: "review" }
        );
    }

    return updatedTask;
};


export const compareCountTasks = async (cycleCountId) => {

    const tasks = await CountTask.find({ cycleCount: cycleCountId });

    const group1 = tasks.find(task => task.groupNumber === 1);
    const group2 = tasks.find(task => task.groupNumber === 2);

    // Verificar que existan ambos grupos
    if (!group1 || !group2) {
        throw createError(409, "No se encontraron los dos grupos de conteo");
    }

    // Verificar que ambos grupos hayan finalizado
    if (group1.status !== "submitted" || group2.status !== "submitted") {
        throw createError(409, "Los dos grupos deben finalizar antes de comparar");
    }

    // Verificar que tengan la misma cantidad de posiciones
    if (group1.countedItems.length !== group2.countedItems.length) {
        throw createError(409, "Los grupos tienen distintas posiciones asignadas");
    }

    if (group1.countedItems.length === 0) {
        throw createError(409, "No hay posiciones para comparar");
    }

    // Función para comprobar si dos registros corresponden a la misma posición
    const samePosition = (item1, item2) => {
        return String(item1.product) === String(item2.product) &&
            String(item1.elementId) === String(item2.elementId) &&
            String(item1.positionId) === String(item2.positionId);
    };

    const differences = [];

    // Recorrer las posiciones del Grupo 1
    for (const item1 of group1.countedItems) {

        // Verificar que no haya posiciones repetidas en el Grupo 1
        const matchesGroup1 = group1.countedItems.filter(item =>
            samePosition(item, item1)
        );

        if (matchesGroup1.length > 1) {
            throw createError(409, "El primer grupo tiene posiciones duplicadas");
        }

        // Buscar la misma posición en el Grupo 2
        const matchesGroup2 = group2.countedItems.filter(item =>
            samePosition(item, item1)
        );

        if (matchesGroup2.length === 0) {
            throw createError(409, "Los grupos tienen distintas posiciones asignadas");
        }

        // Verificar que no esté repetida en el Grupo 2
        if (matchesGroup2.length > 1) {
            throw createError(409, "El segundo grupo tiene posiciones duplicadas");
        }

        const item2 = matchesGroup2[0];

        // Verificar que las cantidades estén completas
        if (item1.countedQuantity === null || item2.countedQuantity === null) {
            throw createError(409, "Hay posiciones sin contar");
        }

        // Comparar las cantidades de ambos grupos
        if (item1.countedQuantity !== item2.countedQuantity) {
            differences.push({
                product: item1.product,
                elementId: item1.elementId,
                positionId: item1.positionId,
                locationName: item1.locationName,
                group1Quantity: item1.countedQuantity,
                group2Quantity: item2.countedQuantity
            });
        }
    }

    return {
        hasDifferences: differences.length > 0,
        differences
    };
};


export const createThirdCountTask = async (cycleCountId, group3Operators) => {

    // Verificar que el inventario exista
    if (!mongoose.isValidObjectId(cycleCountId)) {
        throw createError(400, "El identificador del inventario no es válido");
    }

    const cycleCount = await CycleCount.findById(cycleCountId);

    if (!cycleCount) {
        throw createError(404, "Inventario no encontrado");
    }

    // Verificar que el inventario necesite un tercer conteo
    if (cycleCount.status !== "third_count") {
        throw createError(409, "Este inventario no necesita un tercer conteo");
    }

    // Buscar los grupos del inventario
    const tasks = await CountTask.find({ cycleCount: cycleCountId });

    const group1 = tasks.find(task => task.groupNumber === 1);
    const group2 = tasks.find(task => task.groupNumber === 2);
    const group3 = tasks.find(task => task.groupNumber === 3);

    if (!group1 || !group2) {
        throw createError(409, "No se encontraron los dos primeros grupos");
    }

    // Evitar crear dos veces el tercer grupo
    if (group3) {
        throw createError(409, "El tercer grupo ya fue asignado");
    }

    // Verificar los operarios seleccionados
    if (!Array.isArray(group3Operators) || group3Operators.length === 0) {
        throw createError(400, "Debe seleccionar operarios para el tercer grupo");
    }

    // Identificar los operarios que ya participaron
    const usedOperators = [
        ...group1.assignedOperators,
        ...group2.assignedOperators
    ].map(id => String(id));

    for (const operatorId of group3Operators) {

        if (!mongoose.isValidObjectId(operatorId)) {
            throw createError(400, "El identificador del operario no es válido");
        }

        if (usedOperators.includes(String(operatorId))) {
            throw createError(400, "El operario ya fue asignado a un grupo");
        }

        const operator = await Usuario.findById(operatorId);

        if (!operator || operator.rol !== ROLES.OPERATOR) {
            throw createError(400, "El usuario seleccionado no es un operario válido");
        }

        const belongsToWarehouse = operator.warehouses.some(
            id => String(id) === String(cycleCount.warehouse)
        );

        if (!belongsToWarehouse) {
            throw createError(400, "El operario no pertenece a esta planta");
        }

        usedOperators.push(String(operatorId));
    }

    // Obtener solamente las posiciones con diferencias
    const comparison = await compareCountTasks(cycleCountId);

    if (!comparison.hasDifferences) {
        throw createError(409, "No hay diferencias para realizar un tercer conteo");
    }

    const countedItems = [];

    for (const difference of comparison.differences) {
        countedItems.push({
            product: difference.product,
            elementId: difference.elementId,
            positionId: difference.positionId,
            locationName: difference.locationName,
            countedQuantity: null
        });
    }

    // Crear la tarea del tercer grupo
    const task = await CountTask.create({
        cycleCount: cycleCountId,
        groupNumber: 3,
        assignedOperators: group3Operators,
        countedItems
    });

    return task;
};


export const getFinalCountResults = async (cycleCountId) => {

    // Verificar que el identificador sea válido
    if (!mongoose.isValidObjectId(cycleCountId)) {
        throw createError(400, "El identificador del inventario no es válido");
    }

    const cycleCount = await CycleCount.findById(cycleCountId);

    if (!cycleCount) {
        throw createError(404, "Inventario no encontrado");
    }

    // El inventario debe haber terminado sus conteos
    if (cycleCount.status !== "review" && cycleCount.status !== "closed") {
        throw createError(409, "El inventario todavía no terminó sus conteos");
    }

    // Obtener las diferencias de los dos primeros grupos
    const comparison = await compareCountTasks(cycleCountId);

    // Buscar las tareas
    const tasks = await CountTask.find({ cycleCount: cycleCountId });

    const group1 = tasks.find(task => task.groupNumber === 1);
    const group3 = tasks.find(task => task.groupNumber === 3);

    // Si hubo diferencias, el tercer grupo debe haber terminado
    if (comparison.hasDifferences) {
        if (!group3 || group3.status !== "submitted") {
            throw createError(409, "El tercer conteo no está finalizado");
        }

        if (group3.countedItems.length !== comparison.differences.length) {
            throw createError(409, "El tercer grupo tiene posiciones incorrectas");
        }
    }

    const results = [];

    // Recorrer todas las posiciones del primer grupo
    for (const item1 of group1.countedItems) {

        let finalQuantity = item1.countedQuantity;

        // Buscar si esta posición tuvo diferencias
        const difference = comparison.differences.find(item =>
            String(item.product) === String(item1.product) &&
            String(item.elementId) === String(item1.elementId) &&
            String(item.positionId) === String(item1.positionId)
        );

        // Si hubo diferencia, buscar el resultado del tercer grupo
        if (difference) {

            const thirdItems = group3.countedItems.filter(item =>
                String(item.product) === String(item1.product) &&
                String(item.elementId) === String(item1.elementId) &&
                String(item.positionId) === String(item1.positionId)
            );

            if (thirdItems.length !== 1 || thirdItems[0].countedQuantity === null) {
                throw createError(409, "Falta un resultado válido del tercer conteo");
            }

            finalQuantity = thirdItems[0].countedQuantity;
        }

        results.push({
            product: item1.product,
            elementId: item1.elementId,
            positionId: item1.positionId,
            locationName: item1.locationName,
            finalQuantity
        });
    }

    return results;
};


export const getStockDifferences = async (cycleCountId) => {

    // Obtener las cantidades definitivas del inventario
    const finalResults = await getFinalCountResults(cycleCountId);

    // Obtener el stock que estaba registrado al crear el inventario
    const cycleCount = await CycleCount.findById(cycleCountId);

    // Verificar que las cantidades de posiciones coincidan
    if (cycleCount.expectedStock.length !== finalResults.length) {
        throw createError(409, "El stock esperado no coincide con las posiciones contadas");
    }

    const results = [];

    // Recorrer las posiciones con sus cantidades definitivas
    for (const item of finalResults) {

        // Buscar el stock esperado de esa misma posición
        const expectedItems = cycleCount.expectedStock.filter(stock =>
            String(stock.product) === String(item.product) &&
            String(stock.elementId) === String(item.elementId) &&
            String(stock.positionId) === String(item.positionId)
        );

        if (expectedItems.length !== 1) {
            throw createError(409, "No se encontró un stock esperado único para la posición");
        }

        const expectedQuantity = expectedItems[0].expectedQuantity;

        // Calcular la diferencia
        const difference = item.finalQuantity - expectedQuantity;

        results.push({
            product: item.product,
            elementId: item.elementId,
            positionId: item.positionId,
            locationName: item.locationName,
            expectedQuantity,
            finalQuantity: item.finalQuantity,
            difference,
            requiresJustification: difference !== 0
        });
    }

    return results;
};


export const justifyStockDifference = async (cycleCountId, userId, data) => {

    const { product, elementId, positionId, justification } = data;

    // Verificar que el inventario exista
    if (!mongoose.isValidObjectId(cycleCountId)) {
        throw createError(400, "El identificador del inventario no es válido");
    }

    const cycleCount = await CycleCount.findById(cycleCountId);

    if (!cycleCount) {
        throw createError(404, "Inventario no encontrado");
    }

    // Solo permitir justificaciones durante la revisión
    if (cycleCount.status !== "review") {
        throw createError(409, "El inventario no está en revisión");
    }

    // Verificar que se haya escrito una justificación
    if (typeof justification !== "string" || justification.trim() === "") {
        throw createError(400, "Debe ingresar una justificación");
    }

    // Obtener las diferencias del inventario
    const differences = await getStockDifferences(cycleCountId);

    // Buscar la diferencia correspondiente al producto y posición
    const difference = differences.find(item =>
        String(item.product) === String(product) &&
        String(item.elementId) === String(elementId) &&
        String(item.positionId) === String(positionId)
    );

    if (!difference) {
        throw createError(404, "No se encontró esa posición en el inventario");
    }

    if (!difference.requiresJustification) {
        throw createError(400, "Esta posición no tiene diferencias para justificar");
    }

    // Buscar el registro donde guardaremos la justificación
    const stockItem = cycleCount.expectedStock.find(item =>
        String(item.product) === String(product) &&
        String(item.elementId) === String(elementId) &&
        String(item.positionId) === String(positionId)
    );

    if (!stockItem) {
        throw createError(409, "No se encontró el stock esperado de esta posición");
    }

    if (stockItem.justification) {
        throw createError(409, "Esta diferencia ya fue justificada");
    }

    // Guardar la justificación y los datos del administrador
    stockItem.justification = justification.trim();
    stockItem.justifiedBy = userId;
    stockItem.justifiedAt = new Date();

    await cycleCount.save();

    return stockItem;
};


export const closeCycleCount = async (cycleCountId, userId) => {

    // Verificar que el identificador sea válido
    if (!mongoose.isValidObjectId(cycleCountId)) {
        throw createError(400, "El identificador del inventario no es válido");
    }

    // Buscar el inventario
    const cycleCount = await CycleCount.findById(cycleCountId);

    if (!cycleCount) {
        throw createError(404, "Inventario no encontrado");
    }

    // Verificar que esté en revisión
    if (cycleCount.status !== "review") {
        throw createError(409, "El inventario no está disponible para cerrar");
    }

    // Obtener las diferencias entre el stock esperado y el conteo final
    const differences = await getStockDifferences(cycleCountId);

    // Verificar que todas las diferencias tengan justificación
    for (const difference of differences) {

        if (difference.requiresJustification) {

            const stockItem = cycleCount.expectedStock.find(item =>
                String(item.product) === String(difference.product) &&
                String(item.elementId) === String(difference.elementId) &&
                String(item.positionId) === String(difference.positionId)
            );

            if (!stockItem || !stockItem.justification || stockItem.justification.trim() === "") {
                throw createError(400, "Hay diferencias de stock sin justificar");
            }
        }
    }

    // Cerrar el inventario
    cycleCount.status = "closed";
    cycleCount.closedBy = userId;
    cycleCount.closedAt = new Date();

    await cycleCount.save();

    return cycleCount;
};


export const getCycleCounts = async () => {

    const cycleCounts = await CycleCount.find()
        .select("warehouse products status createdBy createdAt closedAt")
        .populate("warehouse", "name")
        .sort({ createdAt: -1 });

    return cycleCounts;
};


export const getCycleCountDetail = async (cycleCountId) => {

    // Verificar que el identificador sea válido
    if (!mongoose.isValidObjectId(cycleCountId)) {
        throw createError(400, "El identificador del inventario no es válido");
    }

    // Buscar el inventario
    const cycleCount = await CycleCount.findById(cycleCountId)
        .populate("warehouse", "name")
        .populate("products", "sapCode description")
        .populate("createdBy", "nombreUsuario")
        .populate("closedBy", "nombreUsuario");

    if (!cycleCount) {
        throw createError(404, "Inventario no encontrado");
    }

    // Buscar las tareas de los grupos
    const tasks = await CountTask.find({
        cycleCount: cycleCountId
    })
        .populate("assignedOperators", "nombreUsuario")
        .populate("submittedBy", "nombreUsuario")
        .populate("countedItems.product", "sapCode description")
        .sort({ groupNumber: 1 });

    // Calcular las diferencias si los conteos ya terminaron
    let differences = [];

    if (cycleCount.status === "review" || cycleCount.status === "closed") {
        differences = await getStockDifferences(cycleCountId);
    }

    return {
        cycleCount,
        tasks,
        differences
    };
};
