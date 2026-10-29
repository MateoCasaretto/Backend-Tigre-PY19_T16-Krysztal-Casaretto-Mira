import nodemailer from "nodemailer";

const transportador = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendEmail = async (destinatario, asunto, mensaje) => {
    const info = await transportador.sendMail({
        from: `"Grupo Tigre" <${process.env.EMAIL_USER}>`,
        to: destinatario,
        subject: asunto,
        text: mensaje
    });

    return info;
};