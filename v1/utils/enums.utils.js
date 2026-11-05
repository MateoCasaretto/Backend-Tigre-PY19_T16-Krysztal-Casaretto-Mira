// Valores compartidos por modelos, validators y middlewares: nunca el string suelto
export const ROLES = Object.freeze({
    ADMINISTRATIVE: "Administrador",
    OPERATOR: "Operario",
});

export const CATALOG_FILE_TYPES = Object.freeze({
    XLSX: ".xlsx",
    CSV: ".csv",
});

// Elementos del plano de una planta (CU15)
export const ELEMENT_TYPES = Object.freeze({
    RACK: "rack",
    FLOOR_ZONE: "floorZone",
});

// Origen de cada alta o cambio de código de barras (RN69)
export const BARCODE_SOURCES = Object.freeze({
    MANUAL: "manual",
    IMPORT: "import",
});
