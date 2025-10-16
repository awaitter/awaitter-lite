"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SnapshotManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
class SnapshotManager {
    snapshotsDir;
    maxSnapshots;
    snapshots = [];
    constructor(maxSnapshots = 50) {
        // Store snapshots in user's home directory under .awaitter-lite
        const baseDir = path.join((0, os_1.homedir)(), '.awaitter-lite', 'snapshots');
        this.snapshotsDir = baseDir;
        this.maxSnapshots = maxSnapshots;
        // Create snapshots directory if it doesn't exist
        if (!fs.existsSync(this.snapshotsDir)) {
            fs.mkdirSync(this.snapshotsDir, { recursive: true });
        }
        // Load existing snapshots
        this.loadSnapshots();
    }
    /**
     * Create a snapshot before a destructive operation
     */
    async createSnapshot(operation, description, filePaths, workingDir) {
        const id = this.generateSnapshotId();
        const files = [];
        // Capture current state of all affected files
        for (const filePath of filePaths) {
            const fullPath = path.isAbsolute(filePath)
                ? filePath
                : path.join(workingDir, filePath);
            let content = null;
            let existed = false;
            try {
                if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
                    content = fs.readFileSync(fullPath, 'utf-8');
                    existed = true;
                }
            }
            catch (error) {
                // File doesn't exist or can't be read - that's fine
            }
            files.push({
                path: filePath,
                content,
                existed
            });
        }
        const snapshot = {
            id,
            timestamp: new Date().toISOString(),
            operation,
            description,
            files,
            workingDir
        };
        // Save snapshot
        this.snapshots.unshift(snapshot); // Add to beginning (most recent first)
        this.saveSnapshot(snapshot);
        // Enforce max snapshots limit
        if (this.snapshots.length > this.maxSnapshots) {
            const removed = this.snapshots.pop();
            if (removed) {
                this.deleteSnapshotFile(removed.id);
            }
        }
        return id;
    }
    /**
     * Undo the last N operations
     */
    async undo(count = 1, workingDir) {
        if (this.snapshots.length === 0) {
            return {
                success: false,
                message: 'No snapshots available to undo',
                filesRestored: []
            };
        }
        if (count > this.snapshots.length) {
            return {
                success: false,
                message: `Only ${this.snapshots.length} snapshot(s) available`,
                filesRestored: []
            };
        }
        const snapshotsToRestore = this.snapshots.slice(0, count);
        const filesRestored = [];
        let skippedSnapshots = 0;
        try {
            // Restore files from snapshots (in reverse order)
            for (const snapshot of snapshotsToRestore.reverse()) {
                // 🔒 SECURITY: Validate snapshot belongs to current working directory
                // This prevents cross-project contamination during undo
                if (snapshot.workingDir !== workingDir) {
                    console.warn(`⚠️  Skipping snapshot from different directory: ${snapshot.workingDir}`);
                    skippedSnapshots++;
                    continue; // Skip snapshots from other projects
                }
                for (const file of snapshot.files) {
                    // Use the snapshot's original workingDir, not the current one
                    const fullPath = path.isAbsolute(file.path)
                        ? file.path
                        : path.join(snapshot.workingDir, file.path);
                    // 🔒 SECURITY: Double-check file path is within snapshot's workingDir
                    const resolvedPath = path.resolve(fullPath);
                    const resolvedWorkingDir = path.resolve(snapshot.workingDir);
                    if (!resolvedPath.startsWith(resolvedWorkingDir)) {
                        console.error(`Security error: File ${file.path} is outside snapshot's working directory`);
                        continue;
                    }
                    try {
                        if (file.existed && file.content !== null) {
                            // Restore file to its previous state
                            const dir = path.dirname(fullPath);
                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir, { recursive: true });
                            }
                            fs.writeFileSync(fullPath, file.content, 'utf-8');
                            filesRestored.push(file.path);
                        }
                        else if (!file.existed && fs.existsSync(fullPath)) {
                            // File didn't exist before, so delete it
                            fs.unlinkSync(fullPath);
                            filesRestored.push(file.path);
                        }
                    }
                    catch (error) {
                        console.error(`Failed to restore ${file.path}:`, error);
                    }
                }
            }
            // Remove restored snapshots
            for (let i = 0; i < count; i++) {
                const removed = this.snapshots.shift();
                if (removed) {
                    this.deleteSnapshotFile(removed.id);
                }
            }
            const effectiveCount = count - skippedSnapshots;
            let message = `Successfully undone ${effectiveCount} operation(s)`;
            if (skippedSnapshots > 0) {
                message += ` (${skippedSnapshots} snapshot(s) from other directories were skipped)`;
            }
            return {
                success: true,
                message,
                filesRestored
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Error during undo: ${error instanceof Error ? error.message : error}`,
                filesRestored
            };
        }
    }
    /**
     * Get list of available snapshots
     */
    getSnapshots() {
        return this.snapshots.map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            operation: s.operation,
            description: s.description,
            fileCount: s.files.length
        }));
    }
    /**
     * Get snapshots for specific working directory only
     */
    getSnapshotsForDirectory(workingDir) {
        return this.snapshots
            .filter(s => s.workingDir === workingDir)
            .map(s => ({
            id: s.id,
            timestamp: s.timestamp,
            operation: s.operation,
            description: s.description,
            fileCount: s.files.length
        }));
    }
    /**
     * Clear all snapshots
     */
    async clearAllSnapshots() {
        const count = this.snapshots.length;
        for (const snapshot of this.snapshots) {
            this.deleteSnapshotFile(snapshot.id);
        }
        this.snapshots = [];
        return count;
    }
    /**
     * Get specific snapshot details
     */
    getSnapshot(id) {
        return this.snapshots.find(s => s.id === id) || null;
    }
    // Private methods
    loadSnapshots() {
        if (!fs.existsSync(this.snapshotsDir)) {
            return;
        }
        const files = fs.readdirSync(this.snapshotsDir)
            .filter(f => f.endsWith('.json'))
            .sort((a, b) => b.localeCompare(a)); // Most recent first
        this.snapshots = files
            .slice(0, this.maxSnapshots)
            .map(file => {
            const filepath = path.join(this.snapshotsDir, file);
            const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            return data;
        });
    }
    saveSnapshot(snapshot) {
        const filename = `${snapshot.id}.json`;
        const filepath = path.join(this.snapshotsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(snapshot, null, 2));
    }
    deleteSnapshotFile(id) {
        const filename = `${id}.json`;
        const filepath = path.join(this.snapshotsDir, filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }
    generateSnapshotId() {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .substring(0, 19); // YYYY-MM-DD_HH-MM-SS
        const random = Math.random().toString(36).substring(2, 6);
        return `snap_${timestamp}_${random}`;
    }
}
exports.SnapshotManager = SnapshotManager;
//# sourceMappingURL=SnapshotManager.js.map