/**
 * Value Object: SKU
 * An immutable identifier for a product-variant combination.
 * Enforces format: [PREFIX]-[CATEGORY]-[SEQUENCE] (e.g., "LMC-ELEC-00042")
 */
export declare class SKU {
    private readonly value;
    constructor(raw: string);
    static isValid(sku: string): boolean;
    static generate(prefix: string, category: string, seq: number): SKU;
    toString(): string;
    equals(other: SKU): boolean;
}
/**
 * Value Object: Price
 */
export declare class Price {
    readonly amount: number;
    readonly currency: string;
    readonly compareAtPrice?: number | undefined;
    constructor(amount: number, currency: string, compareAtPrice?: number | undefined);
    toJSON(): {
        amount: number;
        currency: string;
        compareAtPrice: number | undefined;
    };
}
/**
 * Value Object: Locale
 */
export declare class Locale {
    readonly tag: string;
    constructor(tag: string);
    get language(): string;
    get region(): string | undefined;
    toString(): string;
}
