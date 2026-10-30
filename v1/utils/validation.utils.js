import { createError } from "./error.utils.js";

// Valida con Joi y lanza un 400 con el formato de error de la API ({ message, details: [{ field, message }] })
export const validateWith = (schema, data) => {
    const { value, error } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
        const details = error.details.map(({ path, message }) => ({ field: path.join("."), message }));
        throw createError(400, details[0].message, details);
    }
    return value;
};
