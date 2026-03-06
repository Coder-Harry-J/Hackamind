/**
 * LumeCatalog Backend – Entry Point
 * Clean Architecture / Domain-Driven Design
 *
 * Bootstraps Express server, registers middleware, routes, and
 * connects to infrastructure (MongoDB via Prisma, Redis/BullMQ).
 */
import "dotenv/config";
