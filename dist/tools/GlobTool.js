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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobTool = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fast_glob_1 = __importDefault(require("fast-glob"));
class GlobTool {
    workingDir;
    config;
    name = 'glob';
    description = 'Find files matching a glob pattern (e.g., \'**/*.py\', \'src/**/*.js\')';
    parameters = {
        pattern: {
            type: 'string',
            description: 'The glob pattern to match (e.g., \'**/*.py\' for all Python files)'
        },
        path: {
            type: 'string',
            description: 'Directory to search in (default: current directory)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ pattern, path: searchPath = '.' }) {
        try {
            const fullPath = path.resolve(this.workingDir, searchPath);
            if (!fullPath.startsWith(this.workingDir)) {
                return 'Error: Access denied - path is outside working directory';
            }
            if (!fs.existsSync(fullPath)) {
                return `Error: Directory not found: ${searchPath}`;
            }
            // Find matching files
            const matches = await (0, fast_glob_1.default)(pattern, {
                cwd: fullPath,
                absolute: false,
                stats: true
            });
            if (matches.length === 0) {
                return `No files found matching pattern: ${pattern}`;
            }
            // Sort by modification time
            matches.sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs);
            // Format output
            const output = [`Found ${matches.length} files matching '${pattern}':`];
            const limit = Math.min(matches.length, 100);
            for (let i = 0; i < limit; i++) {
                const match = matches[i];
                const size = match.stats.size;
                output.push(`  ${match.path} (${size} bytes)`);
            }
            if (matches.length > 100) {
                output.push(`  ... and ${matches.length - 100} more files`);
            }
            return output.join('\n');
        }
        catch (error) {
            return `Error finding files: ${error instanceof Error ? error.message : error}`;
        }
    }
    needsConfirmation() {
        return false;
    }
}
exports.GlobTool = GlobTool;
//# sourceMappingURL=GlobTool.js.map