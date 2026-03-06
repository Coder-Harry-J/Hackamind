/**
 * Shopify GraphQL Admin API Adapter
 *
 * Uses the Shopify Admin GraphQL API 2025-01 for product sync.
 * Auth: Private app token (X-Shopify-Access-Token header).
 *
 * Docs: https://shopify.dev/docs/api/admin-graphql
 */
export interface ShopifyAdapterConfig {
    shopDomain: string;
    accessToken: string;
    apiVersion?: string;
}
export declare class ShopifyAdapter {
    private config;
    private readonly baseUrl;
    constructor(config: ShopifyAdapterConfig);
    createProduct(product: Record<string, unknown>): Promise<{
        id: string;
        handle: string;
    }>;
    updateProduct(shopifyId: string, product: Record<string, unknown>): Promise<void>;
    private graphql;
}
