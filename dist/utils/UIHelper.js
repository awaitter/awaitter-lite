"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIHelper = void 0;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
/**
 * UI Helper for consistent Claude Code-style interface
 */
class UIHelper {
    static statusLine = '';
    static spinner = null;
    static currentWorkingDir = '';
    static currentModel = '';
    /**
     * Initialize UI with context
     */
    static initialize(workingDir, model) {
        this.currentWorkingDir = workingDir;
        this.currentModel = model;
    }
    /**
     * Show input prompt with top border
     */
    static showInputPrompt() {
        console.log();
        console.log(chalk_1.default.dim('─'.repeat(80)));
        process.stdout.write(chalk_1.default.hex('#00D9FF')('> '));
    }
    /**
     * Show status bar below input (like Claude Code)
     */
    static showStatusBar(message) {
        const dir = this.currentWorkingDir.length > 50
            ? '...' + this.currentWorkingDir.slice(-47)
            : this.currentWorkingDir;
        const leftSide = message
            ? chalk_1.default.dim(message)
            : chalk_1.default.dim(`cd "${dir}"`);
        const rightSide = chalk_1.default.dim('ctrl+c to cancel');
        // Calculate padding
        const leftLength = this.stripAnsi(leftSide).length;
        const rightLength = this.stripAnsi(rightSide).length;
        const padding = ' '.repeat(Math.max(0, 80 - leftLength - rightLength));
        console.log();
        console.log(leftSide + padding + rightSide);
    }
    /**
     * Strip ANSI codes to get real length
     */
    static stripAnsi(str) {
        return str.replace(/\u001b\[\d+m/g, '');
    }
    /**
     * Update status line (shown below input)
     */
    static updateStatus(message, icon = '●') {
        this.statusLine = message;
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        process.stdout.write(chalk_1.default.hex('#FF9500')(icon) + ' ' + chalk_1.default.dim(message));
    }
    /**
     * Clear status line
     */
    static clearStatus() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
        process.stdout.write('\r' + ' '.repeat(80) + '\r');
        this.statusLine = '';
    }
    /**
     * Start animated spinner with message
     */
    static startSpinner(message) {
        this.clearStatus();
        // Show ESC hint
        const spinnerText = chalk_1.default.dim(message) + chalk_1.default.gray(' (Press ') + chalk_1.default.yellow('ESC') + chalk_1.default.gray(' to cancel)');
        this.spinner = (0, ora_1.default)({
            text: spinnerText,
            color: 'yellow',
            spinner: 'dots'
        }).start();
    }
    /**
     * Update spinner message
     */
    static updateSpinner(message) {
        if (this.spinner) {
            this.spinner.text = chalk_1.default.dim(message);
        }
    }
    /**
     * Stop spinner with success
     */
    static stopSpinner(message) {
        if (this.spinner) {
            if (message) {
                this.spinner.succeed(chalk_1.default.dim(message));
            }
            else {
                this.spinner.stop();
            }
            this.spinner = null;
        }
    }
    /**
     * Show section divider
     */
    static showDivider(char = '─') {
        console.log(chalk_1.default.dim(char.repeat(80)));
    }
    /**
     * Show user message header
     */
    static showUserHeader() {
        console.log();
        this.showDivider();
        console.log();
        console.log(chalk_1.default.hex('#00D9FF').bold('  You'));
        console.log();
    }
    /**
     * Show assistant message header
     */
    static showAssistantHeader() {
        console.log();
        this.showDivider();
        console.log();
        console.log(chalk_1.default.hex('#FF9500').bold('  Assistant'));
        console.log();
    }
    /**
     * Show tool execution
     */
    static showToolExecution(toolName, args) {
        const argsStr = Object.entries(args)
            .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 40)}`)
            .join(', ');
        console.log();
        console.log(chalk_1.default.hex('#FF9500')('  ▸ ') + chalk_1.default.bold(toolName) + chalk_1.default.dim(` (${argsStr})`));
    }
    /**
     * Show tool result (success)
     */
    static showToolSuccess(preview) {
        console.log(chalk_1.default.dim('    ✓ ') + chalk_1.default.gray(preview));
    }
    /**
     * Show tool result (error)
     */
    static showToolError(error) {
        console.log(chalk_1.default.red('    ✗ ') + chalk_1.default.white(error));
    }
    /**
     * Show thinking indicator
     */
    static showThinking() {
        this.updateStatus('Thinking...', '●');
    }
    /**
     * Show tool running indicator
     */
    static showRunningTool(toolName) {
        this.updateStatus(`Running ${toolName}...`, '◆');
    }
    /**
     * Format user message
     */
    static formatUserMessage(message) {
        console.log(chalk_1.default.white('  ' + message));
        console.log();
    }
    /**
     * Show error message
     */
    static showError(error) {
        console.log();
        console.log(chalk_1.default.red('  ✗ Error: ') + chalk_1.default.white(error));
        console.log();
    }
    /**
     * Show box with text
     */
    static showBox(lines, title) {
        const width = 76;
        console.log(chalk_1.default.dim('  ┌' + '─'.repeat(width) + '┐'));
        if (title) {
            console.log(chalk_1.default.dim('  │ ') + chalk_1.default.bold(title) + ' '.repeat(width - title.length - 1) + chalk_1.default.dim('│'));
            console.log(chalk_1.default.dim('  ├' + '─'.repeat(width) + '┤'));
        }
        for (const line of lines) {
            const padding = ' '.repeat(Math.max(0, width - line.length));
            console.log(chalk_1.default.dim('  │ ') + line + padding + chalk_1.default.dim('│'));
        }
        console.log(chalk_1.default.dim('  └' + '─'.repeat(width) + '┘'));
    }
    // ========== ROADMAP SPECIFIC METHODS ==========
    /**
     * Show full roadmap with all sprints and tasks
     */
    static showRoadmap(roadmap, progress) {
        if (!roadmap) {
            console.log(chalk_1.default.yellow('\n  No roadmap available\n'));
            return;
        }
        console.log();
        console.log(chalk_1.default.bold.cyan(`📋 PROJECT ROADMAP: ${roadmap.projectName || 'Unnamed Project'}`));
        console.log();
        if (progress) {
            const percent = progress.percentComplete || 0;
            const bar = this.getProgressBar(percent, 40);
            console.log(chalk_1.default.dim('  Progress: ') + bar + chalk_1.default.white(` ${percent}%`));
            console.log(chalk_1.default.dim(`  Tasks: ${progress.completedTasks || 0}/${progress.totalTasks || 0} | Sprints: ${progress.completedSprints || 0}/${progress.totalSprints || 0}`));
            console.log();
        }
        if (roadmap.sprints && Array.isArray(roadmap.sprints)) {
            for (const sprint of roadmap.sprints) {
                this.showSprintInRoadmap(sprint);
            }
        }
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(chalk_1.default.bold(`TOTAL: ${roadmap.totalTasks || 0} tasks | ${roadmap.sprints ? roadmap.sprints.length : 0} sprints | ~${roadmap.totalEstimatedMinutes || 0} minutes estimated`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
    }
    /**
     * Show a sprint within the roadmap view
     */
    static showSprintInRoadmap(sprint) {
        if (!sprint)
            return;
        const statusIcon = this.getSprintStatusIcon(sprint.status);
        const sprintName = sprint.name || 'Unnamed Sprint';
        const sprintEmoji = sprint.emoji || '📋';
        const sprintTitle = `${sprintEmoji}  SPRINT ${sprint.id}: ${sprintName.toUpperCase()}`;
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(statusIcon + ' ' + chalk_1.default.bold(sprintTitle) + chalk_1.default.dim(` (Estimated: ~${sprint.estimatedMinutes || 0} min)`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        if (sprint.tasks && Array.isArray(sprint.tasks)) {
            for (const task of sprint.tasks) {
                const statusSymbol = this.getTaskStatusSymbol(task.status);
                const taskLine = `${statusSymbol} ${task.id || '?'}  ${task.description || 'No description'}`;
                console.log(chalk_1.default.white('  ' + taskLine));
            }
        }
        console.log();
    }
    /**
     * Show sprint header when starting execution
     */
    static showSprintHeader(sprint) {
        if (!sprint)
            return;
        const sprintName = sprint.name || 'Unnamed Sprint';
        const sprintEmoji = sprint.emoji || '📋';
        const taskCount = sprint.tasks ? sprint.tasks.length : 0;
        console.log();
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(chalk_1.default.bold.hex('#FF9500')(`${sprintEmoji}  EXECUTING: SPRINT ${sprint.id} - ${sprintName.toUpperCase()}`) + chalk_1.default.dim(` (${taskCount} tasks)`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
    }
    /**
     * Show sprint summary after completion
     */
    static showSprintSummary(sprint) {
        if (!sprint)
            return;
        const sprintName = sprint.name || 'Unnamed Sprint';
        const tasks = sprint.tasks || [];
        const completedTasks = tasks.filter(t => t.status === 'completed' || t.status === 'skipped').length;
        const filesCreated = tasks.flatMap(t => t.filesCreated || []);
        const filesModified = tasks.flatMap(t => t.filesModified || []);
        const errors = tasks.flatMap(t => t.errors || []);
        const duration = sprint.startedAt && sprint.completedAt
            ? Math.round((sprint.completedAt.getTime() - sprint.startedAt.getTime()) / 60000)
            : (sprint.estimatedMinutes || 0);
        console.log();
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(chalk_1.default.green.bold(`✅ SPRINT ${sprint.id}: ${sprintName.toUpperCase()} - COMPLETED`) + chalk_1.default.dim(` (${completedTasks}/${tasks.length} tasks)`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
        if (filesCreated.length > 0) {
            console.log(chalk_1.default.bold('  FILES CREATED: ') + chalk_1.default.white(filesCreated.length));
            filesCreated.slice(0, 5).forEach(file => {
                console.log(chalk_1.default.dim('  - ') + chalk_1.default.cyan(file));
            });
            if (filesCreated.length > 5) {
                console.log(chalk_1.default.dim(`  ... and ${filesCreated.length - 5} more`));
            }
            console.log();
        }
        if (filesModified.length > 0) {
            console.log(chalk_1.default.bold('  FILES MODIFIED: ') + chalk_1.default.white(filesModified.length));
            filesModified.slice(0, 3).forEach(file => {
                console.log(chalk_1.default.dim('  - ') + chalk_1.default.yellow(file));
            });
            if (filesModified.length > 3) {
                console.log(chalk_1.default.dim(`  ... and ${filesModified.length - 3} more`));
            }
            console.log();
        }
        console.log(chalk_1.default.dim('  DURATION: ') + chalk_1.default.white(`~${duration} minutes`));
        console.log(chalk_1.default.dim('  STATUS: ') + (errors.length > 0
            ? chalk_1.default.yellow(`Completed with ${errors.length} warnings`)
            : chalk_1.default.green('All tasks completed successfully')));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
    }
    /**
     * Show task progress while executing
     */
    static showTaskProgress(task, taskIndex, totalTasks) {
        if (!task)
            return;
        const percent = Math.round((taskIndex / totalTasks) * 100);
        const statusSymbol = this.getTaskStatusSymbol(task.status);
        const progress = `[${taskIndex}/${totalTasks}]`;
        const taskDescription = task.description || 'No description';
        console.log();
        console.log(statusSymbol + ' ' + chalk_1.default.dim(`[SPRINT ${task.sprintId || '?'}] `) + chalk_1.default.white(progress) + ' ' + chalk_1.default.dim(`[${task.id || '?'}] `) + chalk_1.default.white(taskDescription));
    }
    /**
     * Show final roadmap completion summary
     */
    static showRoadmapComplete(roadmap, progress) {
        if (!roadmap || !progress)
            return;
        const sprints = roadmap.sprints || [];
        const filesCreated = sprints.flatMap(s => (s.tasks || []).flatMap(t => t.filesCreated || []));
        const filesModified = sprints.flatMap(s => (s.tasks || []).flatMap(t => t.filesModified || []));
        console.log();
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(chalk_1.default.green.bold(`✅ PROJECT COMPLETE: ${roadmap.projectName || 'Project'}`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
        console.log(chalk_1.default.bold.cyan('  📊 FINAL STATISTICS:'));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Sprints Completed: ${progress.completedSprints || 0}/${progress.totalSprints || 0}`));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Tasks Completed: ${progress.completedTasks || 0}/${progress.totalTasks || 0}`));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Files Created: ${filesCreated.length}`));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Files Modified: ${filesModified.length}`));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Duration: ~${progress.elapsedMinutes || 0} minutes`));
        console.log(chalk_1.default.dim('  - ') + chalk_1.default.white(`Status: ${roadmap.status || 'unknown'}`));
        console.log();
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
    }
    /**
     * Show prompt to continue to next sprint (for sprint mode)
     */
    static showSprintContinuePrompt(nextSprint) {
        if (!nextSprint)
            return;
        const sprintName = nextSprint.name || 'Unnamed Sprint';
        const taskCount = nextSprint.tasks ? nextSprint.tasks.length : 0;
        const estimatedTime = nextSprint.estimatedMinutes || 0;
        console.log();
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log(chalk_1.default.yellow(`☐ NEXT: SPRINT ${nextSprint.id} - ${sprintName.toUpperCase()}`) + chalk_1.default.dim(` (${taskCount} tasks, ~${estimatedTime} min)`));
        console.log(chalk_1.default.dim('═'.repeat(80)));
        console.log();
        console.log(chalk_1.default.white('  Sprint ') + chalk_1.default.cyan(String(nextSprint.id - 1)) + chalk_1.default.white(' completed. Ready to start Sprint ') + chalk_1.default.cyan(String(nextSprint.id)) + chalk_1.default.white('?'));
        console.log(chalk_1.default.dim('  (Waiting for user confirmation to continue)'));
        console.log();
    }
    /**
     * Show prompt to continue to next task (for step-by-step mode)
     */
    static showTaskContinuePrompt(nextTask) {
        console.log();
        console.log(chalk_1.default.yellow(`☐ [SPRINT ${nextTask.sprintId}] [${nextTask.id}] ${nextTask.description}`));
        console.log();
        console.log(chalk_1.default.white('  Task completed. Continue to next task?'));
        console.log(chalk_1.default.dim('  (Waiting for user confirmation)'));
        console.log();
    }
    /**
     * Get progress bar visualization
     */
    static getProgressBar(percent, width = 30) {
        const filled = Math.round((percent / 100) * width);
        const empty = width - filled;
        return chalk_1.default.green('█'.repeat(filled)) + chalk_1.default.dim('░'.repeat(empty));
    }
    /**
     * Get task status symbol
     */
    static getTaskStatusSymbol(status) {
        switch (status) {
            case 'completed':
                return chalk_1.default.green('✅');
            case 'in-progress':
                return chalk_1.default.yellow('⏳');
            case 'failed':
                return chalk_1.default.red('✗');
            case 'skipped':
                return chalk_1.default.dim('⊘');
            case 'pending':
            default:
                return chalk_1.default.dim('☐');
        }
    }
    /**
     * Get sprint status icon
     */
    static getSprintStatusIcon(status) {
        switch (status) {
            case 'completed':
                return chalk_1.default.green('✅');
            case 'in-progress':
                return chalk_1.default.yellow('⏳');
            case 'failed':
                return chalk_1.default.red('✗');
            case 'pending':
            default:
                return '';
        }
    }
}
exports.UIHelper = UIHelper;
//# sourceMappingURL=UIHelper.js.map