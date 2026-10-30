import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import Usuario from "../models/usuario.model.js";
import { sendEmail } from "./email.service.js";

const RESET_TOKEN_DURATION = 15 * 60 * 1000;

const hashToken = (token) => {
    return crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");
};

export const requestPasswordReset = async (email) => {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await Usuario.findOne({
        email: normalizedEmail
    });

    if (!user) {
        return;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = hashToken(resetToken);

    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
        throw new Error("FRONTEND_URL is not configured");
    }

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpiresAt = new Date(
        Date.now() + RESET_TOKEN_DURATION
    );

    await user.save();

    const resetLink = `${frontendUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;

    const message = `
Hola ${user.nombreUsuario}:

Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Gestión Logística de Grupo Tigre.

Para crear una nueva contraseña, ingresá al siguiente enlace:

${resetLink}

Por motivos de seguridad, este enlace vencerá en 15 minutos y solo podrá utilizarse una vez.

Si no solicitaste este cambio, podés ignorar este correo.

Saludos,
Equipo de Grupo Tigre
`;

    try {
        await sendEmail(
            user.email,
            "Recuperación de contraseña - Grupo Tigre",
            message
        );
    } catch (error) {
        await Usuario.updateOne(
            {
                _id: user._id,
                resetPasswordToken: hashedToken
            },
            {
                $set: {
                    resetPasswordToken: null,
                    resetPasswordExpiresAt: null
                }
            }
        );

        throw error;
    }
};

export const resetPassword = async (token, newPassword) => {
    const hashedToken = hashToken(token);

    const user = await Usuario.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpiresAt: {
            $gt: new Date()
        }
    }).select("+resetPasswordToken +resetPasswordExpiresAt");

    if (!user) {
        const error = new Error(
            "El enlace de recuperación de contraseña es inválido o ha expirado."
        );
        error.status = 400;
        throw error;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await Usuario.updateOne(
        {
            _id: user._id,
            resetPasswordToken: hashedToken,
            resetPasswordExpiresAt: {
                $gt: new Date()
            }
        },
        {
            $set: {
                contrasena: hashedPassword,
                resetPasswordToken: null,
                resetPasswordExpiresAt: null
            }
        }
    );

    if (result.modifiedCount !== 1) {
        const error = new Error(
            "El enlace de recuperación de contraseña es inválido o ha expirado."
        );
        error.status = 400;
        throw error;
    }
};