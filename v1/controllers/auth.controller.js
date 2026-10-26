import jwt from "jsonwebtoken";
import { registrarUsuarioService } from "../services/auth.service.js";

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
