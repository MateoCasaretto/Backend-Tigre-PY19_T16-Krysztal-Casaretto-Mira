import Joi from "joi";

export const listUsersSchema = Joi.object({
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
