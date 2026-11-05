import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import {
    createElement,
    deleteElement,
    listElements,
    updateElement,
    updateLayout,
} from "../controllers/warehouseElement.controller.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/", listElements);
// RN11: solo el perfil administrativo modifica la estructura
router.post("/", authorize(ROLES.ADMINISTRATIVE), createElement);
router.put("/layout", authorize(ROLES.ADMINISTRATIVE), updateLayout);
router.put("/:elementId", authorize(ROLES.ADMINISTRATIVE), updateElement);
router.delete("/:elementId", authorize(ROLES.ADMINISTRATIVE), deleteElement);

export default router;
