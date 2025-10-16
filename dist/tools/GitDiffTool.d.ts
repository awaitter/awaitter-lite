import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitDiffTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        staged: {
            type: string;
            description: string;
        };
        file: {
            type: string;
            description: string;
        };
        commit1: {
            type: string;
            description: string;
        };
        commit2: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ staged, file, commit1, commit2 }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitDiffTool.d.ts.map