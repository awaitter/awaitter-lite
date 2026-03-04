import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class GitAddTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        files: {
            type: string;
            description: string;
            items: {
                type: string;
            };
        };
        all: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ files, all }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=GitAddTool.d.ts.map