"use strict";
/**
 * Flipkart Seller API Adapter
 *
 * Communicates with Flipkart's REST Seller API.
 * Auth: HMAC-SHA256 signed requests.
 *
 * Docs: https://seller.flipkart.com/api-docs/
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlipkartAdapter = void 0;
const FLIPKART_BASE = "https://api.flipkart.net/sellers";
class FlipkartAdapter {
    constructor(config) {
        this.config = config;
    }
    async createListing(payload) {
        // POST /sku/listings
        throw new Error("FlipkartAdapter.createListing not yet implemented");
    }
    async updateListing(skuId, payload) {
        // PUT /sku/listings/{skuId}
        throw new Error("FlipkartAdapter.updateListing not yet implemented");
    }
    async updateInventory(skuId, quantity, price) {
        // POST /inventory/update
        throw new Error("FlipkartAdapter.updateInventory not yet implemented");
    }
    async request(path, method, body) {
        const response = await fetch(`${FLIPKART_BASE}${path}`, {
            method,
            headers: {
                Authorization: `Bearer ${this.config.token}`,
                "Content-Type": "application/json",
            },
            body: body ? JSON.stringify(body) : undefined,
        });
        if (!response.ok)
            throw new Error(`Flipkart API ${response.status}: ${await response.text()}`);
        return response.json();
    }
}
exports.FlipkartAdapter = FlipkartAdapter;
//# sourceMappingURL=flipkart.js.map