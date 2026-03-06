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
export type SyncJobData = {
    productId: string;
    channel: "amazon" | "shopify" | "flipkart";
    operation: "create" | "update" | "delete";
    payload: Record<string, unknown>;
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
export declare class QueueWorker {
    start(): Promise<void>;
    enqueue(job: SyncJobData): Promise<string>;
    pause(channel?: SyncJobData["channel"]): Promise<void>;
    resume(channel?: SyncJobData["channel"]): Promise<void>;
}
export declare const queueWorker: QueueWorker;
