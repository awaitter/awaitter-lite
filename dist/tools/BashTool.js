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
    /**
     * ALWAYS blocked — catastrophic system-level commands.
     * Never make sense in a coding project and cannot be approved.
     */
    static ALWAYS_BLOCKED = [
        { re: /\brm\s+.*-[a-zA-Z]*r[a-zA-Z]*\s+\/(\s|$)/, reason: 'rm -r / would delete the entire filesystem root' },
        { re: /\brm\s+-rf\s+\/(\s|$)/, reason: 'rm -rf / would delete the entire filesystem root' },
        { re: /\bmkfs\b/, reason: 'mkfs would format a filesystem' },
        { re: /\bdd\s+if=/, reason: 'dd could overwrite disk data permanently' },
        { re: /\bfdisk\b/, reason: 'fdisk would modify disk partitions' },
        { re: /\bshred\b/, reason: 'shred permanently destroys files beyond recovery' },
    ];
    /**
     * Requires user confirmation before executing.
     * Destructive but potentially legitimate in a project workflow.
     */
    static CONFIRM_REQUIRED = [
        { re: /\brm\s+.*-[a-zA-Z]*r[a-zA-Z]*/, reason: 'rm -r/-rf deletes files/directories recursively', severity: 'high' },
        { re: /\brm\s+.*-[a-zA-Z]*f[a-zA-Z]*/, reason: 'rm -f force-deletes files without confirmation', severity: 'high' },
        { re: /\brm\s+[^|&;\n]*\*/, reason: 'rm with wildcard (*) can delete many files at once', severity: 'high' },
        { re: /\brm\s+\S+/, reason: 'rm permanently deletes a file', severity: 'high' },
        { re: /\bgit\s+clean\s+-[a-zA-Z]*f/, reason: 'git clean -f deletes all untracked files', severity: 'high' },
        { re: /\bgit\s+rm\b/, reason: 'git rm removes files from the repository', severity: 'high' },
        { re: /\bgit\s+reset\s+--hard/, reason: 'git reset --hard discards all local changes', severity: 'critical' },
        { re: /\bgit\s+push\s+.*--force/, reason: 'git push --force can overwrite remote history', severity: 'critical' },
        { re: /\bmv\s+[^|&;\n]+\s+\/dev\/null/, reason: 'mv to /dev/null permanently destroys the file', severity: 'high' },
        { re: /\btruncate\b/, reason: 'truncate empties file contents permanently', severity: 'high' },
        // Process-killing commands — can terminate the CLI itself or other system processes
        { re: /\bpkill\b/, reason: 'pkill kills processes by name/pattern — can terminate the CLI itself', severity: 'critical' },
        { re: /\bkillall\b/, reason: 'killall kills all processes with a given name', severity: 'critical' },
        { re: /\bkill\s+-9\b/, reason: 'kill -9 force-kills a process with no cleanup', severity: 'high' },
        { re: /\bkill\s+-KILL\b/, reason: 'kill -KILL force-kills a process with no cleanup', severity: 'high' },
        // npm audit fix --force can remove/downgrade packages and break the project
        { re: /\bnpm\s+audit\s+fix\s+--force\b/, reason: 'npm audit fix --force can remove/downgrade packages and break the project', severity: 'critical' },
        { re: /\bnpm\s+audit\s+fix\b/, reason: 'npm audit fix modifies package versions automatically', severity: 'high' },
        // fuser -k kills processes holding a port — can kill user processes
        { re: /\bfuser\s+-k\b/, reason: 'fuser -k kills all processes using a port — can kill user processes', severity: 'high' },
    ];
    /**
     * Check if a command needs user confirmation.
     * Returns danger info if yes, null if safe to run directly.
     */
    static getDangerInfo(command) {
        for (const { re, reason, severity } of BashTool.CONFIRM_REQUIRED) {
            if (re.test(command))
                return { reason, severity };
        }
        return null;
    }
    async execute({ command, timeout = 30 }) {
        // Guard: reject empty or non-string commands immediately (avoids ERR_INVALID_ARG_TYPE)
        if (!command || typeof command !== 'string' || !command.trim()) {
            return 'Error: No command provided. Please specify the exact shell command to run (e.g. "npm install", "ls -la").';
        }
        // Guard: absolutely blocked commands — no user approval possible
        for (const { re, reason } of BashTool.ALWAYS_BLOCKED) {
            if (re.test(command)) {
                const chalk = require('chalk');
                console.log(chalk.red(`\n  🚫 BLOCKED (cannot be approved): ${command}`));
                return `Error: Command permanently blocked — ${reason}. This command can never be executed by the agent.`;
            }
        }
        // Note: CONFIRM_REQUIRED commands are handled by the caller (Agent/WorkerAgent)
        // before this execute() method is called. If we reach here, the user already approved.
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