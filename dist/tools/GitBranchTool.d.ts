import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitBranchTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        action: {
            type: string;
            description: string;
        };
        name: {
            type: string;
            description: string;
        };
        force: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ action, name, force }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitBranchTool.d.ts.map