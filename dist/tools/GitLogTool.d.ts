import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitLogTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        limit: {
            type: string;
            description: string;
        };
        oneline: {
            type: string;
            description: string;
        };
        file: {
            type: string;
            description: string;
        };
        author: {
            type: string;
            description: string;
        };
        since: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ limit, oneline, file, author, since }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitLogTool.d.ts.map