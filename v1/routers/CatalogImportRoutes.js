import express from "express";
import { authorize } from "../middlewares/AuthMiddleware.js";
import { uploadCatalogFile } from "../middlewares/UploadMiddleware.js";
import { createCatalogImport, downloadTemplate } from "../controllers/CatalogImportController.js";
import { ROLES } from "../utils/Enums.js";

const router = express.Router({ mergeParams: true });

router.get("/template", authorize(ROLES.ADMINISTRATIVE), downloadTemplate);
router.post("/", authorize(ROLES.ADMINISTRATIVE), uploadCatalogFile, createCatalogImport);

export default router;
