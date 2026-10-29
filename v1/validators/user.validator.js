import Joi from "joi";

export const registroSchema = Joi.object({
    nombreUsuario: Joi.string()
        .trim()
        .min(3)
        .max(30)
        .required()
        .messages({
            "string.empty": "El nombre de usuario no puede estar vacío",
            "string.min": "El nombre de usuario debe tener al menos 3 caracteres",
            "string.max": "El nombre de usuario no puede tener más de 30 caracteres",
            "any.required": "El nombre de usuario es obligatorio"
        }),

    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
            "string.email": "Debe ser un email válido",
            "string.empty": "El email no puede estar vacío",
            "any.required": "El email es obligatorio"
        }),

    contrasena: Joi.string()
        .min(8)
        .pattern(new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9]).+$"))
        .required()
        .messages({
            "string.min": "La contraseña debe tener al menos 8 caracteres",
            "string.pattern.base": "La contraseña debe tener al menos una mayúscula, una minúscula y un número",
            "any.required": "La contraseña es obligatoria"
        }),

    repetirContrasena: Joi.string()
        .valid(Joi.ref("contrasena"))
        .required()
        .messages({
            "any.only": "Las contraseñas no coinciden",
            "string.empty": "Debes repetir la contraseña",
            "any.required": "Debes repetir la contraseña"
        }),

    rol: Joi.string()
        .valid("Administrador", "Operario")
        .default("Operario")
        .messages({
            "any.only": "El rol solo puede ser Administrador u Operario"
        })
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .trim()
        .lowercase()
        .email()
        .required()
        .messages({
            "string.email": "Debe ser un email válido",
            "string.empty": "El email no puede estar vacío",
            "any.required": "El email es obligatorio"
        }),

    contrasena: Joi.string()
        .required()
        .messages({
            "string.empty": "La contraseña no puede estar vacía",
            "any.required": "La contraseña es obligatoria"
        }),
    token: Joi.string()
    .pattern(/^\d{6}$/)
    .messages({
        "string.pattern.base": "El código debe tener 6 dígitos"
    })
});


export const twoFactorSchema = Joi.object({
    token: Joi.string()
        .pattern(/^\d{6}$/)
        .required()
        .messages({
            "string.pattern.base": "El código debe tener 6 dígitos",
            "string.empty": "El código no puede estar vacío",
            "any.required": "El código es obligatorio"
        })
});
