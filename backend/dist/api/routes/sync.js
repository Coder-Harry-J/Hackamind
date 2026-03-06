"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.syncRouter = router;
// POST /api/v1/sync/:channel/:productId  – trigger a sync job
router.post("/:channel/:productId", async (req, res) => {
    const { channel, productId } = req.params;
    // TODO: queueWorker.enqueue({ productId, channel, operation: "update" })
    res.json({ jobId: "stub", channel, productId, status: "queued" });
});
// GET /api/v1/sync/status/:jobId
router.get("/status/:jobId", async (req, res) => {
    res.json({ jobId: req.params.jobId, status: "pending" });
});
//# sourceMappingURL=sync.js.map