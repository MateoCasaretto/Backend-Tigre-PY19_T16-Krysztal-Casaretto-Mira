import Joi from "joi";
import { ELEMENT_TYPES } from "../utils/enums.utils.js";

const STEP = 0.5;

const objectId = Joi.string().hex().length(24).messages({
    "string.hex": "Hay un identificador inválido",
    "string.length": "Hay un identificador inválido",
});

const coordinate = Joi.number().min(0).max(1000).multiple(STEP).required().messages({
    "number.base": "La posición debe ser un número",
    "number.min": "La posición no puede ser negativa",
    "number.max": "La posición no puede pasar de 1000 metros",
    "number.multiple": "La posición va de a 0,5 metros",
    "any.required": "Falta la posición",
});

const size = Joi.number().min(STEP).max(1000).multiple(STEP).required().messages({
    "number.base": "El tamaño debe ser un número",
    "number.min": "El tamaño mínimo es de 0,5 metros",
    "number.max": "El tamaño no puede pasar de 1000 metros",
    "number.multiple": "El tamaño va de a 0,5 metros",
    "any.required": "Falta el tamaño",
});

const label = (subject) => Joi.string().trim().max(20).required().messages({
    "any.required": `Falta el nombre de ${subject}`,
    "string.empty": `Falta el nombre de ${subject}`,
    "string.max": `El nombre de ${subject} no puede tener más de 20 caracteres`,
});

const placement = {
    name: Joi.string().trim().max(60).required().messages({
        "any.required": "Falta el nombre",
        "string.empty": "Falta el nombre",
        "string.max": "El nombre no puede tener más de 60 caracteres",
    }),
    x: coordinate,
    y: coordinate,
    sizeX: size,
    sizeY: size,
};

const description = Joi.string().trim().max(150).allow("").messages({
    "string.max": "La descripción no puede tener más de 150 caracteres",
});

const count = (subject, max) => Joi.number().integer().min(1).max(max).messages({
    "number.base": `La cantidad de ${subject} debe ser un número`,
    "number.integer": `La cantidad de ${subject} debe ser un número entero`,
    "number.min": `La cantidad de ${subject} debe ser al menos 1`,
    "number.max": `La cantidad de ${subject} no puede pasar de ${max}`,
    "any.required": `Falta la cantidad de ${subject}`,
});

const createRackSchema = Joi.object({
    type: Joi.string().valid(ELEMENT_TYPES.RACK).required(),
    ...placement,
    levelCount: count("niveles", 20).required(),
    columnCount: count("columnas", 100).required(),
    columnsPerBay: count("columnas por tramo", 20).default(2),
});

const createFloorZoneSchema = Joi.object({
    type: Joi.string().valid(ELEMENT_TYPES.FLOOR_ZONE).required().messages({
        "any.only": "El tipo debe ser estantería o zona de piso",
        "any.required": "Falta el tipo de elemento",
    }),
    ...placement,
    description,
});

// El alta depende del tipo: la estantería pide las medidas con las que se genera su disposición
export const createElementSchemaFor = (type) => (type === ELEMENT_TYPES.RACK ? createRackSchema : createFloorZoneSchema);

const positionSchema = Joi.object({
    _id: objectId,
    bayId: objectId.required(),
    label: label("una posición"),
    active: Joi.boolean().default(true),
    fixedProduct: objectId.allow(null).default(null),
});

const levelSchema = Joi.object({
    _id: objectId,
    label: label("un nivel"),
    positions: Joi.array().items(positionSchema).min(1).max(1000).required().messages({
        "array.min": "Cada nivel necesita al menos una posición",
        "array.max": "Un nivel no puede tener más de 1000 posiciones",
    }),
});

const columnSchema = Joi.object({
    _id: objectId,
    label: label("una columna"),
});

const baySchema = Joi.object({
    _id: objectId.required(),
    columns: Joi.array().items(columnSchema).min(1).max(20).required().messages({
        "array.min": "Cada tramo necesita al menos una columna",
        "array.max": "Un tramo no puede tener más de 20 columnas",
    }),
});

const updateRackSchema = Joi.object({
    ...placement,
    bays: Joi.array().items(baySchema).min(1).max(100).required().messages({
        "array.min": "La estantería necesita al menos un tramo",
        "array.max": "Una estantería no puede tener más de 100 tramos",
    }),
    levels: Joi.array().items(levelSchema).min(1).max(20).required().messages({
        "array.min": "La estantería necesita al menos un nivel",
        "array.max": "Una estantería no puede tener más de 20 niveles",
    }),
});

const updateFloorZoneSchema = Joi.object({ ...placement, description });

export const updateElementSchemaFor = (type) => (type === ELEMENT_TYPES.RACK ? updateRackSchema : updateFloorZoneSchema);

const planSize = Joi.number().min(1).max(1000).multiple(STEP).messages({
    "number.base": "El tamaño del plano debe ser un número",
    "number.min": "El tamaño del plano debe ser de al menos 1 metro",
    "number.max": "El tamaño del plano no puede pasar de 1000 metros",
    "number.multiple": "El tamaño del plano va de a 0,5 metros",
});

// Guardado del plano: varios elementos movidos o redimensionados a la vez, el tamaño elegido, o las dos cosas
export const layoutSchema = Joi.object({
    elements: Joi.array().items(Joi.object({
        _id: objectId.required(),
        x: coordinate,
        y: coordinate,
        sizeX: size,
        sizeY: size,
    })).min(1).unique("_id").messages({
        "array.min": "No hay cambios para guardar",
        "array.unique": "Hay un elemento repetido",
    }),
    planWidth: planSize,
    planHeight: planSize,
}).or("elements", "planWidth", "planHeight").messages({
    "object.missing": "No hay cambios para guardar",
});
