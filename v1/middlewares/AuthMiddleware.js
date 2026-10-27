import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
    const [scheme, token] = (req.headers.authorization ?? "").split(" ");
    if (scheme !== "Bearer" || !token) return res.status(401).json({ message: "Token no proporcionado" });
    try {
        req.user = jwt.verify(token, process.env.SECRET_KEY);
        next();
    } catch {
        res.status(401).json({ message: "Token inválido o vencido" });
    }
};

export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({ message: "No tenés permisos para esta acción" });
    }
    next();
};
