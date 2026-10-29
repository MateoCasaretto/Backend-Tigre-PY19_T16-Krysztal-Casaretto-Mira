import jwt from "jsonwebtoken";
import { registrarUsuarioService, loginUsuarioService, setupTwoFactorService, enableTwoFactorService, verifyTwoFactorService } from "../services/auth.service.js";

export const registrarUsuario = async (req, res) => {
  try {
    const usuario = await registrarUsuarioService(req.body);

    const token = jwt.sign(
      {
        userId: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
      },
      process.env.SECRET_KEY,
      { expiresIn: "1h" },
    );

    res.status(201).json({ message: "Registro exitoso", usuario, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al registrar el usuario" });
  }
};

export const loginUsuario = async (req, res, next) => {
    try {
        const usuario = req.body;
        const result = await loginUsuarioService(usuario.email, usuario.contrasena);
        if (result.twoFactorEnabled) {//si tiene el doble factor activado
            if (!usuario.token) {//si no nos pasa el token del 2FA, le decimos que lo ingrese
                return res.status(200).json({ success: true, requiere2FA: true, message: "Ingresá el código de tu app de autenticación" });
            }
            await verifyTwoFactorService(result.userId, usuario.token);//si nos pasa el token, lo validamos con la secret del usuario
        }
        return res.status(200).json({ success: true, message: "Usuario logueado correctamente", token: result.token, nombreUsuario: result.nombreUsuario, rol: result.rol, email: result.email, twoFactorEnabled: result.twoFactorEnabled, userId: result.userId });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Error al iniciar sesión" });
    }
}

// Controlador para configurar el 2FA - retorna un qrCode (url para el qr) y secret (clave para activarlo)
export const setupTwoFactorAuth = async (req, res) => {
    try {
        const { secret, qrCode } = await setupTwoFactorService(req.user.userId); //devolvemos el sercret y el qrCode para que el usuario pueda escanearlo con su app de autenticación
        return res.status(200).json({ success: true, message: "Escaneá el QR con tu app de autenticación", secret, qrCode });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Error al configurar el 2FA" });
    }
}

export const enableTwoFactorAuth = async (req, res) => {
    try {
        const { userId } = req.user;
        const { token } = req.body;
        await enableTwoFactorService(userId, token);
        return res.status(200).json({ success: true, message: "2FA activado correctamente" });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Error al activar el 2FA" });
    }
}
