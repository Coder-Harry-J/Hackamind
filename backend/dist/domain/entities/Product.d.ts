/**
 * Universal Product Schema (UPS) – Core Domain Entity
 *
 * The UPS is the canonical, marketplace-agnostic representation of a product.
 * All raw input (CSV/JSON/API) is normalized INTO this schema.
 * All marketplace adapters read FROM this schema.
 *
 * This is the single source of truth for product data within LumeCatalog.
 */
export type ProductStatus = "draft" | "active" | "archived" | "pending_sync";
export type ConditionType = "new" | "used" | "refurbished";
export interface NormalizedAttribute {
    name: string;
    value: string | number | boolean;
    unit?: string;
    rawValue?: string;
    confidence: number;
}
export interface ProductVariant {
    variantId: string;
    sku: string;
    attributes: NormalizedAttribute[];
    price: Price;
    inventory: InventoryInfo;
    images: ProductImage[];
}
export interface Price {
    amount: number;
    currency: string;
    compareAtPrice?: number;
}
export interface InventoryInfo {
    quantity: number;
    warehouseId?: string;
    trackInventory: boolean;
}
export interface ProductImage {
    url: string;
    altText?: string;
    position: number;
    isPrimary: boolean;
}
export interface SyncStatus {
    channelId: string;
    lastSyncedAt?: Date;
    externalId?: string;
    status: "synced" | "pending" | "failed" | "not_listed";
    errorMessage?: string;
}
export interface AIMetadata {
    processingVersion: string;
    overallConfidence: number;
    extractedFrom: "csv" | "json" | "text" | "manual";
    suggestedCategory?: string;
    categoryConfidence?: number;
    changedFields: string[];
}
/**
 * The Universal Product Schema Entity
 */
export interface UniversalProduct {
    id: string;
    globalSku: string;
    gtin?: string;
    baseTitle: string;
    rawTitle?: string;
    description: string;
    shortDescription?: string;
    categoryPath: string[];
    brand?: string;
    manufacturer?: string;
    countryOfOrigin?: string;
    normalizedAttributes: NormalizedAttribute[];
    images: ProductImage[];
    variants: ProductVariant[];
    hasVariants: boolean;
    basePrice: Price;
    weight?: {
        value: number;
        unit: "kg" | "lb" | "g" | "oz";
    };
    dimensions?: {
        length: number;
        width: number;
        height: number;
        unit: "cm" | "in" | "mm";
    };
    status: ProductStatus;
    condition: ConditionType;
    syncStatuses: SyncStatus[];
    aiMetadata: AIMetadata;
    createdAt: Date;
    updatedAt: Date;
}
