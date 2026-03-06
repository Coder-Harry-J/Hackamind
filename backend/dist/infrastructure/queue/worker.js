"use strict";
/**
 * BullMQ Queue Worker – Rate-Limited Sync Jobs
 *
 * Processes channel sync jobs with per-marketplace rate limit enforcement:
 *  - Amazon SP-API: 5 req/s burst, 1 req/s sustained
 *  - Shopify GraphQL: 50 points/s  (cost-based)
 *  - Flipkart REST:  2 req/s
 *
 * Queue: Redis-backed via BullMQ.
 * Pattern: Concurrency-limited worker with exponential backoff on failures.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueWorker = exports.QueueWorker = void 0;
const RATE_LIMITS = {
    amazon: { concurrency: 5, ratePerSecond: 1 },
    shopify: { concurrency: 10, ratePerSecond: 50 },
    flipkart: { concurrency: 3, ratePerSecond: 2 },
};
/**
 * QueueWorker
 *
 * Usage:
 *   await queueWorker.start();
 *   await queueWorker.enqueue({ productId, channel, operation, payload });
 *
 * TODO: Replace stub with real BullMQ implementation after installing redis.
 */
class QueueWorker {
    async start() {
        console.log("🔄  Queue worker initialized (stub – plug in BullMQ + Redis)");
        console.log("   Rate limits:", JSON.stringify(RATE_LIMITS));
    }
    async enqueue(job) {
        // TODO: Implement with BullMQ
        // const queue = new Queue("sync", { connection: redisClient });
        // const j = await queue.add(job.channel, job, {
        //   attempts: 5,
        //   backoff: { type: "exponential", delay: 2000 },
        //   removeOnComplete: 100,
        //   removeOnFail: 500,
        // });
        // return j.id!;
        console.log(`Enqueued sync job: ${job.operation} ${job.productId} → ${job.channel}`);
        return `stub-job-${Date.now()}`;
    }
    async pause(channel) {
        // TODO: Queue.pause()
        console.log(`Paused queue${channel ? ` for ${channel}` : ""}`);
    }
    async resume(channel) {
        // TODO: Queue.resume()
        console.log(`Resumed queue${channel ? ` for ${channel}` : ""}`);
    }
}
exports.QueueWorker = QueueWorker;
exports.queueWorker = new QueueWorker();
//# sourceMappingURL=worker.js.map