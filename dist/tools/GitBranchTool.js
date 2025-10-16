"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitBranchTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class GitBranchTool {
    workingDir;
    config;
    name = 'git_branch';
    description = 'Manages git branches: list, create, switch, or delete branches.';
    parameters = {
        action: {
            type: 'string',
            description: 'Action to perform: list, create, switch, delete (default: list)'
        },
        name: {
            type: 'string',
            description: 'Branch name (required for create, switch, delete)'
        },
        force: {
            type: 'boolean',
            description: 'Force delete branch (default: false)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ action = 'list', name = '', force = false }) {
        try {
            let command;
            switch (action.toLowerCase()) {
                case 'list':
                    command = 'git branch -vv';
                    break;
                case 'create':
                    if (!name)
                        return 'Error: Branch name required for create action';
                    command = `git checkout -b ${name}`;
                    break;
                case 'switch':
                    if (!name)
                        return 'Error: Branch name required for switch action';
                    command = `git checkout ${name}`;
                    break;
                case 'delete':
                    if (!name)
                        return 'Error: Branch name required for delete action';
                    command = force ? `git branch -D ${name}` : `git branch -d ${name}`;
                    break;
                default:
                    return `Error: Unknown action '${action}'. Use: list, create, switch, or delete`;
            }
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.workingDir
            });
            const output = [];
            if (stdout)
                output.push(stdout);
            if (stderr)
                output.push(stderr);
            return output.join('\n') || 'Operation completed';
        }
        catch (error) {
            return `Error: ${error.message}`;
        }
    }
    needsConfirmation(config) {
        return config.get('safety').confirmBash;
    }
}
exports.GitBranchTool = GitBranchTool;
//# sourceMappingURL=GitBranchTool.js.map