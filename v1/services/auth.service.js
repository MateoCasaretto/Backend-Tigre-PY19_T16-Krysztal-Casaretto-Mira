import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.model.js";

export const registrarUsuarioService = async ({ nombreUsuario, email, contrasena, repetirContrasena, rol }) => {
    if (contrasena !== repetirContrasena) {
        const error = new Error("Las contraseñas no coinciden");
        error.status = 400;
        throw error;
    }

    const usuarioExistente = await Usuario.findOne({
        $or: [{ nombreUsuario }, { email }]
    });

    if (usuarioExistente) {
        const error = new Error("El nombre de usuario o el correo electrónico ya están en uso");
        error.status = 400;
        throw error;
    }

    const contrasenaHasheada = await bcrypt.hash(contrasena, 10);

    const nuevoUsuario = new Usuario({
        nombreUsuario,
        email,
        contrasena: contrasenaHasheada,
        rol
    });

    await nuevoUsuario.save();
    return nuevoUsuario;
};
