import path from "node:path";
import multer from "multer";
import { createError } from "../utils/error.utils.js";
import { CATALOG_FILE_TYPES } from "../utils/enums.utils.js";

export const uploadCatalogFile = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();
        if (Object.values(CATALOG_FILE_TYPES).includes(extension)) return cb(null, true);
        cb(createError(400, "Formato de archivo no admitido. Usá Excel (.xlsx) o CSV (.csv)"));
    },
}).single("file");
