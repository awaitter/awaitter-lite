import { Model } from './ModelManager';
export declare class GeminiModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=GeminiModel.d.ts.map