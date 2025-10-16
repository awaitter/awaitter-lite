import { Config } from '../config/Config';
import { ModelManager } from '../models/ModelManager';
import { SessionManager } from '../session/SessionManager';
import { SnapshotManager } from '../snapshot/SnapshotManager';
import { Roadmap, ExecutionMode } from '../planning/types';
export declare class Agent {
    private config;
    private modelManager;
    private toolManager;
    private workingDir;
    private messages;
    private systemPromptInitialized;
    private sessionManager;
    private snapshotManager;
    private currentSessionId?;
    private currentTaskTodos;
    private originalUserRequest?;
    private currentRoadmap?;
    private isWaitingForContinuation;
    constructor(config: Config, modelManager: ModelManager, workingDir: string, sessionManager?: SessionManager, snapshotManager?: SnapshotManager);
    /**
     * Reinitialize system prompt (used when switching models mid-conversation)
     */
    reinitializeSystemPrompt(): void;
    private initializeSystemPrompt;
    /**
     * Detect TODOs in assistant response and track them
     */
    private detectAndTrackTodos;
    /**
     * Determine if agent should auto-continue based on response
     */
    private shouldAutoContinue;
    process(userInput: string): Promise<void>;
    /**
     * Determine appropriate action message based on user input
     */
    private getActionMessage;
    private executeToolCalls;
    /**
     * Get contextual message for tool execution
     */
    private getToolMessage;
    /**
     * Auto-complete tasks based on recently created/modified files
     * Checks if files exist in working directory and match task descriptions
     * IMPORTANT: Checks ALL pending tasks, not just the current one
     */
    private autoCompleteTasksByFiles;
    getAvailableTools(): {
        name: string;
        description: string;
    }[];
    getContextInfo(): {
        Messages: number;
        'Total characters': number;
        'Working directory': string;
        Model: string;
    };
    clearContext(): void;
    /**
     * Get current roadmap (if any)
     */
    getRoadmap(): Roadmap | undefined;
    /**
     * Set execution mode
     */
    setExecutionMode(mode: ExecutionMode): void;
    /**
     * Notify mode switch and update system prompt immediately
     */
    notifyModeSwitch(newMode: ExecutionMode): void;
    /**
     * Get current execution mode
     */
    getExecutionMode(): ExecutionMode;
    /**
     * Notify model switch and preserve context
     */
    notifyModelSwitch(newModelName: string): void;
    saveConversation(filename?: string): Promise<string>;
    loadConversation(filename: string): Promise<void>;
    /**
     * Auto-save session based on message count
     */
    private autoSaveSession;
    /**
     * Manually save current session
     */
    saveSession(): Promise<string>;
    /**
     * Load a session by ID
     */
    loadSession(sessionId: string): Promise<boolean>;
    /**
     * Load the last session automatically
     */
    loadLastSession(): Promise<boolean>;
    /**
     * Get session manager for external use
     */
    getSessionManager(): SessionManager;
    /**
     * Get current session ID
     */
    getCurrentSessionId(): string | undefined;
    /**
     * Get snapshot manager for external use
     */
    getSnapshotManager(): SnapshotManager;
    /**
     * Undo last N operations
     */
    undoOperations(count?: number): Promise<{
        success: boolean;
        message: string;
        filesRestored: string[];
    }>;
    /**
     * Create a snapshot before destructive operation
     */
    createSnapshot(operation: string, description: string, filePaths: string[]): Promise<string>;
    /**
     * Save current roadmap to ROADMAP.md file in project directory
     */
    private saveRoadmapToFile;
}
//# sourceMappingURL=Agent.d.ts.map