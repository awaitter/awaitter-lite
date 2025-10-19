import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitCommitTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        message: {
            type: string;
            description: string;
        };
        files: {
            type: string;
            description: string;
            items: {
                type: string;
            };
        };
        amend: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ message, files, amend }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitCommitTool.d.ts.map