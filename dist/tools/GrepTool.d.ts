import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GrepTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        pattern: {
            type: string;
            description: string;
        };
        path: {
            type: string;
            description: string;
        };
        glob_pattern: {
            type: string;
            description: string;
        };
        case_insensitive: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ pattern, path: searchPath, glob_pattern, case_insensitive }: any): Promise<string>;
    needsConfirmation(): boolean;
}
//# sourceMappingURL=GrepTool.d.ts.map