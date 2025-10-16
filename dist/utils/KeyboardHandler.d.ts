/**
 * Handles keyboard input for aborting operations with ESC key
 */
export declare class KeyboardHandler {
    private static isListening;
    private static abortCallback;
    private static originalRawMode;
    /**
     * Start listening for ESC key press
     */
    static startListening(onAbort: () => void): void;
    /**
     * Stop listening for ESC key press
     */
    static stopListening(): void;
    /**
     * Handle keypress events
     */
    private static handleKeypress;
    /**
     * Check if currently listening
     */
    static isActive(): boolean;
}
//# sourceMappingURL=KeyboardHandler.d.ts.map