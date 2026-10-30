import * as productService from "../services/product.service.js";
import { assignBarcodeSchema, listProductsSchema } from "../validators/product.validator.js";
import { validateWith } from "../utils/validation.utils.js";

export const listProducts = async (req, res) => {
    const query = validateWith(listProductsSchema, req.query);
    const { products, pagination } = await productService.listProducts(query);
    res.status(200).json({ message: "Productos", data: products, pagination });
};

export const findProductByBarcode = async (req, res) => {
    const product = await productService.findProductByBarcode(req.params.barcode);
    res.status(200).json({ message: "Producto encontrado", data: product });
};

export const assignBarcode = async (req, res) => {
    const { barcode } = validateWith(assignBarcodeSchema, req.body);
    const { product, changed } = await productService.assignBarcode(req.params.id, barcode, req.user.userId);
    const message = changed ? "Código de barras asociado" : "El producto ya tenía ese código de barras";
    res.status(200).json({ message, data: product });
};
