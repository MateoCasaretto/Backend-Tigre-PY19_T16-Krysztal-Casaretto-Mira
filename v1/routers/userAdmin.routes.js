import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { listUsers, updateUserWarehouses } from "../controllers/userAdmin.controller.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.use(authorize(ROLES.ADMINISTRATIVE));
router.get("/", listUsers);
router.put("/:id/warehouses", updateUserWarehouses);

export default router;
