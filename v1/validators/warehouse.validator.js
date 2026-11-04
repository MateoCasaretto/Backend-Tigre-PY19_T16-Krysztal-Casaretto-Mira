import Joi from "joi";

export const warehouseSchema = Joi.object({
    name: Joi.string().trim().max(80).required().messages({
        "any.required": "Falta el nombre de la planta",
        "string.empty": "Falta el nombre de la planta",
        "string.max": "El nombre de la planta no puede tener más de 80 caracteres",
    }),
    address: Joi.string().trim().max(150).required().messages({
        "any.required": "Falta la dirección de la planta",
        "string.empty": "Falta la dirección de la planta",
        "string.max": "La dirección no puede tener más de 150 caracteres",
    }),
});

// Plantas de un operario: al menos una, sin repetir. También la usa el registro de usuarios
export const warehouseIdsSchema = Joi.array()
    .items(Joi.string().hex().length(24).messages({
        "string.hex": "Alguna de las plantas elegidas no es válida",
        "string.length": "Alguna de las plantas elegidas no es válida",
    }))
    .min(1)
    .unique()
    .messages({
        "array.base": "Las plantas tienen que venir en una lista",
        "array.min": "Elegí al menos una planta",
        "array.unique": "Hay una planta repetida",
        "any.required": "Elegí al menos una planta",
    });

export const assignWarehousesSchema = Joi.object({ warehouses: warehouseIdsSchema.required() });
