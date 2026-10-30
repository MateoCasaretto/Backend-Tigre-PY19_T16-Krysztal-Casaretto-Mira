import Joi from "joi";
import { BARCODE_FORMAT_MESSAGE, isValidBarcode } from "../utils/barcode.utils.js";

export const barcodeSchema = Joi.string().trim().required().custom((value, helpers) => (
    isValidBarcode(value) ? value : helpers.error("barcode.format")
)).messages({
    "any.required": "Falta el código de barras",
    "string.empty": "Falta el código de barras",
    "barcode.format": `El código de barras no es válido. ${BARCODE_FORMAT_MESSAGE}`,
});

export const assignBarcodeSchema = Joi.object({ barcode: barcodeSchema });

export const listProductsSchema = Joi.object({
    search: Joi.string().trim().max(100).allow("").messages({
        "string.max": "La búsqueda no puede tener más de 100 caracteres",
    }),
    page: Joi.number().integer().min(1).default(1).messages({
        "number.base": "La página tiene que ser un número entero desde 1",
        "number.integer": "La página tiene que ser un número entero desde 1",
        "number.min": "La página tiene que ser un número entero desde 1",
    }),
    limit: Joi.number().integer().min(1).max(50).default(20).messages({
        "number.base": "El límite tiene que ser un número entero entre 1 y 50",
        "number.integer": "El límite tiene que ser un número entero entre 1 y 50",
        "number.min": "El límite tiene que ser un número entero entre 1 y 50",
        "number.max": "El límite tiene que ser un número entero entre 1 y 50",
    }),
});
