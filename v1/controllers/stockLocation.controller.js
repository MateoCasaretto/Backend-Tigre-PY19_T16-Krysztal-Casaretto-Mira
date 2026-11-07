import * as stockLocationService from "../services/stockLocation.service.js";
import { getWarehouse } from "../services/warehouse.service.js";

// RN14: getWarehouse responde 404 si la planta no existe y 403 si el operario no la tiene asignada
export const getWarehouseOccupancy = async (req, res) => {
    await getWarehouse(req.params.id, req.user);
    const occupancy = await stockLocationService.getWarehouseOccupancy(req.params.id);
    res.status(200).json({ message: "Ocupación de la planta", data: occupancy });
};

export const listElementStock = async (req, res) => {
    await getWarehouse(req.params.id, req.user);
    const stock = await stockLocationService.listElementStock(req.params.id, req.params.elementId);
    res.status(200).json({ message: "Stock del elemento", data: stock });
};
