import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    username: {
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
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["Administrador", "Operario"],
        default: "Operario"
    }
}, { timestamps: true });


usuarioSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const passwordHash = await bcrypt.hash(this.password, Number(process.env.SALT_ROUNDS || 12)
    );
    this.password = passwordHash;
});

export default mongoose.model("Usuario", usuarioSchema);