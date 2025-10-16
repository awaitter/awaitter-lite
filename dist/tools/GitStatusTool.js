"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitStatusTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitStatusTool {
    workingDir;
    config;
    name = 'git_status';
    description = 'Shows the current git repository status including staged, unstaged, and untracked files.';
    parameters = {
        short: {
            type: 'boolean',
            description: 'Show short format (default: false)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ short = false }) {
        try {
            // Check if we're in a git repository
            const { stdout: isRepo } = await execAsync('git rev-parse --is-inside-work-tree', {
                cwd: this.workingDir
            }).catch(() => ({ stdout: '' }));
            if (!isRepo.trim()) {
                return 'Error: Not a git repository. Initialize with: git init';
            }
            const command = short ? 'git status -s' : 'git status';
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.workingDir
            });
            if (stderr) {
                return `STDERR:\n${stderr}`;
            }
            return stdout || 'Working tree clean';
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    needsConfirmation(config) {
        return false; // git status is read-only, no confirmation needed
    }
}
exports.GitStatusTool = GitStatusTool;
//# sourceMappingURL=GitStatusTool.js.map