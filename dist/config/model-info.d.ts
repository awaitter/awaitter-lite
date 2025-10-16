/**
 * Model information database for benchmark display
 */
export interface ModelInfo {
    name: string;
    displayName: string;
    provider: string;
    contextWindow: number;
    cost: string;
    speed: 'instant' | 'very-fast' | 'fast' | 'medium' | 'slow';
    quality: 'excellent' | 'very-good' | 'good' | 'fair';
    rateLimit: string;
    useCase: string;
    notes?: string;
}
export declare const MODEL_INFO: Record<string, ModelInfo>;
export declare function getModelInfo(modelName: string): ModelInfo | undefined;
export declare function getAllModelInfo(): ModelInfo[];
//# sourceMappingURL=model-info.d.ts.map