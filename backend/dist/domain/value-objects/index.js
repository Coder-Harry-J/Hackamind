"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Locale = exports.Price = exports.SKU = void 0;
/**
 * Value Object: SKU
 * An immutable identifier for a product-variant combination.
 * Enforces format: [PREFIX]-[CATEGORY]-[SEQUENCE] (e.g., "LMC-ELEC-00042")
 */
class SKU {
    constructor(raw) {
        const normalized = raw.trim().toUpperCase();
        if (!SKU.isValid(normalized)) {
            throw new Error(`Invalid SKU format: "${raw}". Expected [A-Z0-9-]+`);
        }
        this.value = normalized;
    }
    static isValid(sku) {
        return /^[A-Z0-9][A-Z0-9\-]{2,49}$/.test(sku);
    }
    static generate(prefix, category, seq) {
        const paddedSeq = String(seq).padStart(5, "0");
        return new SKU(`${prefix}-${category.slice(0, 4).toUpperCase()}-${paddedSeq}`);
    }
    toString() {
        return this.value;
    }
    equals(other) {
        return this.value === other.value;
    }
}
exports.SKU = SKU;
/**
 * Value Object: Price
 */
class Price {
    constructor(amount, currency, compareAtPrice) {
        this.amount = amount;
        this.currency = currency;
        this.compareAtPrice = compareAtPrice;
        if (amount < 0)
            throw new Error("Price amount cannot be negative");
        if (!/^[A-Z]{3}$/.test(currency))
            throw new Error(`Invalid currency code: ${currency}`);
    }
    toJSON() {
        return { amount: this.amount, currency: this.currency, compareAtPrice: this.compareAtPrice };
    }
}
exports.Price = Price;
/**
 * Value Object: Locale
 */
class Locale {
    constructor(tag) {
        this.tag = tag;
        // BCP 47 format: en-US, de-DE, hi-IN
        if (!/^[a-z]{2,3}(-[A-Z]{2})?$/.test(tag)) {
            throw new Error(`Invalid locale tag: ${tag}`);
        }
    }
    get language() { return this.tag.split("-")[0]; }
    get region() { return this.tag.split("-")[1]; }
    toString() { return this.tag; }
}
exports.Locale = Locale;
//# sourceMappingURL=index.js.map