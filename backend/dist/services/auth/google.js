"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_google_oauth20_1 = require("passport-google-oauth20");
const client_1 = require("../../infrastructure/database/client");
passport_1.default.use(new passport_google_oauth20_1.Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    callbackURL: process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/api/v1/auth/google/callback",
}, async (_accessToken, _refreshToken, profile, done) => {
    try {
        const email = profile.emails?.[0]?.value;
        const avatar = profile.photos?.[0]?.value;
        const name = profile.displayName ?? email ?? "Google User";
        if (!email)
            return done(new Error("No email from Google"), undefined);
        // Find existing user by googleId or email
        let user = await client_1.prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email }] },
        });
        if (user) {
            // Link Google account if not already linked
            if (!user.googleId) {
                user = await client_1.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: profile.id, avatar: avatar ?? user.avatar },
                });
            }
        }
        else {
            // Create new user
            user = await client_1.prisma.user.create({
                data: { name, email, googleId: profile.id, avatar },
            });
        }
        return done(null, user);
    }
    catch (err) {
        return done(err, undefined);
    }
}));
exports.default = passport_1.default;
//# sourceMappingURL=google.js.map