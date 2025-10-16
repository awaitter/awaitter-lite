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
exports.ReadTool = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ReadTool {
    workingDir;
    config;
    name = 'read';
    description = 'Read the contents of a file. Returns the file content with line numbers.';
    parameters = {
        file_path: {
            type: 'string',
            description: 'The path to the file to read (relative to working directory)'
        },
        offset: {
            type: 'number',
            description: 'Line number to start reading from (optional)'
        },
        limit: {
            type: 'number',
            description: 'Number of lines to read (optional)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ file_path, offset, limit }) {
        try {
            const fullPath = path.resolve(this.workingDir, file_path);
            // Security check
            if (!fullPath.startsWith(this.workingDir)) {
                return 'Error: Access denied - path is outside working directory';
            }
            if (!fs.existsSync(fullPath)) {
                return `Error: File not found: ${file_path}`;
            }
            if (!fs.statSync(fullPath).isFile()) {
                return `Error: Not a file: ${file_path}`;
            }
            // Read file
            const content = fs.readFileSync(fullPath, 'utf-8');
            let lines = content.split('\n');
            // Apply offset and limit
            if (offset) {
                lines = lines.slice(offset - 1);
            }
            if (limit) {
                lines = lines.slice(0, limit);
            }
            // Format with line numbers
            const startLine = offset || 1;
            const formatted = lines.map((line, i) => {
                const lineNum = startLine + i;
                return `${lineNum.toString().padStart(6)} \t${line}`;
            }).join('\n');
            return formatted;
        }
        catch (error) {
            return `Error reading file: ${error instanceof Error ? error.message : error}`;
        }
    }
    needsConfirmation() {
        return false;
    }
}
exports.ReadTool = ReadTool;
//# sourceMappingURL=ReadTool.js.map