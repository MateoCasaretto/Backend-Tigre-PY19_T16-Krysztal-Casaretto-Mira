import Product from "../models/product.model.js";
import { assignBarcodeSchema } from "../validators/product.validator.js";
import { BARCODE_SOURCES } from "../utils/enums.utils.js";
import { createError } from "../utils/error.utils.js";
import { validateWith } from "../utils/validation.utils.js";

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const describe = (product) => `${product.sapCode} - ${product.description}`;

// Busca por código SAP o descripción (parcial) o por código de barras (exacto)
export const listProducts = async ({ search, page, limit }) => {
    const filter = {};
    if (search) {
        const pattern = new RegExp(escapeRegex(search), "i");
        filter.$or = [{ sapCode: pattern }, { description: pattern }, { barcode: search }];
    }

    const [products, total] = await Promise.all([
        Product.find(filter).sort({ sapCode: 1 }).skip((page - 1) * limit).limit(limit),
        Product.countDocuments(filter),
    ]);
    return { products, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
};

// CU19 A2: traduce el código de barras al producto y su código SAP
export const findProductByBarcode = async (code) => {
    const { barcode } = validateWith(assignBarcodeSchema, { barcode: code });
    const product = await Product.findOne({ barcode });
    // E3
    if (!product) throw createError(404, `El código de barras ${barcode} no tiene correspondencia registrada. Buscá el producto por código SAP o nombre`);
    return product;
};

// CU19 flujo principal y A1: asociar o reemplazar el código de barras del producto
export const assignBarcode = async (productId, barcode, userId) => {
    const product = await Product.findById(productId);
    if (!product) throw createError(404, "Producto no encontrado");
    if (product.barcode === barcode) return { product, changed: false };

    // E1
    const owner = await Product.findOne({ barcode, _id: { $ne: product._id } });
    if (owner) throw createError(409, `El código de barras ${barcode} ya está asociado al producto ${describe(owner)}`);

    try {
        const updated = await Product.findByIdAndUpdate(
            product._id,
            {
                $set: { barcode },
                $push: {
                    barcodeHistory: {
                        barcode,
                        previousBarcode: product.barcode,
                        source: BARCODE_SOURCES.MANUAL,
                        user: userId,
                    },
                },
            },
            { new: true, runValidators: true }
        );
        return { product: updated, changed: true };
    } catch (error) {
        // Otro administrativo lo asoció entre la verificación y el guardado: el índice único lo frena
        if (error.code === 11000) throw createError(409, `El código de barras ${barcode} ya está asociado a otro producto`);
        // ER1
        if (error.name?.startsWith("Mongo")) throw createError(503, "No fue posible registrar la asociación. El producto no se modificó");
        throw error;
    }
};
