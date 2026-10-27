// Valores compartidos por modelos, validators y middlewares: nunca el string suelto
export const ROLES = Object.freeze({
    ADMINISTRATIVE: "administrative",
    OPERATOR: "operator",
});

export const CATALOG_FILE_TYPES = Object.freeze({
    XLSX: ".xlsx",
    CSV: ".csv",
});
