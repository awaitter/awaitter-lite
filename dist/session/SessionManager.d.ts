interface SessionData {
    id: string;
    timestamp: string;
    model: string;
    workingDir: string;
    messageCount: number;
    lastActivity: string;
    messages: any[];
    roadmap?: any;
    originalUserRequest?: string;
}
export declare class SessionManager {
    private sessionsDir;
    private autosaveEnabled;
    private autosaveInterval;
    constructor(autosaveEnabled?: boolean, autosaveInterval?: number);
    /**
     * Save a session to disk
     */
    saveSession(messages: any[], model: string, workingDir: string, sessionId?: string, roadmap?: any, originalUserRequest?: string): Promise<string>;
    /**
     * Load a session from disk
     */
    loadSession(sessionId: string): Promise<SessionData | null>;
    /**
     * Get the most recent session
     */
    getLastSession(): Promise<SessionData | null>;
    /**
     * List all sessions (sorted by most recent first)
     */
    listSessions(): Promise<Array<{
        id: string;
        timestamp: string;
        model: string;
        workingDir: string;
        messageCount: number;
        lastActivity: string;
    }>>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Promise<boolean>;
    /**
     * Clear all sessions
     */
    clearAllSessions(): Promise<number>;
    /**
     * Check if auto-save should happen based on message count
     */
    shouldAutosave(messageCount: number): boolean;
    /**
     * Generate a unique session ID
     */
    private generateSessionId;
    /**
     * Get sessions directory path
     */
    getSessionsDir(): string;
    /**
     * Export session to a specific location
     */
    exportSession(sessionId: string, exportPath: string): Promise<boolean>;
    /**
     * Import session from a file
     */
    importSession(importPath: string): Promise<string | null>;
}
export {};
//# sourceMappingURL=SessionManager.d.ts.map