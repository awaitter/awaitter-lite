import { Model } from './ModelManager';
export declare class DeepSeekModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=DeepSeekModel.d.ts.map