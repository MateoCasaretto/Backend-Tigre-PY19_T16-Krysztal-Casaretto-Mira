import * as warehouseService from "../services/warehouse.service.js";
import { warehouseSchema } from "../validators/warehouse.validator.js";
import { validateWith } from "../utils/validation.utils.js";

export const listWarehouses = async (req, res) => {
    const warehouses = await warehouseService.listWarehouses(req.user);
    res.status(200).json({ message: "Plantas", data: warehouses });
};

export const getWarehouse = async (req, res) => {
    const warehouse = await warehouseService.getWarehouse(req.params.id, req.user);
    res.status(200).json({ message: "Planta", data: warehouse });
};

export const createWarehouse = async (req, res) => {
    const warehouse = await warehouseService.createWarehouse(validateWith(warehouseSchema, req.body));
    res.status(201).json({ message: "Planta creada", data: warehouse });
};

export const updateWarehouse = async (req, res) => {
    const warehouse = await warehouseService.updateWarehouse(req.params.id, validateWith(warehouseSchema, req.body));
    res.status(200).json({ message: "Planta actualizada", data: warehouse });
};
