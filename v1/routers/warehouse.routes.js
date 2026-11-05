import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { createWarehouse, getWarehouse, listWarehouses, updateWarehouse } from "../controllers/warehouse.controller.js";
import warehouseElementRouter from "./warehouseElement.routes.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/", listWarehouses);
router.get("/:id", getWarehouse);
router.post("/", authorize(ROLES.ADMINISTRATIVE), createWarehouse);
router.put("/:id", authorize(ROLES.ADMINISTRATIVE), updateWarehouse);

router.use("/:id/elements", warehouseElementRouter);

export default router;
