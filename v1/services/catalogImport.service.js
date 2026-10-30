import path from "node:path";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Product from "../models/product.model.js";
import CatalogImport from "../models/catalogImport.model.js";
import { catalogRowSchema } from "../validators/catalogImport.validator.js";
import { normalizeHeader, readSpreadsheet } from "../utils/spreadsheet.utils.js";
import { createError } from "../utils/error.utils.js";
import { BARCODE_SOURCES } from "../utils/enums.utils.js";

// Columnas del catálogo: la misma lista arma el template y valida los archivos que se suben
const CATALOG_COLUMNS = [
    { field: "sapCode", header: "Código SAP", aliases: ["codigo", "material"], width: 18 },
    { field: "description", header: "Descripción", aliases: ["texto breve de material"], width: 50 },
    { field: "category", header: "Categoría", aliases: [], width: 12 },
    { field: "productLine", header: "Línea de producto", aliases: ["linea"], width: 25 },
    { field: "barcode", header: "Código de barras", aliases: ["ean", "gtin", "dun"], width: 18, optional: true },
];

const EXPECTED_COLUMNS = CATALOG_COLUMNS
    .map(({ header, optional }) => (optional ? `${header} (opcional)` : header))
    .join(", ");

const findColumnIndexes = (headerCells) => {
    const headers = headerCells.map(normalizeHeader);
    const indexes = {};
    const missing = [];

    for (const { field, header, aliases, optional } of CATALOG_COLUMNS) {
        const names = [normalizeHeader(header), ...aliases];
        const index = headers.findIndex((name) => names.includes(name));
        if (index !== -1) indexes[field] = index;
        else if (!optional) missing.push({ field, message: `Falta la columna ${header}` });
    }

    if (missing.length) {
        throw createError(400, `El archivo no tiene las columnas esperadas: ${EXPECTED_COLUMNS}`, missing);
    }
    return indexes;
};

const validateRows = (rows, headerIndex, columnIndexes) => {
    const candidates = [];
    const rejections = [];

    for (let index = headerIndex + 1; index < rows.length; index++) {
        const cells = rows[index];
        if (cells.every((cell) => !cell)) continue;

        const row = index + 1;
        const values = Object.fromEntries(
            CATALOG_COLUMNS.map(({ field }) => [field, cells[columnIndexes[field]] ?? ""])
        );
        const { value, error } = catalogRowSchema.validate(values, { abortEarly: false });

        if (error) rejections.push({ row, reason: error.details.map(({ message }) => message).join("; ") });
        else candidates.push({ row, product: value });
    }

    // RN31: un código SAP repetido dentro del archivo rechaza todas sus filas, porque no se sabe cuál es la correcta
    const uniqueBySapCode = rejectRepeated(candidates, ({ product }) => product.sapCode, "El código SAP", rejections);
    // RN65: lo mismo con un código de barras puesto en más de un producto
    const withBarcode = uniqueBySapCode.filter(({ product }) => product.barcode);
    const uniqueBarcodeRows = new Set(
        rejectRepeated(withBarcode, ({ product }) => product.barcode, "El código de barras", rejections).map(({ row }) => row)
    );
    const accepted = uniqueBySapCode.filter(({ row, product }) => !product.barcode || uniqueBarcodeRows.has(row));

    return { candidates: accepted, rejections };
};

// Deja pasar las filas cuyo valor es único en el archivo y rechaza todas las que lo repiten
const rejectRepeated = (candidates, keyOf, label, rejections) => {
    const unique = [];
    for (const [key, group] of Map.groupBy(candidates, keyOf)) {
        if (group.length === 1) {
            unique.push(group[0]);
            continue;
        }
        const rowList = group.map(({ row }) => row).join(", ");
        for (const { row } of group) {
            rejections.push({ row, reason: `${label} ${key} está repetido en las filas ${rowList}` });
        }
    }
    return unique;
};

// CU19 E1: un código de barras que en la base ya es de otro producto rechaza la fila
const rejectBarcodesOfOtherProducts = async (candidates, rejections) => {
    const barcodes = candidates.map(({ product }) => product.barcode).filter(Boolean);
    const owners = await Product.find({ barcode: { $in: barcodes } }, "sapCode description barcode");
    const ownerByBarcode = new Map(owners.map((owner) => [owner.barcode, owner]));

    return candidates.filter(({ row, product }) => {
        const owner = ownerByBarcode.get(product.barcode);
        if (!owner || owner.sapCode === product.sapCode) return true;
        rejections.push({
            row,
            reason: `El código de barras ${product.barcode} ya está asociado al producto ${owner.sapCode} - ${owner.description}`,
        });
        return false;
    });
};

