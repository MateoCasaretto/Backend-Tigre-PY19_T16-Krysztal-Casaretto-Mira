import { registrarUsuarioService, loginUsuarioService, setupTwoFactorService, enableTwoFactorService } from "../services/auth.service.js";

export const registrarUsuario = async (req, res, next) => {
  try {
    const usuario = await registrarUsuarioService(req.body);

    res.status(201).json({
      message: "Registro exitoso",
      usuario: {
        _id: usuario._id,
        nombreUsuario: usuario.nombreUsuario,
        email: usuario.email,
        rol: usuario.rol
      }
    });

  } catch (error) {
    next(error);
  }
};

export const loginUsuario = async (req, res, next) => {
    try {
        const usuario = req.body;
        const result = await loginUsuarioService(usuario.email, usuario.contrasena, usuario.token);
        if (result.requiere2FA) 
            {   
                return res.status(200).json({ success: true, requiere2FA: true, message: "Ingresá el código de tu app de autenticación" });
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
        const accessToken = await enableTwoFactorService(userId, token);
        return res.status(200).json({ success: true, message: "2FA activado correctamente", token: accessToken });
    } catch (error) {
        res.status(error.status || 500).json({ success: false, message: error.message || "Error al activar el 2FA" });
    }
}
