import mongoose from "mongoose";
import StockLocation from "../models/stockLocation.model.js";
import Warehouse from "../models/warehouse.model.js";
import { ELEMENT_TYPES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";

export const getProductStockLocations = async (warehouseId, productId) => {

    // Buscar la planta
    const warehouse = await Warehouse.findById(warehouseId);

    if (!warehouse) {
        throw createError(404, "Planta no encontrada");
    }

    // Buscar todas las ubicaciones registradas para el producto
    const stock = await StockLocation.find({
        warehouse: warehouseId,
        product: productId
    });

    return stock.map((item) => {

        // Obtener la estantería o zona de piso
        const element = warehouse.elements.id(item.elementId);

        if (!element) {
            throw createError(409, "La ubicación registrada ya no existe");
        }

        let locationName = element.name;

        // Si es una posición de estantería, buscar su nivel
        if (item.positionId) {

            const level = element.levels?.find(
                (level) => level.positions.id(item.positionId)
            );

            const position = level?.positions.id(item.positionId);

            if (!position) {
                throw createError(409, "La posición registrada ya no existe");
            }

            locationName = `${element.name} - ${level.label} - ${position.label}`;
        }

        return {
            stockLocationId: item._id,
            product: item.product,
            elementId: item.elementId,
            positionId: item.positionId,
            location: locationName,
            quantity: item.quantity
        };
    });
};

// RN37: una posición está ocupada si tiene al menos un producto con stock
const withStock = (warehouseId) => ({ warehouse: warehouseId, quantity: { $gt: 0 } });

const countActivePositions = (element) =>
    (element.levels ?? []).reduce((total, level) => total + level.positions.filter((position) => position.active).length, 0);

const loadElements = async (warehouseId) => {
    const warehouse = await Warehouse.findById(warehouseId).select("elements");
    if (!warehouse) throw createError(404, "Planta no encontrada");
    return warehouse.elements;
};

// CU03 paso 5: posiciones ocupadas y productos de cada estantería o zona de piso.
// El acceso del usuario a la planta se valida antes, en el service de plantas
export const getWarehouseOccupancy = async (warehouseId) => {
    const elements = await loadElements(warehouseId);
    const groups = await StockLocation.aggregate([
        { $match: withStock(new mongoose.Types.ObjectId(String(warehouseId))) },
        { $group: { _id: "$elementId", positions: { $addToSet: "$positionId" }, products: { $addToSet: "$product" } } },
    ]);
    const byElement = new Map(groups.map((group) => [String(group._id), group]));

    return elements.map((element) => {
        const group = byElement.get(String(element._id));
        const isRack = element.type === ELEMENT_TYPES.RACK;
        return {
            elementId: element._id,
            occupiedPositions: isRack ? (group?.positions.filter(Boolean).length ?? 0) : null,
            totalPositions: isRack ? countActivePositions(element) : null,
            productCount: group?.products.length ?? 0,
        };
    });
};

// CU08 pasos 2 y 3: productos con stock en una estantería (todas sus posiciones) o en una zona de piso
export const listElementStock = async (warehouseId, elementId) => {
    if (!mongoose.isValidObjectId(elementId)) throw createError(400, "Id inválido");

    const elements = await loadElements(warehouseId);
    if (!elements.id(elementId)) throw createError(404, "Elemento no encontrado");

    return StockLocation.find({ ...withStock(warehouseId), elementId })
        .select("positionId product quantity updatedAt")
        .populate("product", "sapCode description category")
        .sort({ positionId: 1, product: 1 });
};
