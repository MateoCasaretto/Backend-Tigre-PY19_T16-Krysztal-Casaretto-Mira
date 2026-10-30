import mongoose from "mongoose";
import { BARCODE_SOURCES } from "../utils/enums.utils.js";

// RN69: cada alta o cambio del código de barras queda registrado con el usuario, la fecha y la hora
const barcodeChangeSchema = new mongoose.Schema({
    barcode: { type: String, required: true },
    previousBarcode: { type: String },
    source: { type: String, enum: Object.values(BARCODE_SOURCES), required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
    date: { type: Date, default: Date.now },
}, { _id: false });

// Catálogo de SAP: el alta se hace en SAP y acá llega por importación (CU06)
const productSchema = new mongoose.Schema({
    sapCode: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, uppercase: true },
    productLine: { type: String, required: true, trim: true },
    // CU19, RN65 y RN66: un código por producto y cada código en un solo producto. Sparse: los productos sin código no chocan
    barcode: { type: String, trim: true, unique: true, sparse: true },
    barcodeHistory: { type: [barcodeChangeSchema], select: false },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
