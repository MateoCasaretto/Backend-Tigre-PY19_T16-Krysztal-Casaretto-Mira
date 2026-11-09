
import mongoose from "mongoose";


const countItemSchema = new mongoose.Schema({

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

    countedQuantity: {
        type: Number,
        default: null,
        min: 0,
        validate: {
            validator: (value) => value === null || Number.isInteger(value),
            message: "La cantidad debe ser un número entero"
        }
    }, 

    observation: {
        type: String,
        trim: true,
        default: null
    }

}, { _id: false });


const countTaskSchema = new mongoose.Schema({

    cycleCount: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CycleCount",
        required: true
    },

    groupNumber: {
        type: Number,
        enum: [1, 2, 3],
        required: true
    },

    assignedOperators: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Usuario"
        }],
        validate: {
            validator: (operators) => operators.length > 0,
            message: "Debe haber al menos un operario asignado"
        }
    },

    countedItems: {
        type: [countItemSchema],
        default: []
    },

    status: {
        type: String,
        enum: ["pending", "submitted"],
        default: "pending"
    },

    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Usuario",
        default: null
    },

    submittedAt: {
        type: Date,
        default: null
    }

}, { timestamps: true });

countTaskSchema.index(
    { cycleCount: 1, groupNumber: 1 },
    { unique: true }
);

export default mongoose.model("CountTask", countTaskSchema);
