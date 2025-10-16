/**
 * Model-Specific Optimizations
 * Fine-tuned parameters for each model to maximize code generation quality
 */
export interface ModelConfig {
    temperature: number;
    maxTokens: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stopSequences?: string[];
    reasoning?: {
        enabled: boolean;
        budget?: number;
    };
}
export declare const MODEL_CONFIGS: Record<string, ModelConfig>;
/**
 * Get optimized config for a model
 */
export declare function getModelConfig(modelName: string): ModelConfig;
/**
 * Reasoning modes for different task complexities
 */
export declare const REASONING_MODES: {
    QUICK: {
        temperature: number;
        reasoning: {
            enabled: boolean;
        };
    };
    STANDARD: {
        temperature: number;
        reasoning: {
            enabled: boolean;
            budget: number;
        };
    };
    DEEP: {
        temperature: number;
        reasoning: {
            enabled: boolean;
            budget: number;
        };
    };
};
/**
 * Task-specific parameter adjustments
 */
export declare function getTaskOptimizedConfig(baseConfig: ModelConfig, taskType: 'debug' | 'implement' | 'refactor' | 'explain' | 'architecture'): ModelConfig;
//# sourceMappingURL=model-configs.d.ts.map