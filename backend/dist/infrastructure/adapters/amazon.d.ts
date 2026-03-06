/**
 * Amazon SP-API Infrastructure Adapter
 *
 * Handles communication with the Amazon Selling Partner API.
 * Wraps SP-API calls with auth, rate limiting, and retry logic.
 *
 * Docs: https://developer-docs.amazon.com/sp-api/
 * Auth: LWA (Login with Amazon) OAuth2
 */
export interface AmanazonAdapterConfig {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    marketplaceId: string;
    region: "na" | "eu" | "fe";
}
export declare class AmazonAdapter {
    private config;
    constructor(config: AmanazonAdapterConfig);
    createListing(sku: string, payload: Record<string, unknown>): Promise<{
        status: string;
        submissionId: string;
    }>;
    updateListing(sku: string, payload: Record<string, unknown>): Promise<void>;
    deleteListing(sku: string): Promise<void>;
    private getAccessToken;
}
