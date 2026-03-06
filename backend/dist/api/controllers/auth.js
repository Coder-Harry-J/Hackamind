"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginValidation = exports.registerValidation = void 0;
exports.register = register;
exports.login = login;
exports.refreshToken = refreshToken;
exports.logout = logout;
exports.googleCallback = googleCallback;
exports.me = me;
exports.updateProfile = updateProfile;
exports.changePassword = changePassword;
const express_validator_1 = require("express-validator");
const client_1 = require("../../infrastructure/database/client");
const password_1 = require("../../services/auth/password");
const jwt_1 = require("../../services/auth/jwt");
// ── Helpers ──────────────────────────────────────────────────
function issueTokens(userId, email, role) {
    const accessToken = (0, jwt_1.signAccessToken)({ sub: userId, email, role });
    const refreshToken = (0, jwt_1.signRefreshToken)(userId);
    return { accessToken, refreshToken };
}
async function saveRefreshToken(userId, token) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await client_1.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
}
function setRefreshCookie(res, token) {
    res.cookie("refresh_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7d ms
        path: "/api/v1/auth",
    });
}
// ── Validation rules ─────────────────────────────────────────
exports.registerValidation = [
    (0, express_validator_1.body)("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters")
        .matches(/[A-Z]/).withMessage("Must contain an uppercase letter")
        .matches(/[0-9]/).withMessage("Must contain a number"),
];
exports.loginValidation = [
    (0, express_validator_1.body)("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    (0, express_validator_1.body)("password").notEmpty().withMessage("Password required"),
];
// ── Controllers ──────────────────────────────────────────────
async function register(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { name, email, password } = req.body;
    const existing = await client_1.prisma.user.findUnique({ where: { email } });
    if (existing) {
        res.status(409).json({ error: "An account with this email already exists" });
        return;
    }
    const passwordHash = await (0, password_1.hashPassword)(password);
    const user = await client_1.prisma.user.create({ data: { name, email, passwordHash } });
    const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.role);
    await saveRefreshToken(user.id, refreshToken);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role, avatar: user.avatar },
    });
}
async function login(req, res) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    const { email, password } = req.body;
    const user = await client_1.prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }
    const valid = await (0, password_1.verifyPassword)(password, user.passwordHash);
    if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
    }
    const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.role);
    await saveRefreshToken(user.id, refreshToken);
    setRefreshCookie(res, refreshToken);
    res.json({
        accessToken,
        user: { id: user.id, name: user.name, email: user.email, plan: user.plan, role: user.role, avatar: user.avatar },
    });
}
async function refreshToken(req, res) {
    const token = req.cookies?.refresh_token;
    if (!token) {
        res.status(401).json({ error: "Missing refresh token" });
        return;
    }
    let payload;
    try {
        payload = (0, jwt_1.verifyRefreshToken)(token);
    }
    catch {
        res.status(401).json({ error: "Invalid or expired refresh token" });
        return;
    }
    const stored = await client_1.prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
        res.status(401).json({ error: "Refresh token revoked or expired" });
        return;
    }
    const user = await client_1.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
        res.status(401).json({ error: "User not found" });
        return;
    }
    // Rotate: revoke old, issue new
    await client_1.prisma.refreshToken.update({ where: { token }, data: { revoked: true } });
    const { accessToken, refreshToken: newRefreshToken } = issueTokens(user.id, user.email, user.role);
    await saveRefreshToken(user.id, newRefreshToken);
    setRefreshCookie(res, newRefreshToken);
    res.json({ accessToken });
}
async function logout(req, res) {
    const token = req.cookies?.refresh_token;
    if (token) {
        await client_1.prisma.refreshToken.updateMany({
            where: { token },
            data: { revoked: true },
        }).catch(() => { });
    }
    res.clearCookie("refresh_token", { path: "/api/v1/auth" });
    res.status(204).send();
}
async function googleCallback(req, res) {
    // user is attached by passport in the route
    const user = req.user;
    if (!user) {
        res.redirect(`${process.env.FRONTEND_URL ?? "http://localhost:3000"}/login?error=oauth_failed`);
        return;
    }
    const { accessToken, refreshToken } = issueTokens(user.id, user.email, user.role);
    await saveRefreshToken(user.id, refreshToken);
    setRefreshCookie(res, refreshToken);
    // Redirect to frontend with access token in query param (frontend reads + stores it)
    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${accessToken}`);
}
async function me(req, res) {
    const user = await client_1.prisma.user.findUnique({
        where: { id: req.user.sub },
        select: { id: true, name: true, email: true, avatar: true, plan: true, role: true, googleId: true, createdAt: true },
    });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    res.json({ user });
}
async function updateProfile(req, res) {
    const { name, avatar } = req.body;
    const user = await client_1.prisma.user.update({
        where: { id: req.user.sub },
        data: { ...(name && { name }), ...(avatar && { avatar }) },
        select: { id: true, name: true, email: true, avatar: true, plan: true, role: true },
    });
    res.json({ user });
}
async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;
    const user = await client_1.prisma.user.findUnique({ where: { id: req.user.sub } });
    if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
    }
    if (user.passwordHash) {
        const valid = await (0, password_1.verifyPassword)(currentPassword, user.passwordHash);
        if (!valid) {
            res.status(400).json({ error: "Current password is incorrect" });
            return;
        }
    }
    if (newPassword.length < 8) {
        res.status(400).json({ error: "New password must be at least 8 characters" });
        return;
    }
    const passwordHash = await (0, password_1.hashPassword)(newPassword);
    await client_1.prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    // Revoke all existing refresh tokens (force re-login everywhere)
    await client_1.prisma.refreshToken.updateMany({ where: { userId: user.id }, data: { revoked: true } });
    res.json({ message: "Password updated. Please sign in again." });
}
//# sourceMappingURL=auth.js.map