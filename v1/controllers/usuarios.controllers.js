import { obtenerUsuariosService, obtenerUsuarioPorIdService, cambiarAPlanPremiumService, cambiarRolUsuarioService } from "../services/usuario.services.js";

export const obtenerUsuarios = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const usuarios = await obtenerUsuariosService(page, limit);
        return res.status(200).json({ success: true, message: "Usuarios obtenidos correctamente", data: usuarios });
    } catch (error) {
        next(error);
    }
}

export const obtenerUsuarioPorId = async (req, res, next) => {
    try {
        const { id } = req.params;
        const usuario = await obtenerUsuarioPorIdService(id);
        return res.status(200).json({ success: true, message: "Usuario obtenido correctamente", data: usuario });
    } catch (error) {
        next(error);
    }
}

export const cambiarRolUsuario = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const usuarioActualizado = await cambiarRolUsuarioService(id, role);

        return res.status(200).json({ success: true, message: "Rol de usuario actualizado correctamente", data: usuarioActualizado });
    } catch (error) {
        next(error);
    }
};