
import { createCycleCount, getMyCountTasks, getCountTaskDetail, saveCountItem, saveCountObservation, finishCountTask, createThirdCountTask, justifyStockDifference, closeCycleCount, getCycleCounts, getCycleCountDetail } from "../services/cycleCount.service.js";

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


export const saveCountObservationController = async (req, res, next) => {
    try {
        const task = await saveCountObservation(
            req.params.taskId,
            req.user.userId,
            req.body
        );

        return res.status(200).json({
            message: "Observación guardada correctamente",
            data: task
        });

    } catch (error) {
        next(error);
    }
};


export const finishCountTaskController = async (req, res, next) => {
    try {
        const task = await finishCountTask(
            req.params.taskId,
            req.user.userId
        );

        return res.status(200).json({
            message: "Conteo finalizado correctamente",
            data: task
        });

    } catch (error) {
        next(error);
    }
};


export const createThirdCountTaskController = async (req, res, next) => {
    try {
        const task = await createThirdCountTask(
            req.params.cycleCountId,
            req.body.group3Operators
        );

        return res.status(201).json({
            message: "Tercer grupo asignado correctamente",
            data: task
        });

    } catch (error) {
        next(error);
    }
};


export const justifyStockDifferenceController = async (req, res, next) => {
    try {
        const result = await justifyStockDifference(
            req.params.cycleCountId,
            req.user.userId,
            req.body
        );

        return res.status(200).json({
            message: "Diferencia justificada correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};


export const closeCycleCountController = async (req, res, next) => {
    try {
        const cycleCount = await closeCycleCount(
            req.params.cycleCountId,
            req.user.userId
        );

        return res.status(200).json({
            message: "Inventario cíclico cerrado correctamente",
            data: cycleCount
        });

    } catch (error) {
        next(error);
    }
};


export const getCycleCountsController = async (req, res, next) => {
    try {
        const cycleCounts = await getCycleCounts();

        return res.status(200).json({
            message: "Inventarios cíclicos obtenidos correctamente",
            data: cycleCounts
        });

    } catch (error) {
        next(error);
    }
};


export const getCycleCountDetailController = async (req, res, next) => {
    try {
        const result = await getCycleCountDetail(req.params.cycleCountId);

        return res.status(200).json({
            message: "Detalle del inventario obtenido correctamente",
            data: result
        });

    } catch (error) {
        next(error);
    }
};