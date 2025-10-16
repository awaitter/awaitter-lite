import { Model } from './ModelManager';
export declare class AnthropicModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    private convertMessages;
    private convertTools;
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=AnthropicModel.d.ts.map