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
exports.WriteTool = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class WriteTool {
    workingDir;
    config;
    snapshotManager;
    name = 'write';
    description = 'Write content to a file. Creates the file if it doesn\'t exist, overwrites if it does.';
    parameters = {
        file_path: {
            type: 'string',
            description: 'The path to the file to write (relative to working directory)'
        },
        content: {
            type: 'string',
            description: 'The content to write to the file'
        }
    };
    constructor(workingDir, config, snapshotManager) {
        this.workingDir = workingDir;
        this.config = config;
        this.snapshotManager = snapshotManager;
    }
    async execute({ file_path, content }) {
        try {
            const fullPath = path.resolve(this.workingDir, file_path);
            // Security check
            if (!fullPath.startsWith(this.workingDir)) {
                return 'Error: Access denied - path is outside working directory';
            }
            // Create parent directories
            const dir = path.dirname(fullPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            const exists = fs.existsSync(fullPath);
            // 📸 Create snapshot BEFORE writing (for /undo functionality)
            if (this.snapshotManager && exists) {
                try {
                    await this.snapshotManager.createSnapshot('write', `Overwriting ${file_path}`, [file_path], this.workingDir);
                }
                catch (snapshotError) {
                    // Non-fatal: continue even if snapshot fails
                    console.warn('Warning: Could not create snapshot:', snapshotError);
                }
            }
            // Write file
            fs.writeFileSync(fullPath, content, 'utf-8');
            const action = exists ? 'Updated' : 'Created';
            const lines = content.split('\n').length;
            return `${action} file: ${file_path} (${lines} lines)`;
        }
        catch (error) {
            return `Error writing file: ${error instanceof Error ? error.message : error}`;
        }
    }
    needsConfirmation(config) {
        return config.get('safety').confirmWrite;
    }
}
exports.WriteTool = WriteTool;
//# sourceMappingURL=WriteTool.js.map