"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitLogTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitLogTool {
    workingDir;
    config;
    name = 'git_log';
    description = 'Shows git commit history with various formatting options.';
    parameters = {
        limit: {
            type: 'number',
            description: 'Number of commits to show (default: 10)'
        },
        oneline: {
            type: 'boolean',
            description: 'Show one line per commit (default: false)'
        },
        file: {
            type: 'string',
            description: 'Show log for specific file'
        },
        author: {
            type: 'string',
            description: 'Filter by author'
        },
        since: {
            type: 'string',
            description: 'Show commits since date (e.g., "2 weeks ago", "2024-01-01")'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ limit = 10, oneline = false, file = '', author = '', since = '' }) {
        try {
            let command = 'git log';
            // Add limit
            command += ` -n ${limit}`;
            // Add format
            if (oneline) {
                command += ' --oneline';
            }
            else {
                command += ' --pretty=format:"%h - %an, %ar : %s"';
            }
            // Add filters
            if (author) {
                command += ` --author="${author}"`;
            }
            if (since) {
                command += ` --since="${since}"`;
            }
            // Add file
            if (file) {
                command += ` -- ${file}`;
            }
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.workingDir,
                maxBuffer: 1024 * 1024 * 5 // 5MB for large logs
            });
            if (stderr) {
                return `STDERR:\n${stderr}`;
            }
            return stdout || 'No commits found';
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    needsConfirmation(config) {
        return false; // git log is read-only, no confirmation needed
    }
}
exports.GitLogTool = GitLogTool;
//# sourceMappingURL=GitLogTool.js.map