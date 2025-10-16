import { Tool } from './ToolManager';
import { Config } from '../config/Config';
import { SnapshotManager } from '../snapshot/SnapshotManager';
export declare class WriteTool implements Tool {
    private workingDir;
    private config;
    private snapshotManager?;
    name: string;
    description: string;
    parameters: {
        file_path: {
            type: string;
            description: string;
        };
        content: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config, snapshotManager?: SnapshotManager | undefined);
    execute({ file_path, content }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=WriteTool.d.ts.map