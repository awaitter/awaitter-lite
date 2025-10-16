import { Model } from './ModelManager';
export declare class GrokModel implements Model {
    private client;
    private model;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=GrokModel.d.ts.map