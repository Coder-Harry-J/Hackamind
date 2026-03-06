"use strict";
/**
 * Validator Service – Category-Specific Validation Logic
 *
 * Validates a UniversalProduct against marketplace-specific
 * and category-specific rules before publishing.
 *
 * Rules are defined per category (electronics, clothing, food, etc.)
 * and per marketplace (Amazon, Shopify, Flipkart).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validator = exports.ValidatorService = void 0;
/**
 * Category-specific rules map.
 * Each entry defines required fields and field-level constraints.
 */
const CATEGORY_RULES = {
    electronics: { required: ["brand", "model", "voltage", "wattage"], maxTitleLength: 200 },
    clothing: { required: ["brand", "size", "color", "material", "gender"], maxTitleLength: 150 },
    food_beverage: { required: ["ingredients", "net_weight", "shelf_life", "allergens"], maxTitleLength: 100 },
    furniture: { required: ["dimensions", "material", "assembly_required", "weight"], maxTitleLength: 150 },
    books: { required: ["isbn", "author", "publisher", "pages", "language"], maxTitleLength: 200 },
    toys: { required: ["age_group", "safety_warnings", "material"], maxTitleLength: 150 },
    automotive: { required: ["compatible_make", "compatible_model", "compatible_year", "part_number"], maxTitleLength: 200 },
    generic: { required: ["brand"], maxTitleLength: 250 },
};
class ValidatorService {
    validate(product, category) {
        const rules = CATEGORY_RULES[category] ?? CATEGORY_RULES.generic;
        const errors = [];
        const warnings = [];
        // Required field checks
        for (const field of rules.required) {
            if (!product[field]) {
                errors.push({ field, code: "REQUIRED_FIELD_MISSING", message: `"${field}" is required for category "${category}"` });
            }
        }
        // Title length check
        const title = product["baseTitle"];
        if (title && title.length > rules.maxTitleLength) {
            warnings.push({
                field: "baseTitle",
                message: `Title exceeds recommended length of ${rules.maxTitleLength} characters`,
                suggestion: `Trim title to ${rules.maxTitleLength} characters for optimal indexing`,
            });
        }
        return { isValid: errors.length === 0, errors, warnings };
    }
}
exports.ValidatorService = ValidatorService;
exports.validator = new ValidatorService();
//# sourceMappingURL=index.js.map