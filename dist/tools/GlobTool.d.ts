import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GlobTool implements Tool {
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
    };
    constructor(workingDir: string, config: Config);
    execute({ pattern, path: searchPath }: any): Promise<string>;
    needsConfirmation(): boolean;
}
//# sourceMappingURL=GlobTool.d.ts.map