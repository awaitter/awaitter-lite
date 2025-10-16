export interface ModelConfig {
    type: 'local' | 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'deepseek';
    url?: string;
    apiKey?: string;
    model?: string;
    name?: string;
    maxTokens?: number;
}
export interface ConfigData {
    defaultModel: string;
    models: Record<string, ModelConfig>;
    tools: Record<string, boolean>;
    ui: {
        streaming: boolean;
        showToolCalls: boolean;
        theme: string;
    };
    safety: {
        confirmBash: boolean;
        confirmWrite: boolean;
        confirmEdit: boolean;
    };
    agent: {
        maxIterations: number;
        thinkingMode: boolean;
        executionMode: 'unstoppable' | 'sprint' | 'step-by-step';
        showRoadmap: boolean;
        autoApproveSimpleTasks: boolean;
    };
}
export declare class Config {
    private conf;
    private configPath?;
    constructor(configPath?: string);
    private getDefaults;
    load(): Promise<void>;
    get<K extends keyof ConfigData>(key: K, defaultValue?: ConfigData[K]): ConfigData[K];
    set<K extends keyof ConfigData>(key: K, value: ConfigData[K]): void;
    getAll(): ConfigData;
    getConfigPath(): string;
}
//# sourceMappingURL=Config.d.ts.map