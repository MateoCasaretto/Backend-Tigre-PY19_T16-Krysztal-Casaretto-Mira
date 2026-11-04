import * as userAdminService from "../services/userAdmin.service.js";
import { listUsersSchema } from "../validators/userAdmin.validator.js";
import { assignWarehousesSchema } from "../validators/warehouse.validator.js";
import { validateWith } from "../utils/validation.utils.js";

export const listUsers = async (req, res) => {
    const { users, pagination } = await userAdminService.listUsers(validateWith(listUsersSchema, req.query));
    res.status(200).json({ message: "Usuarios", data: users, pagination });
};

export const updateUserWarehouses = async (req, res) => {
    const { warehouses } = validateWith(assignWarehousesSchema, req.body);
    const user = await userAdminService.updateUserWarehouses(req.params.id, warehouses);
    res.status(200).json({ message: "Plantas del usuario actualizadas", data: user });
};
