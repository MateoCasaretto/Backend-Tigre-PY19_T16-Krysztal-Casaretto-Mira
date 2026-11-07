import express from 'express';

import authRouter from "./routers/auth.routes.js";
import catalogImportRouter from "./routers/catalogImport.routes.js";
import productRouter from "./routers/product.routes.js";
import warehouseRouter from "./routers/warehouse.routes.js";
import userAdminRouter from "./routers/userAdmin.routes.js";
import cycleCountRouter from "./routers/cycleCount.routes.js";
import { autenticateToken, requireAccessToken } from "./middlewares/autentication.middleware.js";

const router = express.Router({ mergeParams: true });

router.use("/auth", authRouter); //Ruta para LOGIN, REGISTRO, 2FA Y RECUPERACION DE CONTRASEÑA

// Todo lo que sigue requiere token
router.use(autenticateToken);
router.use(requireAccessToken); // Solo los usuarios con token de acceso pueden acceder a las rutas siguientes
router.use("/catalog/imports", catalogImportRouter);
router.use("/products", productRouter);
router.use("/warehouses", warehouseRouter);
router.use("/users", userAdminRouter);
router.use("/cycle-counts", cycleCountRouter);

export default router;
