import path from "node:path";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Product from "../models/product.model.js";
import CatalogImport from "../models/catalogImport.model.js";
import { catalogRowSchema } from "../validators/catalogImport.validator.js";
import { normalizeHeader, readSpreadsheet } from "../utils/spreadsheet.utils.js";
import { createError } from "../utils/error.utils.js";

// Columnas del catálogo: la misma lista arma el template y valida los archivos que se suben
const CATALOG_COLUMNS = [
    { field: "sapCode", header: "Código SAP", aliases: ["codigo", "material"], width: 18 },
    { field: "description", header: "Descripción", aliases: ["texto breve de material"], width: 50 },
    { field: "category", header: "Categoría", aliases: [], width: 12 },
    { field: "productLine", header: "Línea de producto", aliases: ["linea"], width: 25 },
];

const EXPECTED_COLUMNS = CATALOG_COLUMNS.map(({ header }) => header).join(", ");

const findColumnIndexes = (headerCells) => {
    const headers = headerCells.map(normalizeHeader);
    const indexes = {};
    const missing = [];

    for (const { field, header, aliases } of CATALOG_COLUMNS) {
        const names = [normalizeHeader(header), ...aliases];
        const index = headers.findIndex((name) => names.includes(name));
        if (index === -1) missing.push({ field, message: `Falta la columna ${header}` });
        else indexes[field] = index;
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

    // RN31: un código repetido dentro del archivo rechaza todas sus filas, porque no se sabe cuál es la correcta
    const rowsByCode = Map.groupBy(candidates, ({ product }) => product.sapCode);
    const products = [];
    for (const [sapCode, group] of rowsByCode) {
        if (group.length === 1) {
            products.push(group[0].product);
            continue;
        }
        const rowList = group.map(({ row }) => row).join(", ");
        for (const { row } of group) {
            rejections.push({ row, reason: `El código SAP ${sapCode} está repetido en las filas ${rowList}` });
        }
    }

    rejections.sort((a, b) => a.row - b.row);
    return { products, rejections };
};

export const importCatalog = async (file, userId) => {
    if (!file) throw createError(400, "Adjuntá un archivo Excel (.xlsx) o CSV en el campo file");

    const rows = await readSpreadsheet(file.buffer, path.extname(file.originalname).toLowerCase());
    const headerIndex = rows.findIndex((cells) => cells.some(Boolean));
    if (headerIndex === -1) throw createError(400, "El archivo está vacío");

    const columnIndexes = findColumnIndexes(rows[headerIndex]);
    const { products, rejections } = validateRows(rows, headerIndex, columnIndexes);

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
            const result = await Product.bulkWrite(
                products.map(({ sapCode, ...fields }) => ({
                    updateOne: { filter: { sapCode }, update: { $set: fields }, upsert: true },
                })),
                { session }
            );
            [catalogImport] = await CatalogImport.create([{
                fileName: file.originalname,
                importedRows: result.upsertedCount,
                updatedRows: result.matchedCount,
                rejectedRows: rejections.length,
                rejections,
                user: userId,
            }], { session });
        });
        return catalogImport;
    } catch (error) {
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

    const instructionsSheet = workbook.addWorksheet("Instrucciones");
    instructionsSheet.getColumn(1).width = 100;
    instructionsSheet.addRows([
        ["Cómo completar la plantilla"],
        ["Cargá un producto por fila en la hoja Catálogo, a partir de la fila 2. No cambies los encabezados."],
        ["Todas las columnas son obligatorias: Código SAP, Descripción, Categoría (A, B, C...) y Línea de producto."],
        ["El Código SAP no puede repetirse. Si ya existe en el sistema, se actualizan sus datos."],
        ["El stock y las ubicaciones no se cargan acá: se registran desde la aplicación."],
    ]);
    instructionsSheet.getRow(1).font = { bold: true };

    return Buffer.from(await workbook.xlsx.writeBuffer());
};
