/**
 * AI Processor Service – LLM Chain Orchestration
 *
 * Responsibilities:
 *  1. Receive raw product data (CSV row / JSON blob / free text)
 *  2. Call the LLM (OpenAI GPT-4o / Gemini Pro) to extract & normalize attributes
 *  3. Compute per-field confidence scores
 *  4. Return a partial UniversalProduct ready for UPS merge
 *
 * Pattern: LangChain / Vercel AI SDK chain with structured output (Zod)
 */
export interface RawProductInput {
    source: "csv" | "json" | "text";
    rawData: Record<string, unknown> | string;
    existingProduct?: Partial<unknown>;
}
export interface AIProcessingResult {
    normalizedFields: Record<string, unknown>;
    confidence: Record<string, number>;
    suggestedCategory: string;
    categoryConfidence: number;
    changedFields: string[];
    processingTimeMs: number;
}
/**
 * AIProcessorService
 *
 * Usage:
 *   const result = await aiProcessor.normalize(rawInput);
 *
 * The chain:
 *  rawData → [Field Extraction Prompt] → [Normalization Prompt] →
 *  [Category Classification] → [Confidence Scoring] → AIProcessingResult
 */
export declare class AIProcessorService {
    /**
     * Normalize raw product data using LLM.
     * Replace TODO with actual LangChain / AI SDK implementation.
     */
    normalize(input: RawProductInput): Promise<AIProcessingResult>;
    /**
     * Extract specific attributes from unstructured text.
     * e.g., "Red 100% cotton t-shirt, M, machine washable"
     * → { color: "red", material: "cotton", size: "M", care: "machine washable" }
     */
    extractAttributes(text: string): Promise<Record<string, string>>;
}
export declare const aiProcessor: AIProcessorService;
