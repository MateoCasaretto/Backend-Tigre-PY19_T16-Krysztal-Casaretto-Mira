import express from 'express';

import authRouter from "./routers/auth.routes.js";

const router = express.Router({ mergeParams: true });

router.use("/auth", authRouter); //Ruta para LOGIN, REGISTRO, 2FA Y RECUPERACION DE CONTRASEÑA

export default router;