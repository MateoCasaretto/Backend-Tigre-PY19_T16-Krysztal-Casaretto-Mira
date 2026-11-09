
import Joi from "joi";

const objectIdSchema = Joi.string().hex().length(24).required();

const operatorsSchema = Joi.array()
    .items(objectIdSchema)
    .min(1)
    .unique()
    .required();

export const createCycleCountSchema = Joi.object({
    warehouse: objectIdSchema,

    products: Joi.array()
        .items(objectIdSchema)
        .min(1)
        .unique()
        .required(),

    group1Operators: operatorsSchema,

    group2Operators: operatorsSchema
});

export const saveCountItemSchema = Joi.object({
    product: objectIdSchema,
    elementId: objectIdSchema,
    positionId: Joi.string().hex().length(24).allow(null).required(),
    countedQuantity: Joi.number().integer().min(0).required()
});

export const createThirdCountSchema = Joi.object({
    group3Operators: operatorsSchema
});

export const justifyStockDifferenceSchema = Joi.object({
    product: objectIdSchema,
    elementId: objectIdSchema,
    positionId: Joi.string().hex().length(24).allow(null).required(),
    justification: Joi.string().trim().min(1).required()
});

export const saveCountObservationSchema = Joi.object({
    product: objectIdSchema,
    elementId: objectIdSchema,
    positionId: Joi.string().hex().length(24).allow(null).required(),
    observation: Joi.string().trim().min(1).required()
});
