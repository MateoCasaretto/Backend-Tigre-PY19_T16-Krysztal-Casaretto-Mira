import jwt from "jsonwebtoken";
import Usuario from "../models/usuario.model.js";

export const obtenerUsuariosService = async (page, limit) => {
    const pageNumber = Number(page) || 1;
    const limitNumber = Number(limit) || 5;
    const skip = (pageNumber - 1) * limitNumber;
    const usuarios = await Usuario.find().skip(skip).limit(limitNumber);
    return usuarios;
};

export const obtenerUsuarioPorIdService = async (id) => {
    const usuario = await Usuario.findById(id);
    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }
    return usuario;
};

export const cambiarRolUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const usuarioActualizado = await cambiarRolUsuarioService(id, rol);

        return res.status(200).json({ success: true, message: "Rol de usuario actualizado correctamente", data: usuarioActualizado });
    } catch (error) {
        next(error);
    }
};

