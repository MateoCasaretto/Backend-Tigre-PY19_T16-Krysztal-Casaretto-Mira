import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { assignBarcode, findProductByBarcode, listProducts } from "../controllers/product.controller.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/", listProducts);
router.get("/barcode/:barcode", findProductByBarcode);
// RN67: solo el perfil administrativo registra o modifica la correspondencia
router.put("/:id/barcode", authorize(ROLES.ADMINISTRATIVE), assignBarcode);

export default router;
