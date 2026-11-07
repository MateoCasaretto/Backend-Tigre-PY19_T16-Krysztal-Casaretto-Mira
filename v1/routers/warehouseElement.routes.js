import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import {
    createElement,
    deleteElement,
    listElements,
    updateElement,
    updateLayout,
} from "../controllers/warehouseElement.controller.js";
import { listElementStock } from "../controllers/stockLocation.controller.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/", listElements);
// CU08: productos guardados en la estantería o zona de piso
router.get("/:elementId/stock", listElementStock);
// RN11: solo el perfil administrativo modifica la estructura
router.post("/", authorize(ROLES.ADMINISTRATIVE), createElement);
router.put("/layout", authorize(ROLES.ADMINISTRATIVE), updateLayout);
router.put("/:elementId", authorize(ROLES.ADMINISTRATIVE), updateElement);
router.delete("/:elementId", authorize(ROLES.ADMINISTRATIVE), deleteElement);

export default router;
