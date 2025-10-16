interface FileSnapshot {
    path: string;
    content: string | null;
    existed: boolean;
}
interface Snapshot {
    id: string;
    timestamp: string;
    operation: string;
    description: string;
    files: FileSnapshot[];
    workingDir: string;
}
export declare class SnapshotManager {
    private snapshotsDir;
    private maxSnapshots;
    private snapshots;
    constructor(maxSnapshots?: number);
    /**
     * Create a snapshot before a destructive operation
     */
    createSnapshot(operation: string, description: string, filePaths: string[], workingDir: string): Promise<string>;
    /**
     * Undo the last N operations
     */
    undo(count: number | undefined, workingDir: string): Promise<{
        success: boolean;
        message: string;
        filesRestored: string[];
    }>;
    /**
     * Get list of available snapshots
     */
    getSnapshots(): Array<{
        id: string;
        timestamp: string;
        operation: string;
        description: string;
        fileCount: number;
    }>;
    /**
     * Get snapshots for specific working directory only
     */
    getSnapshotsForDirectory(workingDir: string): Array<{
        id: string;
        timestamp: string;
        operation: string;
        description: string;
        fileCount: number;
    }>;
    /**
     * Clear all snapshots
     */
    clearAllSnapshots(): Promise<number>;
    /**
     * Get specific snapshot details
     */
    getSnapshot(id: string): Snapshot | null;
    private loadSnapshots;
    private saveSnapshot;
    private deleteSnapshotFile;
    private generateSnapshotId;
}
export {};
//# sourceMappingURL=SnapshotManager.d.ts.map