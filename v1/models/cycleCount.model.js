
import mongoose from "mongoose";


const expectedStockSchema = new mongoose.Schema({

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

    locationName: {
        type: String,
        required: true
    },

    expectedQuantity: {
        type: Number,
        required: true,
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: "La cantidad debe ser un número entero"
        }
    }

}, { _id: false });


const cycleCountSchema = new mongoose.Schema({
    warehouse: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Warehouse",
        required: true
    },

    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    }],
    
    expectedStock: {
        type: [expectedStockSchema],
        default: []
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "in_progress", "third_count", "review", "closed"],
        default: "pending"
    }

}, { timestamps: true });

export default mongoose.model("CycleCount", cycleCountSchema);
