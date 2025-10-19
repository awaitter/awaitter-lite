"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitCommitTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitCommitTool {
    workingDir;
    config;
    name = 'git_commit';
    description = 'Creates a git commit with the specified message. Automatically stages all changes unless files are specified.';
    parameters = {
        message: {
            type: 'string',
            description: 'Commit message (required)'
        },
        files: {
            type: 'array',
            description: 'Specific files to stage and commit (default: all changes)',
            items: {
                type: 'string'
            }
        },
        amend: {
            type: 'boolean',
            description: 'Amend the last commit (default: false)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ message, files = [], amend = false }) {
        try {
            if (!message) {
                return 'Error: Commit message is required';
            }
            const output = [];
            // Stage files
            if (!amend) {
                const addCommand = files.length > 0
                    ? `git add ${files.join(' ')}`
                    : 'git add -A';
                const { stdout: addStdout, stderr: addStderr } = await execAsync(addCommand, {
                    cwd: this.workingDir
                });
                if (addStderr) {
                    output.push(`Stage warnings: ${addStderr}`);
                }
            }
            // Create commit
            const commitCommand = amend
                ? `git commit --amend -m "${message.replace(/"/g, '\\"')}"`
                : `git commit -m "${message.replace(/"/g, '\\"')}"`;
            const { stdout, stderr } = await execAsync(commitCommand, {
                cwd: this.workingDir
            });
            if (stdout)
                output.push(stdout);
            if (stderr)
                output.push(stderr);
            // Show brief status after commit
            const { stdout: statusStdout } = await execAsync('git status -s', {
                cwd: this.workingDir
            });
            if (statusStdout) {
                output.push('\nRemaining changes:');
                output.push(statusStdout);
            }
            return output.join('\n') || 'Commit created successfully';
        }
        catch (error) {
            if (error.message.includes('nothing to commit')) {
                return 'No changes to commit';
            }
            return `Error: ${error.message}`;
        }
    }
    needsConfirmation(config) {
        return config.get('safety').confirmBash; // Use same safety setting as bash
    }
}
exports.GitCommitTool = GitCommitTool;
//# sourceMappingURL=GitCommitTool.js.map