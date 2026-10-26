import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    
    username: {
      type: String,
      required: true,
      unique: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true
    },
    rol: {
      type: String,
      enum: ["operario", "admin"],
      default: "operario"
    },
});

usuarioSchema.pre("save", function () {
  if (!this.isModified("password")) return;
  const passwordHash = bcrypt.hashSync(this.password, Number(process.env.SALT_ROUNDS));
  this.password = passwordHash;
  
});

export default mongoose.model("Usuario", usuarioSchema);