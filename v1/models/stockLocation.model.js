
import mongoose from "mongoose";

const stockLocationSchema = new mongoose.Schema({

    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    elementId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    positionId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },

    quantity: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "La cantidad debe ser un número entero"
        }
    }

}, { timestamps: true });

stockLocationSchema.index(
    { warehouse: 1, product: 1, elementId: 1, positionId: 1 },
    { unique: true }
);

// CU08: stock de una estantería o zona de piso
stockLocationSchema.index({ warehouse: 1, elementId: 1 });

export default mongoose.model("StockLocation", stockLocationSchema);
