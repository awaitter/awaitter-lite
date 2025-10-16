export interface ModelSetupResult {
    ready: boolean;
    ollamaInstalled: boolean;
    modelDownloaded: boolean;
    ollamaModelName: string;
}
export declare class ModelSetup {
    /**
     * Verifies and prepares a local model for use
     */
    static setupLocalModel(modelName: string): Promise<ModelSetupResult>;
    /**
     * Check if Ollama is installed
     */
    private static checkOllamaInstalled;
    /**
     * Check if a model is downloaded
     */
    private static checkModelDownloaded;
    /**
     * Ask the user if they want to download the model
     */
    private static askToDownload;
    /**
     * Download a model using ollama pull
     */
    private static downloadModel;
    /**
     * Get the Ollama name for a model
     */
    static getOllamaModelName(modelName: string): string;
    /**
     * List all available local models
     */
    static listAvailableModels(): Promise<string[]>;
}
//# sourceMappingURL=ModelSetup.d.ts.map