import Usuario from "../models/usuario.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registrarUsuarioService = async (usuarioData) => {
    const { username, email, password } = usuarioData;

    const usuarioExistente = await Usuario.findOne({
        $or: [{ email: email.toLowerCase() }, { username }]
    });

    if (usuarioExistente) {
        const error = new Error("El usuario ya existe");
        error.status = 409;

        if (usuarioExistente.email === email.toLowerCase()) {
            error.message = "El email ya está registrado";
        } else if (usuarioExistente.username === username) {
            error.message = "El nombre de usuario ya está en uso";
        }

        throw error;
    }

    const nuevoUsuario = new Usuario({
        username,
        email: email.toLowerCase(),
        password
    });

    await nuevoUsuario.save();
    const token = jwt.sign({ id: nuevoUsuario._id, rol: nuevoUsuario.rol }, process.env.SECRET_KEY, { expiresIn: "1d" });
    return { token };
};

export const loginUsuarioService = async (email, password) => {
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario) {
        const error = new Error("Email o contraseña incorrectos");
        error.status = 400;
        throw error;
    }

    const isMatch = bcrypt.compareSync(password, usuario.password);

    if (!isMatch) {
        const error = new Error("Email o contraseña incorrectos");
        error.status = 400;
        throw error;
    }

    const token = jwt.sign({ id: usuario._id, rol: usuario.rol }, process.env.SECRET_KEY, { expiresIn: "1d" });
    return { token };
};