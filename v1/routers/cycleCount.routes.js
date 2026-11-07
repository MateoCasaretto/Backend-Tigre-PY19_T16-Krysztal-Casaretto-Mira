import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validateBody } from "../middlewares/validateBody.middleware.js";
import { ROLES } from "../utils/enums.utils.js";
import { createCycleCountSchema } from "../validators/cycleCount.validator.js";
import { createCycleCountController, getMyCountTasksController, getCountTaskDetailController } from "../controllers/cycleCount.controller.js";

const router = express.Router({ mergeParams: true });

// Crear un inventario cíclico y asignar los dos grupos
router.post(
    "/",
    authorize(ROLES.ADMINISTRATIVE),
    validateBody(createCycleCountSchema),
    createCycleCountController
);

// Consultar mis tareas 
router.get(
    "/my-tasks",
    authorize(ROLES.OPERATOR),
    getMyCountTasksController
);

// Consultar el detalle de una tarea asignada
router.get(
    "/my-tasks/:taskId",
    authorize(ROLES.OPERATOR),
    getCountTaskDetailController
);

export default router;
