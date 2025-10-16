import { Model } from './ModelManager';
export declare class LocalModel implements Model {
    private url;
    private ollamaModelName;
    private modelName;
    constructor(config: any);
    chat(messages: any[], tools?: any[]): Promise<any>;
}
//# sourceMappingURL=LocalModel.d.ts.map