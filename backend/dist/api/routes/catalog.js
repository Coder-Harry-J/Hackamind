"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.catalogRouter = void 0;
/**
 * API Route: Catalog – ingestion, bulk import, diff preview
 */
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.catalogRouter = router;
// POST /api/v1/catalog/import  – accepts CSV/JSON file, returns mapping preview
router.post("/import", async (req, res) => {
    res.json({ message: "Not implemented – wire up IngestService here" });
});
// GET /api/v1/catalog/health  – returns health stats
router.get("/health", async (_req, res) => {
    res.json({ totalProducts: 0, syncedProducts: 0, failedProducts: 0, aiProcessedToday: 0 });
});
//# sourceMappingURL=catalog.js.map