// Códigos GS1 de los envases: EAN-8, UPC-A (12), EAN-13 y DUN-14 / GTIN-14
const BARCODE_LENGTHS = [8, 12, 13, 14];

export const BARCODE_FORMAT_MESSAGE = "Debe ser un EAN-8, UPC-A, EAN-13 o DUN-14 (8, 12, 13 o 14 dígitos) con dígito verificador correcto";

// Dígito verificador GS1: desde la derecha, sin contar el verificador, los dígitos se multiplican por 3 y 1 alternados
export const isValidBarcode = (code) => {
    if (!/^\d+$/.test(code) || !BARCODE_LENGTHS.includes(code.length)) return false;
    const digits = [...code].map(Number);
    const checkDigit = digits.pop();
    const sum = digits.reverse().reduce((total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === checkDigit;
};
