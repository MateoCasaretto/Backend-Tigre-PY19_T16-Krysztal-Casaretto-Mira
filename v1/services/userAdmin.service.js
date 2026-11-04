import Usuario from "../models/usuario.model.js";
import { assertWarehousesExist } from "./warehouse.service.js";
import { ROLES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";
import { escapeRegex } from "../utils/regex.utils.js";

const PUBLIC_FIELDS = "nombreUsuario email rol warehouses";

// Gestión de usuarios para el perfil administrativo. El alta sigue en auth.service.js
export const listUsers = async ({ search, page, limit }) => {
    const filter = {};
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ nombreUsuario: pattern }, { email: pattern }];
    }

    const [users, total] = await Promise.all([
        Usuario.find(filter)
            .select(PUBLIC_FIELDS)
            .populate("warehouses", "name")
            .sort({ nombreUsuario: 1 })
            .skip((page - 1) * limit)
            .limit(limit),
        Usuario.countDocuments(filter),
    ]);
    return { users, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

export const updateUserWarehouses = async (id, warehouses) => {
    const user = await Usuario.findById(id).select(PUBLIC_FIELDS);
    if (!user) throw createError(404, "Usuario no encontrado");
    // Los administradores ven todas las plantas: no se les asigna ninguna
    if (user.rol !== ROLES.OPERATOR) throw createError(409, "Solo se asignan plantas a los operarios");

    await assertWarehousesExist(warehouses);
    user.warehouses = warehouses;
    await user.save();
    return user.populate("warehouses", "name");
};
