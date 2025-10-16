"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitDiffTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitDiffTool {
    workingDir;
    config;
    name = 'git_diff';
    description = 'Shows git diff for changes. Can show staged, unstaged, or diff between commits.';
    parameters = {
        staged: {
            type: 'boolean',
            description: 'Show staged changes only (git diff --staged)'
        },
        file: {
            type: 'string',
            description: 'Specific file to diff'
        },
        commit1: {
            type: 'string',
            description: 'First commit hash for comparison'
        },
        commit2: {
            type: 'string',
            description: 'Second commit hash for comparison (defaults to HEAD)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ staged = false, file = '', commit1 = '', commit2 = '' }) {
        try {
            let command = 'git diff';
            if (commit1) {
                command = commit2
                    ? `git diff ${commit1} ${commit2}`
                    : `git diff ${commit1}`;
            }
            else if (staged) {
                command = 'git diff --staged';
            }
            if (file) {
                command += ` -- ${file}`;
            }
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.workingDir,
                maxBuffer: 1024 * 1024 * 10 // 10MB for large diffs
            });
            if (stderr) {
                return `STDERR:\n${stderr}`;
            }
            return stdout || 'No changes';
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    needsConfirmation(config) {
        return false; // git diff is read-only, no confirmation needed
    }
}
exports.GitDiffTool = GitDiffTool;
//# sourceMappingURL=GitDiffTool.js.map