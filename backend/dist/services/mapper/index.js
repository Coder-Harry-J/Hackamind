"use strict";
/**
 * Mapper Service – Universal Product Schema → Marketplace Format
 *
 * Translates a UPS product entity into the format required by each
 * marketplace (Amazon SP-API, Shopify GraphQL, Flipkart REST).
 *
 * Each sub-mapper handles field renames, unit conversions, and
 * category taxonomy mapping for its target platform.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.toAmazonFormat = toAmazonFormat;
exports.toShopifyFormat = toShopifyFormat;
exports.toFlipkartFormat = toFlipkartFormat;
function toAmazonFormat(product) {
    const attributes = {
        item_name: [{ value: product.baseTitle, language_tag: "en_US", marketplace_id: "ATVPDKIKX0ER" }],
        product_description: [{ value: product.description }],
        brand: [{ value: product.brand ?? "Generic" }],
        list_price: [{ value: { currency: product.basePrice.currency, amount: product.basePrice.amount } }],
    };
    // Map normalized attributes
    for (const attr of product.normalizedAttributes) {
        const key = attr.name.toLowerCase().replace(/\s+/g, "_");
        const val = attr.unit ? `${attr.value} ${attr.unit}` : attr.value;
        attributes[key] = [{ value: val }];
    }
    return {
        sku: product.globalSku,
        product_type: product.categoryPath.at(-1)?.toUpperCase() ?? "PRODUCT",
        attributes,
        fulfillment_availability: [{ fulfillment_channel_code: "DEFAULT", quantity: product.variants[0]?.inventory.quantity ?? 0 }],
    };
}
function toShopifyFormat(product) {
    return {
        title: product.baseTitle,
        descriptionHtml: `<p>${product.description}</p>`,
        vendor: product.brand ?? product.manufacturer ?? "LumeCatalog",
        productType: product.categoryPath.at(-1) ?? "Product",
        tags: product.categoryPath,
        variants: product.variants.map((v) => ({
            sku: v.sku,
            price: String(v.price.amount),
            compareAtPrice: v.price.compareAtPrice ? String(v.price.compareAtPrice) : undefined,
            weight: product.weight?.value,
            weightUnit: product.weight?.unit?.toUpperCase(),
            inventoryQuantity: v.inventory.quantity,
            selectedOptions: v.attributes.map((a) => ({ name: String(a.name), value: String(a.value) })),
        })),
        images: product.images.map((img) => ({ src: img.url, altText: img.altText })),
        metafields: product.normalizedAttributes
            .filter((a) => a.confidence > 0.8)
            .map((a) => ({
            namespace: "lumecatalog",
            key: a.name,
            value: String(a.value),
            type: "single_line_text_field",
        })),
    };
}
function toFlipkartFormat(product) {
    return {
        listing_id: product.id,
        sku_id: product.globalSku,
        name: product.baseTitle,
        description: product.description,
        category: product.categoryPath.join(" > "),
        brand: product.brand ?? "Generic",
        mrp: product.basePrice.compareAtPrice ?? product.basePrice.amount,
        selling_price: product.basePrice.amount,
        stock_count: product.variants.reduce((sum, v) => sum + v.inventory.quantity, 0),
        images: product.images.slice(0, 8).map((i) => i.url),
        attributes: Object.fromEntries(product.normalizedAttributes.map((a) => [a.name, `${a.value}${a.unit ? ` ${a.unit}` : ""}`])),
    };
}
//# sourceMappingURL=index.js.map