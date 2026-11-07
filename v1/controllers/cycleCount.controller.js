
import { createCycleCount, getMyCountTasks, getCountTaskDetail, saveCountItem } from "../services/cycleCount.service.js";

export const createCycleCountController = async (req, res, next) => {
    try {
        const result = await createCycleCount(req.body, req.user.userId);

        return res.status(201).json({
            message: "Inventario cíclico creado correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


export const getMyCountTasksController = async (req, res, next) => {
    try {
        const tasks = await getMyCountTasks(req.user.userId);

        return res.status(200).json({
            message: "Tareas obtenidas correctamente",
            data: tasks
        });

    } catch (error) {
        next(error);
    }
};


export const getCountTaskDetailController = async (req, res, next) => {
    try {
        const task = await getCountTaskDetail(
            req.params.taskId,
            req.user.userId
        );

        return res.status(200).json({
            message: "Detalle de tarea obtenido correctamente",
            data: task
        });

    } catch (error) {
        next(error);
    }
};



export const saveCountItemController = async (req, res, next) => {
    try {
        const task = await saveCountItem(
            req.params.taskId,
            req.user.userId,
            req.body
        );

        return res.status(200).json({
            message: "Cantidad guardada correctamente",
            data: task
        });

    } catch (error) {
        next(error);
    }
};
