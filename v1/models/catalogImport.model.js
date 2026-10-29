import mongoose from "mongoose";

const rejectionSchema = new mongoose.Schema({
    row: { type: Number, required: true },
    reason: { type: String, required: true },
}, { _id: false });

// Auditoría de cada importación del catálogo
const catalogImportSchema = new mongoose.Schema({
    fileName: { type: String, required: true, trim: true },
    importedRows: { type: Number, required: true, min: 0 },
    updatedRows: { type: Number, required: true, min: 0 },
    rejectedRows: { type: Number, required: true, min: 0 },
    rejections: [rejectionSchema],
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
}, { timestamps: true });

export default mongoose.model("CatalogImport", catalogImportSchema);