// Arma la actualización de cada producto; el código de barras solo se toca si viene y cambia (RN66 y RN69)
const buildProductUpdates = async (products, userId, session) => {
    const existing = await Product.find(
        { sapCode: { $in: products.map(({ sapCode }) => sapCode) } },
        "sapCode barcode",
        { session }
    );
    const currentBarcodes = new Map(existing.map(({ sapCode, barcode }) => [sapCode, barcode]));
    let assignedBarcodes = 0;

    const operations = products.map(({ sapCode, barcode, ...fields }) => {
        const update = { $set: fields };
        const previousBarcode = currentBarcodes.get(sapCode);
        if (barcode && barcode !== previousBarcode) {
            assignedBarcodes++;
            update.$set.barcode = barcode;
            update.$push = {
                barcodeHistory: { barcode, previousBarcode, source: BARCODE_SOURCES.IMPORT, user: userId, date: new Date() },
            };
        }
        return { updateOne: { filter: { sapCode }, update, upsert: true } };
    });
    return { operations, assignedBarcodes };
};

export const importCatalog = async (file, userId) => {
    if (!file) throw createError(400, "Adjuntá un archivo Excel (.xlsx) o CSV en el campo file");

    const rows = await readSpreadsheet(file.buffer, path.extname(file.originalname).toLowerCase());
    const headerIndex = rows.findIndex((cells) => cells.some(Boolean));
    if (headerIndex === -1) throw createError(400, "El archivo está vacío");

    const columnIndexes = findColumnIndexes(rows[headerIndex]);
    const validated = validateRows(rows, headerIndex, columnIndexes);
    const { rejections } = validated;
    const candidates = await rejectBarcodesOfOtherProducts(validated.candidates, rejections);
    const products = candidates.map(({ product }) => product);
    rejections.sort((a, b) => a.row - b.row);

    if (!products.length) {
        throw createError(
            400,
            "No se importó ningún producto: ninguna fila es válida",
            rejections.map(({ row, reason }) => ({ field: `fila ${row}`, message: reason }))
        );
    }

    const session = await mongoose.startSession();
    try {
        let catalogImport;
        await session.withTransaction(async () => {
            // Solo se pisan los campos del catálogo: el resto del producto (stock, ubicaciones) no se toca
            const { operations, assignedBarcodes } = await buildProductUpdates(products, userId, session);
            const result = await Product.bulkWrite(operations, { session });
            [catalogImport] = await CatalogImport.create([{
                fileName: file.originalname,
                importedRows: result.upsertedCount,
                updatedRows: result.matchedCount,
                rejectedRows: rejections.length,
                assignedBarcodes,
                rejections,
                user: userId,
            }], { session });
        });
        return catalogImport;
    } catch (error) {
        // Otro administrativo asoció uno de los códigos de barras mientras se importaba
        if (error.code === 11000) {
            throw createError(409, "Un código de barras del archivo se asoció a otro producto durante la importación. El catálogo no se modificó: volvé a importarlo");
        }
        // ER1: si la base falla a mitad de camino la transacción se revierte entera
        if (error.name?.startsWith("Mongo")) {
            throw createError(503, "No fue posible completar la importación. El catálogo no se modificó");
        }
        throw error;
    } finally {
        await session.endSession();
    }
};

export const buildTemplate = async () => {
    const workbook = new ExcelJS.Workbook();

    const catalogSheet = workbook.addWorksheet("Catálogo", { views: [{ state: "frozen", ySplit: 1 }] });
    catalogSheet.columns = CATALOG_COLUMNS.map(({ field, header, width }) => ({ key: field, header, width }));
    catalogSheet.getRow(1).font = { bold: true };
    // Como texto, para que Excel no le saque los ceros a la izquierda al código SAP
    catalogSheet.getColumn("sapCode").numFmt = "@";
    catalogSheet.getColumn("barcode").numFmt = "@";

    const instructionsSheet = workbook.addWorksheet("Instrucciones");
    instructionsSheet.getColumn(1).width = 100;
    instructionsSheet.addRows([
        ["Cómo completar la plantilla"],
        ["Cargá un producto por fila en la hoja Catálogo, a partir de la fila 2. No cambies los encabezados."],
        ["Son obligatorias las columnas Código SAP, Descripción, Categoría (A, B, C...) y Línea de producto."],
        ["El Código SAP no puede repetirse. Si ya existe en el sistema, se actualizan sus datos."],
        ["Código de barras es opcional: el EAN-8, UPC-A, EAN-13 o DUN-14 impreso en el envase. Cada código va en un solo producto."],
        ["Si la celda del código de barras queda vacía, el producto conserva el que ya tenía."],
        ["El stock y las ubicaciones no se cargan acá: se registran desde la aplicación."],
    ]);
    instructionsSheet.getRow(1).font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
};
