import ExcelJS from "exceljs";
import { parse } from "csv-parse/sync";
import { createError } from "./ErrorUtils.js";
import { CATALOG_FILE_TYPES } from "./Enums.js";

// Deja los encabezados comparables: sin tildes, en minúsculas y con espacios simples
export const normalizeHeader = (text) =>
    String(text ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();

const readXlsx = async (buffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return [];

    const rows = [];
    for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber);
        const cells = [];
        for (let column = 1; column <= worksheet.columnCount; column++) {
            cells.push(row.getCell(column).text.trim());
        }
        rows.push(cells);
    }
    return rows;
};

// Excel en Windows guarda los CSV en ANSI: si el texto no es UTF-8 válido se lee como Windows-1252
const decodeText = (buffer) => {
    const utf8 = new TextDecoder("utf-8").decode(buffer);
    return utf8.includes("�") ? new TextDecoder("windows-1252").decode(buffer) : utf8;
};

const readCsv = (buffer) => {
    const text = decodeText(buffer).replace(/^﻿/, "");
    // Excel con configuración regional en español separa con punto y coma
    const firstLine = text.split(/\r?\n/, 1)[0];
    const countOf = (character) => firstLine.split(character).length - 1;
    const delimiter = countOf(";") > countOf(",") ? ";" : ",";
    return parse(text, { delimiter, relax_column_count: true, trim: true });
};

// Devuelve las filas del archivo como listas de textos, con la fila 1 del archivo en la posición 0
export const readSpreadsheet = async (buffer, extension) => {
    try {
        return extension === CATALOG_FILE_TYPES.XLSX ? await readXlsx(buffer) : readCsv(buffer);
    } catch {
        throw createError(400, "No se pudo leer el archivo. Verificá que sea un Excel (.xlsx) o CSV válido");
    }
};
