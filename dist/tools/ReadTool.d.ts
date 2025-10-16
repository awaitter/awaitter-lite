import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class ReadTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        file_path: {
            type: string;
            description: string;
        };
        offset: {
            type: string;
            description: string;
        };
        limit: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ file_path, offset, limit }: any): Promise<string>;
    needsConfirmation(): boolean;
}
//# sourceMappingURL=ReadTool.d.ts.map