import * as elementService from "../services/warehouseElement.service.js";
import { validateWith } from "../utils/validation.utils.js";
import { createElementSchemaFor, layoutSchema } from "../validators/warehouseElement.validator.js";

export const listElements = async (req, res) => {
    const elements = await elementService.listElements(req.params.id, req.user);
    res.status(200).json({ message: "Estructura de la planta", data: elements });
};

export const createElement = async (req, res) => {
    const data = validateWith(createElementSchemaFor(req.body?.type), req.body);
    const element = await elementService.createElement(req.params.id, data);
    res.status(201).json({ message: "Elemento creado", data: element });
};

// El esquema depende del tipo guardado, así que la validación la hace el service
export const updateElement = async (req, res) => {
    const element = await elementService.updateElement(req.params.id, req.params.elementId, req.body);
    res.status(200).json({ message: "Elemento actualizado", data: element });
};

export const updateLayout = async (req, res) => {
    const updated = await elementService.updateLayout(req.params.id, validateWith(layoutSchema, req.body));
    res.status(200).json({ message: "Plano actualizado", data: updated });
};

export const deleteElement = async (req, res) => {
    await elementService.deleteElement(req.params.id, req.params.elementId);
    res.status(204).end();
};
