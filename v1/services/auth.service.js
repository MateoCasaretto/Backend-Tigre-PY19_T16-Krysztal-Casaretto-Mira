import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.model.js";
import jwt from "jsonwebtoken";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";

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

export const loginUsuarioService = async (email, password) => {
    const usuario = await Usuario.findOne({ email: email.toLowerCase() });

    if (!usuario) {
        const error = new Error("Email o contraseña incorrectos");
        error.status = 400;
        throw error;
    }

    const isMatch = await bcrypt.compare(password, usuario.contrasena);

    if (!isMatch) {
        const error = new Error("Email o contraseña incorrectos");
        error.status = 400;
        throw error;
    }

    const token = jwt.sign(
        { userId: usuario._id, nombreUsuario: usuario.nombreUsuario, rol: usuario.rol },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
    );
    return {
        token,
        userId: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
        rol: usuario.rol,
        twoFactorEnabled: usuario.twoFactorEnabled,
    };
};

export const setupTwoFactorService = async (userId) => {
    const usuario = await Usuario.findById(userId); //Obtenemos el usuario logueado para setearle la secret y generar el qrCode

    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }

    if (usuario.twoFactorEnabled) {
        const error = new Error("El 2FA ya está activado");
        error.status = 400;
        throw error;
    }

    const secret = generateSecret(); //creamos la secret en el usuario logueado
    usuario.twoFactorSecret = secret;//se la seteamos al usuario
    await usuario.save();

    const otpauthUrl = generateURI({ issuer: "Tigre", label: usuario.email, secret });// texto para generar el qrCode
    const qrCode = await QRCode.toDataURL(otpauthUrl);// convierte el texto a una qrCode en base64 para que el front pueda mostrarlo como imagen

    return { secret, qrCode }; //devolvemos la secret y el qrCode para que el usuario pueda escanearlo con su app de autenticación
};

export const enableTwoFactorService = async (userId, token) => {
    const usuario = await Usuario.findById(userId).select("+twoFactorSecret");// traemos la secret del usuario logueado

    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }

    if (usuario.twoFactorEnabled) {
        const error = new Error("El 2FA ya está activado");
        error.status = 400;
        throw error;
    }

    if (!usuario.twoFactorSecret) {
        const error = new Error("Primero tenés que generar el QR en /2fa/setup");
        error.status = 400;
        throw error;
    }

    const resultado = await verify({ secret: usuario.twoFactorSecret, token, epochTolerance: 30 }); //Compara el token con el secret (calcula el código esperado a partir del secret y la hora actual, y lo compara con el token del usuario)


    if (!resultado.valid) {
        const error = new Error("Código inválido");
        error.status = 400;
        throw error;
    }

    usuario.twoFactorEnabled = true; //si el resultado es positivo, lo marcamos como true 
    await usuario.save();
};

export const verifyTwoFactorService = async (userId, token) => {
    const usuario = await Usuario.findById(userId).select("+twoFactorSecret");

    if (!usuario) {
        const error = new Error("Usuario no encontrado");
        error.status = 404;
        throw error;
    }

    if (!usuario.twoFactorSecret) {
        const error = new Error("Primero tenés que generar el QR en /2fa/setup");
        error.status = 400;
        throw error;
    }

    const resultado = await verify({ secret: usuario.twoFactorSecret, token, epochTolerance: 30 }); // aca hace lo mismo que el enableTwoFactorService

    if (!resultado.valid) {
        const error = new Error("Código inválido");
        error.status = 400;
        throw error;
    }

    return true;// la diferencia es que este solamente devuelve un true, mientras que el enableTwoFactorService activa el 2FA marca si el usuario activo el 2fa.
};