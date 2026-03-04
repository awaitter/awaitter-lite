/**
 * Handles keyboard input for aborting operations with Ctrl+C.
 *
 * NOTE: Raw mode (setRawMode) is intentionally NOT used here.
 * Toggling raw mode while readline is active causes readline to emit
 * 'close', which triggers process.exit(0). Instead, we use SIGINT
 * which works correctly alongside readline without any side effects.
 */
export declare class KeyboardHandler {
    private static isListening;
    private static abortCallback;
    /**
     * Start listening for Ctrl+C (SIGINT) to abort operations
     */
    static startListening(onAbort: () => void): void;
    /**
     * Stop listening for abort signals
     */
    static stopListening(): void;
    /**
     * Handle SIGINT (Ctrl+C) — abort current operation without exiting
     */
    private static handleSigInt;
    /**
     * Check if currently listening
     */
    static isActive(): boolean;
}
//# sourceMappingURL=KeyboardHandler.d.ts.map