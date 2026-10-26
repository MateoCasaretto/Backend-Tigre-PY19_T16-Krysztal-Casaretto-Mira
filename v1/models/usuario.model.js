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
    }
}, { timestamps: true });

export default mongoose.model("Usuario", usuarioSchema);