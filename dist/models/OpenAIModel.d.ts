import { Model } from './ModelManager';
export declare class OpenAIModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=OpenAIModel.d.ts.map