import Warehouse from "../models/warehouse.model.js";
import Usuario from "../models/usuario.model.js";
import { ROLES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";

const DUPLICATE_MESSAGE = "Ya existe una planta con ese nombre";

const assignedWarehouseIds = async (userId) => {
    const user = await Usuario.findById(userId).select("warehouses");
    return user?.warehouses ?? [];
};

// Los administradores ven todas las plantas; los operarios, solo las asignadas
export const listWarehouses = async ({ userId, rol }) => {
    const filter = rol === ROLES.ADMINISTRATIVE ? {} : { _id: { $in: await assignedWarehouseIds(userId) } };
    return Warehouse.find(filter).sort({ name: 1 }).collation({ locale: "es" });
};

// CU17 paso 3. RN14: un operario no accede a una planta que no tiene asignada
export const getWarehouse = async (id, { userId, rol }) => {
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) throw createError(404, "Planta no encontrada");

    if (rol !== ROLES.ADMINISTRATIVE) {
        const assigned = await assignedWarehouseIds(userId);
        if (!assigned.some((warehouseId) => warehouseId.equals(warehouse._id))) {
            throw createError(403, "No tenés asignada esta planta");
        }
    }
    return warehouse;
};

export const createWarehouse = async (data) => {
    try {
        return await Warehouse.create(data);
    } catch (error) {
        if (error.code === 11000) throw createError(409, DUPLICATE_MESSAGE);
        throw error;
    }
};

export const updateWarehouse = async (id, data) => {
    try {
        const warehouse = await Warehouse.findByIdAndUpdate(id, data, { new: true, runValidators: true });
        if (!warehouse) throw createError(404, "Planta no encontrada");
        return warehouse;
    } catch (error) {
        if (error.code === 11000) throw createError(409, DUPLICATE_MESSAGE);
        throw error;
    }
};

// Lo usan el registro y la edición de usuarios antes de guardar la asignación
export const assertWarehousesExist = async (ids) => {
    const found = await Warehouse.countDocuments({ _id: { $in: ids } });
    if (found !== ids.length) throw createError(400, "Alguna de las plantas elegidas no existe");
};
