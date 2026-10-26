import express from "express";
import { registrarUsuario } from "../controllers/auth.controller.js";
import { validateBody } from "../middlewares/validateBody.middleware.js";
import { registroSchema } from "../validators/user.validator.js";

const router = express.Router({ mergeParams: true });

router.post("/registro", validateBody(registroSchema), registrarUsuario);

export default router;
