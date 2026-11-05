import Product from "../models/product.model.js";
import Warehouse from "../models/warehouse.model.js";
import { getWarehouse } from "./warehouse.service.js";
import { ELEMENT_TYPES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";
import { buildRackLayout, findRackProblem } from "../utils/rack.utils.js";
import { updateElementSchemaFor } from "../validators/warehouseElement.validator.js";
import { validateWith } from "../utils/validation.utils.js";

const FIXED_PRODUCT_PATH = "elements.levels.positions.fixedProduct";

const loadWarehouse = async (id) => {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) throw createError(404, "Planta no encontrada");
    return warehouse;
};

const findElement = (warehouse, elementId) => {
    const element = warehouse.elements.id(elementId);
    if (!element) throw createError(404, "Elemento no encontrado");
    return element;
};

const populateProducts = (warehouse) => warehouse.populate({ path: FIXED_PRODUCT_PATH, select: "sapCode description" });

const assertUniqueName = (warehouse, name, ownId = null) => {
    const key = name.toLocaleLowerCase("es");
    const repeated = warehouse.elements.some((element) => element.name.toLocaleLowerCase("es") === key && !element._id.equals(ownId));
    if (repeated) throw createError(409, `Ya existe un elemento con el nombre ${name}`);
};

const overlap = (a, b) => a.x < b.x + b.sizeX && b.x < a.x + a.sizeX && a.y < b.y + b.sizeY && b.y < a.y + a.sizeY;

// Se compara todo el plano, ya con los cambios aplicados
const assertNoOverlap = (elements) => {
    for (let i = 0; i < elements.length; i += 1) {
        for (let j = i + 1; j < elements.length; j += 1) {
            if (overlap(elements[i], elements[j])) {
                throw createError(409, `${elements[i].name} y ${elements[j].name} se superponen en el plano`);
            }
        }
    }
};

const assertProductsExist = async (levels) => {
    const positions = levels.flatMap((level) => level.positions);
    const ids = [...new Set(positions.map((position) => position.fixedProduct).filter(Boolean))];
    const found = await Product.countDocuments({ _id: { $in: ids } });
    if (found !== ids.length) throw createError(400, "Alguno de los productos fijos no existe");
};

// CU03 pasos 2 y 3. RN14: el operario solo ve las plantas que tiene asignadas
export const listElements = async (warehouseId, user) => {
    await getWarehouse(warehouseId, user);
    const warehouse = await loadWarehouse(warehouseId);
    await populateProducts(warehouse);
    return warehouse.elements;
};

// CU15 pasos 3 a 5: una estantería nueva nace con una disposición uniforme
export const createElement = async (warehouseId, data) => {
    const warehouse = await loadWarehouse(warehouseId);
    const { levelCount, columnCount, columnsPerBay, ...element } = data;
    assertUniqueName(warehouse, element.name);

    const structure = element.type === ELEMENT_TYPES.RACK ? buildRackLayout({ levelCount, columnCount, columnsPerBay }) : {};
    warehouse.elements.push({ ...element, ...structure });
    assertNoOverlap(warehouse.elements);
    await warehouse.save();
    return warehouse.elements.at(-1);
};

// CU15 A1. Cuando existan los pallets (CU01) hay que rechazar quitar o desactivar una posición con stock
export const updateElement = async (warehouseId, elementId, body) => {
    const warehouse = await loadWarehouse(warehouseId);
    const element = findElement(warehouse, elementId);
    const data = validateWith(updateElementSchemaFor(element.type), body);
    assertUniqueName(warehouse, data.name, element._id);

    if (element.type === ELEMENT_TYPES.RACK) {
        const problem = findRackProblem(data);
        if (problem) throw createError(400, problem);
        await assertProductsExist(data.levels);
    }

    element.set(data);
    assertNoOverlap(warehouse.elements);
    await warehouse.save();
    await populateProducts(warehouse);
    return warehouse.elements.id(elementId);
};

export const updateLayout = async (warehouseId, { elements = [], planWidth, planHeight }) => {
    const warehouse = await loadWarehouse(warehouseId);
    elements.forEach(({ _id, ...placement }) => findElement(warehouse, _id).set(placement));
    if (planWidth !== undefined) warehouse.planWidth = planWidth;
    if (planHeight !== undefined) warehouse.planHeight = planHeight;
    assertNoOverlap(warehouse.elements);
    await warehouse.save();
    await populateProducts(warehouse);
    return warehouse.elements;
};

export const deleteElement = async (warehouseId, elementId) => {
    const warehouse = await loadWarehouse(warehouseId);
    findElement(warehouse, elementId).deleteOne();
    await warehouse.save();
};
