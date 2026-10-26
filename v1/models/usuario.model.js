import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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


usuarioSchema.pre("save", async function () {
    if (!this.isModified("contrasena")) return;

    const passwordHash = await bcrypt.hash(this.contrasena, Number(process.env.SALT_ROUNDS || 12)
    );
    this.contrasena = passwordHash;
});

export default mongoose.model("Usuario", usuarioSchema);