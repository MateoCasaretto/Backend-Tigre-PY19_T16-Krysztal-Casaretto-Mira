// Va después de autenticateToken, que deja en req.user el payload del token ({ userId, nombreUsuario, rol })
export const authorize = (...roles) => (req, res, next) => {
    if (!roles.includes(req.user?.rol)) {
        return res.status(403).json({ message: "No tenés permisos para esta acción" });
    }
    next();
};
