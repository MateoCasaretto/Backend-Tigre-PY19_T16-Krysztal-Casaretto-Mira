import mongoose from "mongoose";

const usuarioSchema = new mongoose.Schema({
    nombreUsuario: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    contrasena: {
        type: String,
        required: true
    },
    rol: {
        type: String,
        enum: ["Administrador", "Operario"],
        default: "Operario"
    },
    twoFactorSecret: { //esto es el secret entre el servidor y la app de autenticación (esto se genera en el endpoint "/2fa/setup")
        type: String,
        select: false
    },
    twoFactorEnabled: { //esto es para que el usuario active el 2fa
        type: Boolean,
        default: false
    }
}, { timestamps: true });

export default mongoose.model("Usuario", usuarioSchema);