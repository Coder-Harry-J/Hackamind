/**
 * Mapper Service – Universal Product Schema → Marketplace Format
 *
 * Translates a UPS product entity into the format required by each
 * marketplace (Amazon SP-API, Shopify GraphQL, Flipkart REST).
 *
 * Each sub-mapper handles field renames, unit conversions, and
 * category taxonomy mapping for its target platform.
 */
import type { UniversalProduct } from "../../domain/entities/Product";
export interface AmazonListingItem {
    sku: string;
    product_type: string;
    attributes: Record<string, [{
        value: unknown;
        language_tag?: string;
        marketplace_id?: string;
    }]>;
    fulfillment_availability?: {
        fulfillment_channel_code: string;
        quantity: number;
    }[];
}
export declare function toAmazonFormat(product: UniversalProduct): AmazonListingItem;
export interface ShopifyProduct {
    title: string;
    descriptionHtml: string;
    vendor: string;
    productType: string;
    tags: string[];
    variants: {
        sku: string;
        price: string;
        compareAtPrice?: string;
        weight?: number;
        weightUnit?: string;
        inventoryQuantity: number;
        selectedOptions: {
            name: string;
            value: string;
        }[];
    }[];
    images: {
        src: string;
        altText?: string;
    }[];
    metafields: {
        namespace: string;
        key: string;
        value: string;
        type: string;
    }[];
}
export declare function toShopifyFormat(product: UniversalProduct): ShopifyProduct;
export interface FlipkartProduct {
    listing_id: string;
    sku_id: string;
    name: string;
    description: string;
    category: string;
    brand: string;
    mrp: number;
    selling_price: number;
    stock_count: number;
    images: string[];
    attributes: Record<string, string>;
}
export declare function toFlipkartFormat(product: UniversalProduct): FlipkartProduct;
