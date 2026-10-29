import jwt from "jsonwebtoken"

export const autenticateToken = (req, res, next) => {
    const authHeader = req.headers.authorization; //NOS QUEDAMOS CON EL autorization que esta en el Header (este tiene el token), [bearer token]
    if(!authHeader) return res.status(401).json({message: "Token no proporcionado"});//si no esta esa info error

    const token = authHeader.split(' ')[1];//aca me quedo con el token, que es lo que esta despues del bearer, saco el bearer
    if(!token) return res.status(401).json({message: "Token no proporcionado"});//sino esta error

    jwt.verify(token, process.env.SECRET_KEY, (err, user) =>{//VERIFICO EL TOKEN, SI ESTA BIEN GENIAL
        if(err) return res.status(403).json({message: "Token invalido"})      
        req.user = user;
        next();
    })
}