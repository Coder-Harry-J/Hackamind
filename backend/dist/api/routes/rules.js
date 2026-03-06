"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rulesRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.rulesRouter = router;
router.get("/", async (_req, res) => {
    res.json({ data: [] });
});
router.post("/", async (req, res) => {
    res.status(201).json({ message: "Rule created (stub)" });
});
router.put("/:id", async (req, res) => {
    res.json({ message: "Rule updated (stub)" });
});
router.delete("/:id", async (req, res) => {
    res.status(204).send();
});
//# sourceMappingURL=rules.js.map