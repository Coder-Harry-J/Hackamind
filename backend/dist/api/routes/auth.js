"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const google_1 = __importDefault(require("../../services/auth/google"));
const requireAuth_1 = require("../middleware/requireAuth");
const auth_1 = require("../controllers/auth");
exports.authRouter = (0, express_1.Router)();
// ── Credentials ───────────────────────────────────────────────
exports.authRouter.post("/register", auth_1.registerValidation, auth_1.register);
exports.authRouter.post("/login", auth_1.loginValidation, auth_1.login);
exports.authRouter.post("/refresh", auth_1.refreshToken);
exports.authRouter.post("/logout", auth_1.logout);
// ── Google OAuth ──────────────────────────────────────────────
exports.authRouter.get("/google", google_1.default.authenticate("google", { scope: ["profile", "email"], session: false }));
exports.authRouter.get("/google/callback", google_1.default.authenticate("google", { session: false, failureRedirect: "/api/v1/auth/google/fail" }), auth_1.googleCallback);
exports.authRouter.get("/google/fail", (_req, res) => {
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=google_auth_failed`);
});
// ── Protected ────────────────────────────────────────────────
exports.authRouter.get("/me", requireAuth_1.requireAuth, auth_1.me);
exports.authRouter.patch("/profile", requireAuth_1.requireAuth, auth_1.updateProfile);
exports.authRouter.post("/change-password", requireAuth_1.requireAuth, auth_1.changePassword);
//# sourceMappingURL=auth.js.map