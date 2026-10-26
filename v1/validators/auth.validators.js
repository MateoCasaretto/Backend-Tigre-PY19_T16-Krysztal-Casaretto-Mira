
import Joi from "joi";

export const loginUsuarioSchema = Joi.object({
    email: Joi.string().trim().email().required().messages({
        "string.base": "El email debe ser un texto",
        "string.empty": "El email no puede estar vacío",
        "string.email": "El formato del email no es válido",
        "any.required": "El email es obligatorio"
    }),
    password: Joi.string().required().messages({
        "string.base": "La contraseña debe ser un texto",
        "string.empty": "La contraseña no puede estar vacía",
        "any.required": "La contraseña es obligatoria"
    })
});