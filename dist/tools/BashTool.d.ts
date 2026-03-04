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
    /**
     * ALWAYS blocked — catastrophic system-level commands.
     * Never make sense in a coding project and cannot be approved.
     */
    private static readonly ALWAYS_BLOCKED;
    /**
     * Requires user confirmation before executing.
     * Destructive but potentially legitimate in a project workflow.
     */
    static readonly CONFIRM_REQUIRED: Array<{
        re: RegExp;
        reason: string;
        severity: 'high' | 'critical';
    }>;
    /**
     * Check if a command needs user confirmation.
     * Returns danger info if yes, null if safe to run directly.
     */
    static getDangerInfo(command: string): {
        reason: string;
        severity: 'high' | 'critical';
    } | null;
    execute({ command, timeout }: any): Promise<string>;
    needsConfirmation(config: Config): boolean;
}
//# sourceMappingURL=BashTool.d.ts.map