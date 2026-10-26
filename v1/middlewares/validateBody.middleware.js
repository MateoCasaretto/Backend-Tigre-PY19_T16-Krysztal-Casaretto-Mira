export const validateBody = (schema) => {
    return (req, res, next) => {
        const { value, error } = schema.validate(req.body, { abortEarly: false });//ESTO GUARDA EN VALUE Y ERROR LA RESPUESTA QUE ME DA LA VALIDACION DE MI BODY, QUE LA HACE EL SCHEMA
        if (error) {
            return res.status(400).json({
                mensaje: "Error en la validación",
                error: error.details
            });
        }
        req.body = value; // Sobrescribimos el body con los datos validados y transformados
        next();
    }
}