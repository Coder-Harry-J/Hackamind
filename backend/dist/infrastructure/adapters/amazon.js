"use strict";
/**
 * Amazon SP-API Infrastructure Adapter
 *
 * Handles communication with the Amazon Selling Partner API.
 * Wraps SP-API calls with auth, rate limiting, and retry logic.
 *
 * Docs: https://developer-docs.amazon.com/sp-api/
 * Auth: LWA (Login with Amazon) OAuth2
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmazonAdapter = void 0;
class AmazonAdapter {
    constructor(config) {
        this.config = config;
    }
    async createListing(sku, payload) {
        // TODO: PUT /listings/2021-08-01/items/{sellerId}/{sku}
        // Headers: { Authorization: `Bearer ${await this.getAccessToken()}` }
        throw new Error("AmazonAdapter.createListing not yet implemented");
    }
    async updateListing(sku, payload) {
        // TODO: PATCH /listings/2021-08-01/items/{sellerId}/{sku}
        throw new Error("AmazonAdapter.updateListing not yet implemented");
    }
    async deleteListing(sku) {
        // TODO: DELETE /listings/2021-08-01/items/{sellerId}/{sku}
        throw new Error("AmazonAdapter.deleteListing not yet implemented");
    }
    async getAccessToken() {
        // POST https://api.amazon.com/auth/o2/token
        // grant_type=refresh_token, refresh_token, client_id, client_secret
        throw new Error("getAccessToken not yet implemented");
    }
}
exports.AmazonAdapter = AmazonAdapter;
//# sourceMappingURL=amazon.js.map