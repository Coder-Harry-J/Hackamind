"use strict";
/**
 * Prisma Client Singleton
 * Prevents multiple instances in development hot-reload.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Placeholder – replace with actual Prisma import after `npm install @prisma/client`
// import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis;
// export const prisma = globalForPrisma.prisma ?? new PrismaClient({ log: ["query", "error"] });
// if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
/** Stub client – replace with real Prisma client after setup */
exports.prisma = {
    $connect: async () => console.log("🗄️  Database connected (stub)"),
    $disconnect: async () => console.log("🗄️  Database disconnected"),
};
exports.default = exports.prisma;
//# sourceMappingURL=client.js.map