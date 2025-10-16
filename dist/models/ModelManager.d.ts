import { Config } from '../config/Config';
export interface Model {
    chat(messages: any[], tools?: any[]): Promise<any>;
}
export declare class ModelManager {
    private config;
    private currentModel;
    private currentModelName;
    constructor(config: Config);
    setModel(modelName: string): Promise<void>;
    chat(messages: any[], tools?: any[]): Promise<any>;
    getCurrentModelName(): string;
}
//# sourceMappingURL=ModelManager.d.ts.map