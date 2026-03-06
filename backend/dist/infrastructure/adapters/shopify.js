"use strict";
/**
 * Shopify GraphQL Admin API Adapter
 *
 * Uses the Shopify Admin GraphQL API 2025-01 for product sync.
 * Auth: Private app token (X-Shopify-Access-Token header).
 *
 * Docs: https://shopify.dev/docs/api/admin-graphql
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopifyAdapter = void 0;
const PRODUCT_CREATE_MUTATION = `
  mutation productCreate($input: ProductInput!, $media: [CreateMediaInput!]) {
    productCreate(input: $input, media: $media) {
      product { id handle }
      userErrors { field message }
    }
  }
`;
const PRODUCT_UPDATE_MUTATION = `
  mutation productUpdate($input: ProductInput!) {
    productUpdate(input: $input) {
      product { id }
      userErrors { field message }
    }
  }
`;
class ShopifyAdapter {
    constructor(config) {
        this.config = config;
        const version = config.apiVersion ?? "2025-01";
        this.baseUrl = `https://${config.shopDomain}/admin/api/${version}/graphql.json`;
    }
    async createProduct(product) {
        // TODO: Execute PRODUCT_CREATE_MUTATION via fetch
        // const res = await fetch(this.baseUrl, { method: "POST", ... })
        throw new Error("ShopifyAdapter.createProduct not yet implemented");
    }
    async updateProduct(shopifyId, product) {
        // TODO: Execute PRODUCT_UPDATE_MUTATION
        throw new Error("ShopifyAdapter.updateProduct not yet implemented");
    }
    async graphql(query, variables) {
        const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Shopify-Access-Token": this.config.accessToken,
            },
            body: JSON.stringify({ query, variables }),
        });
        if (!response.ok)
            throw new Error(`Shopify API error: ${response.status}`);
        const data = await response.json();
        if (data.errors?.length)
            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
        return data.data;
    }
}
exports.ShopifyAdapter = ShopifyAdapter;
//# sourceMappingURL=shopify.js.map