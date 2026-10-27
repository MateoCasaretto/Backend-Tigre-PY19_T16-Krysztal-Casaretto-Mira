import * as catalogImportService from "../services/CatalogImportService.js";

export const createCatalogImport = async (req, res) => {
    const catalogImport = await catalogImportService.importCatalog(req.file, req.user.id);
    res.status(201).json({ message: "Catálogo importado", data: catalogImport });
};

export const downloadTemplate = async (req, res) => {
    const template = await catalogImportService.buildTemplate();
    res.attachment("plantilla-catalogo.xlsx");
    res.status(200).send(template);
};
