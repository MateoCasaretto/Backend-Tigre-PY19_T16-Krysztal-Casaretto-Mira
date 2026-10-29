import express from "express";
import { authorize } from "../middlewares/authorize.middleware.js";
import { uploadCatalogFile } from "../middlewares/upload.middleware.js";
import { createCatalogImport, downloadTemplate } from "../controllers/catalogImport.controller.js";
import { ROLES } from "../utils/enums.utils.js";

const router = express.Router({ mergeParams: true });

router.get("/template", authorize(ROLES.ADMINISTRATIVE), downloadTemplate);
router.post("/", authorize(ROLES.ADMINISTRATIVE), uploadCatalogFile, createCatalogImport);

export default router;
