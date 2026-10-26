import Joi from "joi";

export const registrarUsuarioSchema = Joi.object({
    username: Joi.string().trim().min(3).max(30).required().messages({
        "string.base": "El nombre del usuario debe ser una cadena de texto",
        "string.empty": "El nombre del usuario no puede estar vacío",
        "string.min": "El usuario {#value} debe tener al menos {#limit} caracteres",
        "string.max": "El nombre del usuario no puede tener más de {#limit} caracteres",
        "any.required": "El nombre del usuario es obligatorio"
    }),
    email: Joi.string().trim().tolowercase().email().required().messages({
        "string.base": "El email del usuario debe ser una cadena de texto",
        "string.empty": "El email no puede estar vacío",
        "any.required": "El email del usuario es obligatorio", 
        "email.base" : "El formato debe ser el de correo electronico"
    }),
    password: Joi.string().required().min(8).pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S+$/).messages({
        "any.required": "El campo contraseña es obligatorio",
        "string.empty": "La contraseña no puede estar vacía",
        "string.min": "La contraseña debe tener al menos {#limit} caracteres",
        "string.pattern.base": "La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial, sin espacios",
    }),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
        "any.only": "Las contraseñas no coinciden",
        "any.required": "La confirmación de contraseña es obligatoria"
    }),
    role: Joi.string().valid("Operario", "Administrador").default("Operario").messages({
        "any.only": "El rol solo puede ser Administrador u Operario"
  })
   
});

