import express from 'express';

import authRouter from "./routers/auth.routes.js";
import catalogImportRouter from "./routers/CatalogImportRoutes.js";
import { authenticate } from "./middlewares/AuthMiddleware.js";

const router = express.Router({ mergeParams: true });

router.use("/auth", authRouter); //Ruta para LOGIN, REGISTRO, 2FA Y RECUPERACION DE CONTRASEÑA

// Todo lo que sigue requiere token
router.use(authenticate);
router.use("/catalog/imports", catalogImportRouter);

export default router;
