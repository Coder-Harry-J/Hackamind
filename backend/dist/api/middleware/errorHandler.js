"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.requestLogger = requestLogger;
function errorHandler(err, req, res, _next) {
    console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
    res.status(500).json({ error: "Internal Server Error", message: err.message });
}
function requestLogger(req, _res, next) {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
}
//# sourceMappingURL=errorHandler.js.map