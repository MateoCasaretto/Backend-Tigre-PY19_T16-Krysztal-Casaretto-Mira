const UPLOAD_MESSAGES = {
    LIMIT_FILE_SIZE: "El archivo supera el tamaño máximo de 5 MB",
    LIMIT_FILE_COUNT: "Adjuntá un solo archivo",
    LIMIT_UNEXPECTED_FILE: "El archivo debe enviarse en el campo file",
};

export const errorMiddleware = (err, req, res, next) => {
    let status = err.status ?? 500;
    let message = err.message;

    if (err.name === "ValidationError") status = 400;
    if (err.name === "CastError") { status = 400; message = "Id inválido"; }
    if (err.code === 11000) { status = 409; message = `Ya existe un registro con ese ${Object.keys(err.keyValue).join(", ")}`; }
    if (err.name === "MulterError") { status = 400; message = UPLOAD_MESSAGES[err.code] ?? "No se pudo recibir el archivo"; }

    if (status === 500) {
        console.error(err);
        message = "Error interno del servidor";
    }

    res.status(status).json({ message, ...(err.details && { details: err.details }) });
};
