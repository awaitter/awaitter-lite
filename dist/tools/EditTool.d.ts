import { Tool } from './ToolManager';
import { Config } from '../config/Config';
import { SnapshotManager } from '../snapshot/SnapshotManager';
export declare class EditTool implements Tool {
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
        old_string: {
            type: string;
            description: string;
        };
        new_string: {
            type: string;
            description: string;
        };
        replace_all: {
            type: string;
            description: string;
        };
    };
    constructor(workingDir: string, config: Config, snapshotManager?: SnapshotManager | undefined);
    execute({ file_path, old_string, new_string, replace_all }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=EditTool.d.ts.map