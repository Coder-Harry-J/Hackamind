"use strict";
/**
 * LumeCatalog Backend – Entry Point
 * Clean Architecture / Domain-Driven Design
 *
 * Bootstraps Express server, registers middleware, routes, and
 * connects to infrastructure (MongoDB via Prisma, Redis/BullMQ).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const auth_1 = require("./api/routes/auth");
const products_1 = require("./api/routes/products");
const catalog_1 = require("./api/routes/catalog");
const sync_1 = require("./api/routes/sync");
const rules_1 = require("./api/routes/rules");
const errorHandler_1 = require("./api/middleware/errorHandler");
const requestLogger_1 = require("./api/middleware/requestLogger");
const client_1 = require("./infrastructure/database/client");
const worker_1 = require("./infrastructure/queue/worker");
const google_1 = __importDefault(require("./services/auth/google"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 4000;
// ── Middleware ────────────────────────────────────────────────
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? "http://localhost:3000",
    credentials: true, // needed for httpOnly cookie (refresh token)
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use((0, cookie_parser_1.default)());
app.use(google_1.default.initialize());
app.use(requestLogger_1.requestLogger);
// ── Routes ────────────────────────────────────────────────────
app.use("/api/v1/auth", auth_1.authRouter);
app.use("/api/v1/products", products_1.productRouter);
app.use("/api/v1/catalog", catalog_1.catalogRouter);
app.use("/api/v1/sync", sync_1.syncRouter);
app.use("/api/v1/rules", rules_1.rulesRouter);
// ── Health Check ──────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() });
});
// ── Error Handler ─────────────────────────────────────────────
app.use(errorHandler_1.errorHandler);
// ── Bootstrap ─────────────────────────────────────────────────
async function bootstrap() {
    await client_1.prisma.$connect();
    await worker_1.queueWorker.start();
    app.listen(PORT, () => {
        console.log(`🚀  LumeCatalog API running on http://localhost:${PORT}`);
    });
}
bootstrap().catch((err) => {
    console.error("Fatal startup error:", err);
    process.exit(1);
});
//# sourceMappingURL=main.js.map