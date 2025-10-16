import { Roadmap, Sprint, Task, RoadmapProgress } from '../planning/types';
/**
 * UI Helper for consistent Claude Code-style interface
 */
export declare class UIHelper {
    private static statusLine;
    private static spinner;
    private static currentWorkingDir;
    private static currentModel;
    /**
     * Initialize UI with context
     */
    static initialize(workingDir: string, model: string): void;
    /**
     * Show input prompt with top border
     */
    static showInputPrompt(): void;
    /**
     * Show status bar below input (like Claude Code)
     */
    static showStatusBar(message?: string): void;
    /**
     * Strip ANSI codes to get real length
     */
    private static stripAnsi;
    /**
     * Update status line (shown below input)
     */
    static updateStatus(message: string, icon?: string): void;
    /**
     * Clear status line
     */
    static clearStatus(): void;
    /**
     * Start animated spinner with message
     */
    static startSpinner(message: string): void;
    /**
     * Update spinner message
     */
    static updateSpinner(message: string): void;
    /**
     * Stop spinner with success
     */
    static stopSpinner(message?: string): void;
    /**
     * Show section divider
     */
    static showDivider(char?: string): void;
    /**
     * Show user message header
     */
    static showUserHeader(): void;
    /**
     * Show assistant message header
     */
    static showAssistantHeader(): void;
    /**
     * Show tool execution
     */
    static showToolExecution(toolName: string, args: any): void;
    /**
     * Show tool result (success)
     */
    static showToolSuccess(preview: string): void;
    /**
     * Show tool result (error)
     */
    static showToolError(error: string): void;
    /**
     * Show thinking indicator
     */
    static showThinking(): void;
    /**
     * Show tool running indicator
     */
    static showRunningTool(toolName: string): void;
    /**
     * Format user message
     */
    static formatUserMessage(message: string): void;
    /**
     * Show error message
     */
    static showError(error: string): void;
    /**
     * Show box with text
     */
    static showBox(lines: string[], title?: string): void;
    /**
     * Show full roadmap with all sprints and tasks
     */
    static showRoadmap(roadmap: Roadmap, progress?: RoadmapProgress): void;
    /**
     * Show a sprint within the roadmap view
     */
    private static showSprintInRoadmap;
    /**
     * Show sprint header when starting execution
     */
    static showSprintHeader(sprint: Sprint): void;
    /**
     * Show sprint summary after completion
     */
    static showSprintSummary(sprint: Sprint): void;
    /**
     * Show task progress while executing
     */
    static showTaskProgress(task: Task, taskIndex: number, totalTasks: number): void;
    /**
     * Show final roadmap completion summary
     */
    static showRoadmapComplete(roadmap: Roadmap, progress: RoadmapProgress): void;
    /**
     * Show prompt to continue to next sprint (for sprint mode)
     */
    static showSprintContinuePrompt(nextSprint: Sprint): void;
    /**
     * Show prompt to continue to next task (for step-by-step mode)
     */
    static showTaskContinuePrompt(nextTask: Task): void;
    /**
     * Get progress bar visualization
     */
    private static getProgressBar;
    /**
     * Get task status symbol
     */
    private static getTaskStatusSymbol;
    /**
     * Get sprint status icon
     */
    private static getSprintStatusIcon;
}
//# sourceMappingURL=UIHelper.d.ts.map