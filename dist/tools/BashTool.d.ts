import { Tool } from './ToolManager';
import { Config } from '../config/Config';
export declare class BashTool implements Tool {
    private workingDir;
    private config;
    name: string;
    description: string;
    parameters: {
        command: {
            type: string;
            description: string;
        };
        timeout: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config);
    execute({ command, timeout }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=BashTool.d.ts.map