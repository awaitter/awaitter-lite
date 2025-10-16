import chalk from 'chalk';
import ora, { Ora } from 'ora';
import { Roadmap, Sprint, Task, RoadmapProgress } from '../planning/types';

/**
 * UI Helper for consistent Claude Code-style interface
 */
export class UIHelper {
  private static statusLine: string = '';
  private static spinner: Ora | null = null;
  private static currentWorkingDir: string = '';
  private static currentModel: string = '';

  /**
   * Initialize UI with context
   */
  static initialize(workingDir: string, model: string) {
    this.currentWorkingDir = workingDir;
    this.currentModel = model;
  }

  /**
   * Show input prompt with top border
   */
  static showInputPrompt() {
    console.log();
    console.log(chalk.dim('─'.repeat(80)));
    process.stdout.write(chalk.hex('#00D9FF')('> '));
  }

  /**
   * Show status bar below input (like Claude Code)
   */
  static showStatusBar(message?: string) {
    const dir = this.currentWorkingDir.length > 50
      ? '...' + this.currentWorkingDir.slice(-47)
      : this.currentWorkingDir;

    const leftSide = message
      ? chalk.dim(message)
      : chalk.dim(`cd "${dir}"`);

    const rightSide = chalk.dim('ctrl+c to cancel');

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
  private static stripAnsi(str: string): string {
    return str.replace(/\u001b\[\d+m/g, '');
  }

  /**
   * Update status line (shown below input)
   */
  static updateStatus(message: string, icon: string = '●') {
    this.statusLine = message;
    process.stdout.write('\r' + ' '.repeat(80) + '\r');
    process.stdout.write(chalk.hex('#FF9500')(icon) + ' ' + chalk.dim(message));
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
  static startSpinner(message: string) {
    this.clearStatus();

    // Show ESC hint
    const spinnerText = chalk.dim(message) + chalk.gray(' (Press ') + chalk.yellow('ESC') + chalk.gray(' to cancel)');

    this.spinner = ora({
      text: spinnerText,
      color: 'yellow',
      spinner: 'dots'
    }).start();
  }

  /**
   * Update spinner message
   */
  static updateSpinner(message: string) {
    if (this.spinner) {
      this.spinner.text = chalk.dim(message);
    }
  }

  /**
   * Stop spinner with success
   */
  static stopSpinner(message?: string) {
    if (this.spinner) {
      if (message) {
        this.spinner.succeed(chalk.dim(message));
      } else {
        this.spinner.stop();
      }
      this.spinner = null;
    }
  }

  /**
   * Show section divider
   */
  static showDivider(char: string = '─') {
    console.log(chalk.dim(char.repeat(80)));
  }

  /**
   * Show user message header
   */
  static showUserHeader() {
    console.log();
    this.showDivider();
    console.log();
    console.log(chalk.hex('#00D9FF').bold('  You'));
    console.log();
  }

  /**
   * Show assistant message header
   */
  static showAssistantHeader() {
    console.log();
    this.showDivider();
    console.log();
    console.log(chalk.hex('#FF9500').bold('  Assistant'));
    console.log();
  }

  /**
   * Show tool execution
   */
  static showToolExecution(toolName: string, args: any) {
    const argsStr = Object.entries(args)
      .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 40)}`)
      .join(', ');

    console.log();
    console.log(chalk.hex('#FF9500')('  ▸ ') + chalk.bold(toolName) + chalk.dim(` (${argsStr})`));
  }

  /**
   * Show tool result (success)
   */
  static showToolSuccess(preview: string) {
    console.log(chalk.dim('    ✓ ') + chalk.gray(preview));
  }

  /**
   * Show tool result (error)
   */
  static showToolError(error: string) {
    console.log(chalk.red('    ✗ ') + chalk.white(error));
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
  static showRunningTool(toolName: string) {
    this.updateStatus(`Running ${toolName}...`, '◆');
  }

  /**
   * Format user message
   */
  static formatUserMessage(message: string) {
    console.log(chalk.white('  ' + message));
    console.log();
  }

  /**
   * Show error message
   */
  static showError(error: string) {
    console.log();
    console.log(chalk.red('  ✗ Error: ') + chalk.white(error));
    console.log();
  }

  /**
   * Show box with text
   */
  static showBox(lines: string[], title?: string) {
    const width = 76;

    console.log(chalk.dim('  ┌' + '─'.repeat(width) + '┐'));

    if (title) {
      console.log(chalk.dim('  │ ') + chalk.bold(title) + ' '.repeat(width - title.length - 1) + chalk.dim('│'));
      console.log(chalk.dim('  ├' + '─'.repeat(width) + '┤'));
    }

    for (const line of lines) {
      const padding = ' '.repeat(Math.max(0, width - line.length));
      console.log(chalk.dim('  │ ') + line + padding + chalk.dim('│'));
    }

    console.log(chalk.dim('  └' + '─'.repeat(width) + '┘'));
  }

  // ========== ROADMAP SPECIFIC METHODS ==========

  /**
   * Show full roadmap with all sprints and tasks
   */
  static showRoadmap(roadmap: Roadmap, progress?: RoadmapProgress) {
    if (!roadmap) {
      console.log(chalk.yellow('\n  No roadmap available\n'));
      return;
    }

    console.log();
    console.log(chalk.bold.cyan(`📋 PROJECT ROADMAP: ${roadmap.projectName || 'Unnamed Project'}`));
    console.log();

    if (progress) {
      const percent = progress.percentComplete || 0;
      const bar = this.getProgressBar(percent, 40);
      console.log(chalk.dim('  Progress: ') + bar + chalk.white(` ${percent}%`));
      console.log(chalk.dim(`  Tasks: ${progress.completedTasks || 0}/${progress.totalTasks || 0} | Sprints: ${progress.completedSprints || 0}/${progress.totalSprints || 0}`));
      console.log();
    }

    if (roadmap.sprints && Array.isArray(roadmap.sprints)) {
      for (const sprint of roadmap.sprints) {
        this.showSprintInRoadmap(sprint);
      }
    }

    console.log(chalk.dim('═'.repeat(80)));
    console.log(chalk.bold(`TOTAL: ${roadmap.totalTasks || 0} tasks | ${roadmap.sprints ? roadmap.sprints.length : 0} sprints | ~${roadmap.totalEstimatedMinutes || 0} minutes estimated`));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();
  }

  /**
   * Show a sprint within the roadmap view
   */
  private static showSprintInRoadmap(sprint: Sprint) {
    if (!sprint) return;

    const statusIcon = this.getSprintStatusIcon(sprint.status);
    const sprintName = sprint.name || 'Unnamed Sprint';
    const sprintEmoji = sprint.emoji || '📋';
    const sprintTitle = `${sprintEmoji}  SPRINT ${sprint.id}: ${sprintName.toUpperCase()}`;

    console.log(chalk.dim('═'.repeat(80)));
    console.log(statusIcon + ' ' + chalk.bold(sprintTitle) + chalk.dim(` (Estimated: ~${sprint.estimatedMinutes || 0} min)`));
    console.log(chalk.dim('═'.repeat(80)));

    if (sprint.tasks && Array.isArray(sprint.tasks)) {
      for (const task of sprint.tasks) {
        const statusSymbol = this.getTaskStatusSymbol(task.status);
        const taskLine = `${statusSymbol} ${task.id || '?'}  ${task.description || 'No description'}`;
        console.log(chalk.white('  ' + taskLine));
      }
    }

    console.log();
  }

  /**
   * Show sprint header when starting execution
   */
  static showSprintHeader(sprint: Sprint) {
    if (!sprint) return;

    const sprintName = sprint.name || 'Unnamed Sprint';
    const sprintEmoji = sprint.emoji || '📋';
    const taskCount = sprint.tasks ? sprint.tasks.length : 0;

    console.log();
    console.log(chalk.dim('═'.repeat(80)));
    console.log(chalk.bold.hex('#FF9500')(`${sprintEmoji}  EXECUTING: SPRINT ${sprint.id} - ${sprintName.toUpperCase()}`) + chalk.dim(` (${taskCount} tasks)`));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();
  }

  /**
   * Show sprint summary after completion
   */
  static showSprintSummary(sprint: Sprint) {
    if (!sprint) return;

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
    console.log(chalk.dim('═'.repeat(80)));
    console.log(chalk.green.bold(`✅ SPRINT ${sprint.id}: ${sprintName.toUpperCase()} - COMPLETED`) + chalk.dim(` (${completedTasks}/${tasks.length} tasks)`));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();

    if (filesCreated.length > 0) {
      console.log(chalk.bold('  FILES CREATED: ') + chalk.white(filesCreated.length));
      filesCreated.slice(0, 5).forEach(file => {
        console.log(chalk.dim('  - ') + chalk.cyan(file));
      });
      if (filesCreated.length > 5) {
        console.log(chalk.dim(`  ... and ${filesCreated.length - 5} more`));
      }
      console.log();
    }

    if (filesModified.length > 0) {
      console.log(chalk.bold('  FILES MODIFIED: ') + chalk.white(filesModified.length));
      filesModified.slice(0, 3).forEach(file => {
        console.log(chalk.dim('  - ') + chalk.yellow(file));
      });
      if (filesModified.length > 3) {
        console.log(chalk.dim(`  ... and ${filesModified.length - 3} more`));
      }
      console.log();
    }

    console.log(chalk.dim('  DURATION: ') + chalk.white(`~${duration} minutes`));
    console.log(chalk.dim('  STATUS: ') + (errors.length > 0
      ? chalk.yellow(`Completed with ${errors.length} warnings`)
      : chalk.green('All tasks completed successfully')));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();
  }

  /**
   * Show task progress while executing
   */
  static showTaskProgress(task: Task, taskIndex: number, totalTasks: number) {
    if (!task) return;

    const percent = Math.round((taskIndex / totalTasks) * 100);
    const statusSymbol = this.getTaskStatusSymbol(task.status);
    const progress = `[${taskIndex}/${totalTasks}]`;
    const taskDescription = task.description || 'No description';

    console.log();
    console.log(statusSymbol + ' ' + chalk.dim(`[SPRINT ${task.sprintId || '?'}] `) + chalk.white(progress) + ' ' + chalk.dim(`[${task.id || '?'}] `) + chalk.white(taskDescription));
  }

  /**
   * Show final roadmap completion summary
   */
  static showRoadmapComplete(roadmap: Roadmap, progress: RoadmapProgress) {
    if (!roadmap || !progress) return;

    const sprints = roadmap.sprints || [];
    const filesCreated = sprints.flatMap(s =>
      (s.tasks || []).flatMap(t => t.filesCreated || [])
    );
    const filesModified = sprints.flatMap(s =>
      (s.tasks || []).flatMap(t => t.filesModified || [])
    );

    console.log();
    console.log(chalk.dim('═'.repeat(80)));
    console.log(chalk.green.bold(`✅ PROJECT COMPLETE: ${roadmap.projectName || 'Project'}`));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();

    console.log(chalk.bold.cyan('  📊 FINAL STATISTICS:'));
    console.log(chalk.dim('  - ') + chalk.white(`Sprints Completed: ${progress.completedSprints || 0}/${progress.totalSprints || 0}`));
    console.log(chalk.dim('  - ') + chalk.white(`Tasks Completed: ${progress.completedTasks || 0}/${progress.totalTasks || 0}`));
    console.log(chalk.dim('  - ') + chalk.white(`Files Created: ${filesCreated.length}`));
    console.log(chalk.dim('  - ') + chalk.white(`Files Modified: ${filesModified.length}`));
    console.log(chalk.dim('  - ') + chalk.white(`Duration: ~${progress.elapsedMinutes || 0} minutes`));
    console.log(chalk.dim('  - ') + chalk.white(`Status: ${roadmap.status || 'unknown'}`));
    console.log();

    console.log(chalk.dim('═'.repeat(80)));
    console.log();
  }

  /**
   * Show prompt to continue to next sprint (for sprint mode)
   */
  static showSprintContinuePrompt(nextSprint: Sprint) {
    if (!nextSprint) return;

    const sprintName = nextSprint.name || 'Unnamed Sprint';
    const taskCount = nextSprint.tasks ? nextSprint.tasks.length : 0;
    const estimatedTime = nextSprint.estimatedMinutes || 0;

    console.log();
    console.log(chalk.dim('═'.repeat(80)));
    console.log(chalk.yellow(`☐ NEXT: SPRINT ${nextSprint.id} - ${sprintName.toUpperCase()}`) + chalk.dim(` (${taskCount} tasks, ~${estimatedTime} min)`));
    console.log(chalk.dim('═'.repeat(80)));
    console.log();
    console.log(chalk.white('  Sprint ') + chalk.cyan(String(nextSprint.id - 1)) + chalk.white(' completed. Ready to start Sprint ') + chalk.cyan(String(nextSprint.id)) + chalk.white('?'));
    console.log(chalk.dim('  (Waiting for user confirmation to continue)'));
    console.log();
  }

  /**
   * Show prompt to continue to next task (for step-by-step mode)
   */
  static showTaskContinuePrompt(nextTask: Task) {
    console.log();
    console.log(chalk.yellow(`☐ [SPRINT ${nextTask.sprintId}] [${nextTask.id}] ${nextTask.description}`));
    console.log();
    console.log(chalk.white('  Task completed. Continue to next task?'));
    console.log(chalk.dim('  (Waiting for user confirmation)'));
    console.log();
  }

  /**
   * Get progress bar visualization
   */
  private static getProgressBar(percent: number, width: number = 30): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;
    return chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
  }

  /**
   * Get task status symbol
   */
  private static getTaskStatusSymbol(status: string): string {
    switch (status) {
      case 'completed':
        return chalk.green('✅');
      case 'in-progress':
        return chalk.yellow('⏳');
      case 'failed':
        return chalk.red('✗');
      case 'skipped':
        return chalk.dim('⊘');
      case 'pending':
      default:
        return chalk.dim('☐');
    }
  }

  /**
   * Get sprint status icon
   */
  private static getSprintStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return chalk.green('✅');
      case 'in-progress':
        return chalk.yellow('⏳');
      case 'failed':
        return chalk.red('✗');
      case 'pending':
      default:
        return '';
    }
  }
}
