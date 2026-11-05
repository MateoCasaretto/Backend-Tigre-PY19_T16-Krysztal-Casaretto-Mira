import mongoose from "mongoose";
import { ELEMENT_TYPES } from "../utils/enums.utils.js";

// Lugar físico de una estantería: se puede desactivar (por ejemplo, bajo un puente) y tener un producto fijo de picking
const positionSchema = new mongoose.Schema({
    bayId: { type: mongoose.Schema.Types.ObjectId, required: true },
    label: { type: String, required: true, trim: true, maxlength: 20 },
    active: { type: Boolean, default: true },
    fixedProduct: { type: mongoose.Schema.Types.ObjectId, ref: "Product", default: null },
});

const levelSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true, maxlength: 20 },
    positions: { type: [positionSchema], default: [] },
});

const columnSchema = new mongoose.Schema({
    label: { type: String, required: true, trim: true, maxlength: 20 },
});

// Tramo: espacio entre dos columnas estructurales. Todos miden lo mismo y no se numeran; lo que se ve son sus columnas
const baySchema = new mongoose.Schema({
    columns: { type: [columnSchema], default: [] },
});

// Estantería o zona de piso. Posición y tamaño en metros
const elementSchema = new mongoose.Schema({
    type: { type: String, required: true, enum: Object.values(ELEMENT_TYPES) },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, maxlength: 150 },
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    sizeX: { type: Number, required: true, min: 0.5 },
    sizeY: { type: Number, required: true, min: 0.5 },
    bays: { type: [baySchema], default: undefined },
    levels: { type: [levelSchema], default: undefined },
});

// Planta, almacén o depósito: son lo mismo
const warehouseSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 80 },
    address: { type: String, required: true, trim: true, maxlength: 150 },
    elements: { type: [elementSchema], default: [] },
    // Tamaño elegido para el plano, en metros. Es un mínimo: si los elementos piden más, el plano crece
    planWidth: { type: Number, min: 1, max: 1000, default: null },
    planHeight: { type: Number, min: 1, max: 1000, default: null },
}, { timestamps: true });

// El nombre no se repite aunque cambien las mayúsculas o los acentos
warehouseSchema.index({ name: 1 }, { unique: true, collation: { locale: "es", strength: 1 } });

export default mongoose.model("Warehouse", warehouseSchema);
