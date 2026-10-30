import express from "express";
import { registrarUsuario, loginUsuario, setupTwoFactorAuth, enableTwoFactorAuth} from "../controllers/auth.controller.js";
import { forgotPasswordController, resetPasswordController } from "../controllers/passwordRecovery.controller.js";
import { autenticateToken } from "../middlewares/autentication.middleware.js";
import { validateBody } from "../middlewares/validateBody.middleware.js";
import { registroSchema, loginSchema, twoFactorSchema, forgotPasswordSchema, resetPasswordSchema } from "../validators/user.validator.js";


const router = express.Router({ mergeParams: true });

//Rutas desprotegidas, para que puedan acceder todos los usuarios
router.post("/login", validateBody(loginSchema), loginUsuario);
router.post("/forgot-password", validateBody(forgotPasswordSchema), forgotPasswordController);
router.post("/reset-password", validateBody(resetPasswordSchema), resetPasswordController);

//Rutas protegidas, para que solo puedan acceder los usuarios logueados (deberiamos pedir que solo sean administradores tambien)
router.use(autenticateToken);
router.post("/registro", validateBody(registroSchema), registrarUsuario);
router.post("/2fa/setup", setupTwoFactorAuth); //generamos el qr y la secret para que el usuario pueda escanearlo con su app de autenticación
router.post("/2fa/enable", validateBody(twoFactorSchema), enableTwoFactorAuth);//activamos el 2FA para el usuario, validando que el token que nos pasa sea correcto


export default router;
