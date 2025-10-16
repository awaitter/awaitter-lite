import { Config } from '../config/Config';
import { SnapshotManager } from '../snapshot/SnapshotManager';
export interface Tool {
    name: string;
    description: string;
    parameters: any;
    execute(args: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
export declare class ToolManager {
    private config;
    private workingDir;
    private snapshotManager?;
    private tools;
    constructor(config: Config, workingDir: string, snapshotManager?: SnapshotManager | undefined);
    private initializeTools;
    getToolSchemas(): any[];
    getTool(name: string): Tool | undefined;
    executeTool(name: string, args: any): Promise<string>;
    getToolList(): Array<{
        name: string;
        description: string;
    }>;
}
//# sourceMappingURL=ToolManager.d.ts.map