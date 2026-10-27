import mongoose from "mongoose";

// Catálogo de SAP: el alta se hace en SAP y acá llega por importación (CU06)
const productSchema = new mongoose.Schema({
    sapCode: { type: String, required: true, unique: true, trim: true },
    description: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, uppercase: true },
    productLine: { type: String, required: true, trim: true },
}, { timestamps: true });

export default mongoose.model("Product", productSchema);
