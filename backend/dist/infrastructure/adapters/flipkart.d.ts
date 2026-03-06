/**
 * Flipkart Seller API Adapter
 *
 * Communicates with Flipkart's REST Seller API.
 * Auth: HMAC-SHA256 signed requests.
 *
 * Docs: https://seller.flipkart.com/api-docs/
 */
export interface FlipkartAdapterConfig {
    sellerId: string;
    token: string;
}
export declare class FlipkartAdapter {
    private config;
    constructor(config: FlipkartAdapterConfig);
    createListing(payload: Record<string, unknown>): Promise<{
        listingId: string;
    }>;
    updateListing(skuId: string, payload: Record<string, unknown>): Promise<void>;
    updateInventory(skuId: string, quantity: number, price: number): Promise<void>;
    private request;
}
