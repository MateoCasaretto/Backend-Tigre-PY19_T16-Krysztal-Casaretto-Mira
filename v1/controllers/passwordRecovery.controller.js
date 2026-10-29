import {
    requestPasswordReset,
    resetPassword
} from "../services/passwordRecovery.service.js";

export const forgotPasswordController = async (req, res, next) => {
    try {
        const { email } = req.body;

        await requestPasswordReset(email);

        return res.status(200).json({
            message: "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña."
        });
    } catch (error) {
        next(error);
    }
};

export const resetPasswordController = async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        await resetPassword(token, newPassword);

        return res.status(200).json({
            message: "La contraseña se actualizó correctamente."
        });
    } catch (error) {
        next(error);
    }
};