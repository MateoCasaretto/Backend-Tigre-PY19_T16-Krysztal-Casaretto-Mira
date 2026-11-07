
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
        }], { session });

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
        ], { session });

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

    // Actualizar solamente la cantidad de esa posición
    const updatedTask = await CountTask.findOneAndUpdate(
        {
            _id: taskId,
            assignedOperators: userId,
            status: "pending",
            [`countedItems.${itemIndex}.product`]: product,
            [`countedItems.${itemIndex}.elementId`]: elementId,
            [`countedItems.${itemIndex}.positionId`]: positionId
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
