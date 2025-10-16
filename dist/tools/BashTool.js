"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BashTool = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class BashTool {
    workingDir;
    config;
    name = 'bash';
    description = 'Execute a bash command in the working directory. Returns stdout and stderr.';
    parameters = {
        command: {
            type: 'string',
            description: 'The command to execute'
        },
        timeout: {
            type: 'number',
            description: 'Timeout in seconds (default: 30)'
        }
    };
    constructor(workingDir, config) {
        this.workingDir = workingDir;
        this.config = config;
    }
    async execute({ command, timeout = 30 }) {
        try {
            const { stdout, stderr } = await execAsync(command, {
                cwd: this.workingDir,
                timeout: timeout * 1000,
                maxBuffer: 1024 * 1024 * 10 // 10MB
            });
            const output = [];
            if (stdout) {
                output.push('STDOUT:');
                output.push(stdout);
            }
            if (stderr) {
                output.push('STDERR:');
                output.push(stderr);
            }
            return output.join('\n');
        }
        catch (error) {
            if (error.killed) {
                return `Error: Command timed out after ${timeout} seconds`;
            }
            const output = [];
            if (error.stdout) {
                output.push('STDOUT:');
                output.push(error.stdout);
            }
            if (error.stderr) {
                output.push('STDERR:');
                output.push(error.stderr);
            }
            output.push(`\nExit code: ${error.code || 'unknown'}`);
            return output.join('\n');
        }
    }
    needsConfirmation(config) {
        return config.get('safety').confirmBash;
    }
}
exports.BashTool = BashTool;
//# sourceMappingURL=BashTool.js.map