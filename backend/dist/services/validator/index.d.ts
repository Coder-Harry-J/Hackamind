/**
 * Validator Service – Category-Specific Validation Logic
 *
 * Validates a UniversalProduct against marketplace-specific
 * and category-specific rules before publishing.
 *
 * Rules are defined per category (electronics, clothing, food, etc.)
 * and per marketplace (Amazon, Shopify, Flipkart).
 */
export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}
export interface ValidationError {
    field: string;
    code: string;
    message: string;
}
export interface ValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}
export type ValidatorCategory = "electronics" | "clothing" | "food_beverage" | "furniture" | "books" | "toys" | "automotive" | "generic";
export declare class ValidatorService {
    validate(product: Record<string, unknown>, category: ValidatorCategory): ValidationResult;
}
export declare const validator: ValidatorService;
