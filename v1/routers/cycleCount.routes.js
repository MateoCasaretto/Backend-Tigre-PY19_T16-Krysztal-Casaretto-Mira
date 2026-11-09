import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { validateBody } from "../middlewares/validateBody.middleware.js";
import { ROLES } from "../utils/enums.utils.js";
import { createCycleCountSchema, saveCountItemSchema, saveCountObservationSchema, createThirdCountSchema, justifyStockDifferenceSchema } from "../validators/cycleCount.validator.js";
import { createCycleCountController, getMyCountTasksController, getCountTaskDetailController, saveCountItemController, saveCountObservationController, finishCountTaskController, createThirdCountTaskController, justifyStockDifferenceController, closeCycleCountController, getCycleCountsController, getCycleCountDetailController } from "../controllers/cycleCount.controller.js";

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


// Editar el detalle de una tarea para cargar el numero de los conteos 
router.patch(
    "/my-tasks/:taskId/items",
    authorize(ROLES.OPERATOR),
    validateBody(saveCountItemSchema),
    saveCountItemController
);


// Guardar una observación sobre una posición
router.patch(
    "/my-tasks/:taskId/observations",
    authorize(ROLES.OPERATOR),
    validateBody(saveCountObservationSchema),
    saveCountObservationController
);


// Finalizar una tarea de conteo
router.patch(
    "/my-tasks/:taskId/finish",
    authorize(ROLES.OPERATOR),
    finishCountTaskController
);


 // Asignar el tercer grupo cuando hay diferencias
router.post(
    "/:cycleCountId/third-count",
    authorize(ROLES.ADMINISTRATIVE),
    validateBody(createThirdCountSchema),
    createThirdCountTaskController
);


// Justificar una diferencia de stock
router.patch(
    "/:cycleCountId/justify",
    authorize(ROLES.ADMINISTRATIVE),
    validateBody(justifyStockDifferenceSchema),
    justifyStockDifferenceController
);


// Cerrar el inventario cíclico
router.patch(
    "/:cycleCountId/close",
    authorize(ROLES.ADMINISTRATIVE),
    closeCycleCountController
);


// Consultar todos los inventarios cíclicos
router.get(
    "/",
    authorize(ROLES.ADMINISTRATIVE),
    getCycleCountsController
);


// Consultar el detalle de un inventario cíclico
router.get(
    "/:cycleCountId",
    authorize(ROLES.ADMINISTRATIVE),
    getCycleCountDetailController
);


export default router;
