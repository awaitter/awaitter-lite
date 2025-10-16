import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitStatusTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        short: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ short }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitStatusTool.d.ts.map