import {registrarUsuarioService, loginUsuarioService} from "../services/auth.services.js";

export const registrarUsuario = async (req, res, next) => {
    try{
        const { usuario, token } = await registrarUsuarioService(req.validatedBody);
        return res.status(201).json({ success: true, message: "Usuario registrado correctamente", token });

    }
    catch(error){
        next(error);
    }
}

export const loginUsuario = async (req, res, next) => {
    try {
        const { email, password } = req.validatedBody;
        const result = await loginUsuarioService(email, password);
        return res.status(200).json({ success: true, message: "Usuario logueado correctamente", ...result });
    } catch (error) {
        next(error);
    }
}
