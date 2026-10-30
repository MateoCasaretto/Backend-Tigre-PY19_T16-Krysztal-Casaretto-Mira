import Joi from "joi";
import { BARCODE_FORMAT_MESSAGE, isValidBarcode } from "../utils/barcode.utils.js";

// Una fila del archivo de catálogo, con los textos tal como vienen de las celdas
export const catalogRowSchema = Joi.object({
    sapCode: Joi.string().trim().max(40).required().messages({
        "string.empty": "Falta el código SAP",
        "string.max": "El código SAP no puede tener más de 40 caracteres",
    }),
    description: Joi.string().trim().max(200).required().messages({
        "string.empty": "Falta la descripción",
        "string.max": "La descripción no puede tener más de 200 caracteres",
    }),
    category: Joi.string().trim().uppercase().max(20).required().messages({
        "string.empty": "Falta la categoría",
        "string.max": "La categoría no puede tener más de 20 caracteres",
    }),
    productLine: Joi.string().trim().max(100).required().messages({
        "string.empty": "Falta la línea de producto",
        "string.max": "La línea de producto no puede tener más de 100 caracteres",
    }),
    // CU19: opcional; vacío deja el código de barras que el producto ya tenga
    barcode: Joi.string().trim().allow("").custom((value, helpers) => (
        isValidBarcode(value) ? value : helpers.error("barcode.format")
    )).messages({
        "barcode.format": `El código de barras {#value} no es válido. ${BARCODE_FORMAT_MESSAGE}`,
    }),
});
