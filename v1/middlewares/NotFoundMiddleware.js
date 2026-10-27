export const notFoundMiddleware = (req, res) => {
    res.status(404).json({ message: `No existe la ruta ${req.method} ${req.originalUrl}` });
};
