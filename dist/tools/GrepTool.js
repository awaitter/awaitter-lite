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
exports.GrepTool = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const fast_glob_1 = __importDefault(require("fast-glob"));
class GrepTool {
    workingDir;
    config;
    name = 'grep';
    description = 'Search for a pattern in files. Supports regex patterns.';
    parameters = {
        pattern: {
            type: 'string',
            description: 'The regex pattern to search for'
        },
        path: {
            type: 'string',
            description: 'File or directory to search in (default: current directory)'
        },
        glob_pattern: {
            type: 'string',
            description: 'Glob pattern to filter files (e.g., \'*.py\')'
        },
        case_insensitive: {
            type: 'boolean',
            description: 'Case insensitive search (default: false)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ pattern, path: searchPath = '.', glob_pattern = '*', case_insensitive = false }) {
        try {
            const fullPath = path.resolve(this.workingDir, searchPath);
            if (!fullPath.startsWith(this.workingDir)) {
                return 'Error: Access denied - path is outside working directory';
            }
            if (!fs.existsSync(fullPath)) {
                return `Error: Path not found: ${searchPath}`;
            }
            // Create regex
            const flags = case_insensitive ? 'gi' : 'g';
            const regex = new RegExp(pattern, flags);
            // Get files to search
            let files;
            if (fs.statSync(fullPath).isFile()) {
                files = [fullPath];
            }
            else {
                files = await (0, fast_glob_1.default)(`**/${glob_pattern}`, {
                    cwd: fullPath,
                    absolute: true,
                    onlyFiles: true
                });
            }
            // Search in files
            const results = [];
            let totalMatches = 0;
            for (const filePath of files) {
                try {
                    const content = fs.readFileSync(filePath, 'utf-8');
                    const lines = content.split('\n');
                    const fileMatches = [];
                    lines.forEach((line, i) => {
                        if (regex.test(line)) {
                            totalMatches++;
                            const lineNum = i + 1;
                            fileMatches.push(`  → ${lineNum}: ${line.trim()}`);
                        }
                    });
                    if (fileMatches.length > 0) {
                        const relPath = path.relative(this.workingDir, filePath);
                        results.push(`\n${relPath}:`);
                        results.push(...fileMatches);
                    }
                }
                catch (error) {
                    // Skip files that can't be read
                    continue;
                }
            }
            if (results.length === 0) {
                return `No matches found for pattern: ${pattern}`;
            }
            const output = [`Found ${totalMatches} matches in ${results.filter(r => r.startsWith('\n')).length} files:`, ...results];
            // Limit output
            const outputStr = output.join('\n');
            if (outputStr.length > 10000) {
                return outputStr.slice(0, 10000) + '\n... (output truncated)';
            }
            return outputStr;
        }
        catch (error) {
            return `Error searching files: ${error instanceof Error ? error.message : error}`;
        }
    }
    needsConfirmation() {
        return false;
    }
}
exports.GrepTool = GrepTool;
//# sourceMappingURL=GrepTool.js.map