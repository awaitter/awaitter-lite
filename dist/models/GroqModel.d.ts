import { Model } from './ModelManager';
export declare class GroqModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=GroqModel.d.ts.map