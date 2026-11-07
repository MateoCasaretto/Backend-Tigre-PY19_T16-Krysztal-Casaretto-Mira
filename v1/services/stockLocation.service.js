import StockLocation from "../models/stockLocation.model.js";
import Warehouse from "../models/warehouse.model.js";
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
