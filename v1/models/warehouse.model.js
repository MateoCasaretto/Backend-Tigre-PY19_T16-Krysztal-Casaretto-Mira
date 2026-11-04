import mongoose from "mongoose";

// Planta, almacén o depósito: son lo mismo. La estructura del mapa se suma en el CU15
const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 150 },
}, { timestamps: true });

// El nombre no se repite aunque cambien las mayúsculas o los acentos
warehouseSchema.index({ name: 1 }, { unique: true, collation: { locale: "es", strength: 1 } });

export default mongoose.model("Warehouse", warehouseSchema);
