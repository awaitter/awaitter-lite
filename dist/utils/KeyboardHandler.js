"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KeyboardHandler = void 0;
/**
 * Handles keyboard input for aborting operations with Ctrl+C.
 *
 * NOTE: Raw mode (setRawMode) is intentionally NOT used here.
 * Toggling raw mode while readline is active causes readline to emit
 * 'close', which triggers process.exit(0). Instead, we use SIGINT
 * which works correctly alongside readline without any side effects.
 */
class KeyboardHandler {
    static isListening = false;
    static abortCallback = null;
    /**
     * Start listening for Ctrl+C (SIGINT) to abort operations
     */
    static startListening(onAbort) {
        if (this.isListening) {
            return;
        }
        this.abortCallback = onAbort;
        this.isListening = true;
        process.once('SIGINT', KeyboardHandler.handleSigInt);
    }
    /**
     * Stop listening for abort signals
     */
    static stopListening() {
        if (!this.isListening) {
            return;
        }
        this.isListening = false;
        this.abortCallback = null;
        process.removeListener('SIGINT', KeyboardHandler.handleSigInt);
    }
    /**
     * Handle SIGINT (Ctrl+C) — abort current operation without exiting
     */
    static handleSigInt = () => {
        if (KeyboardHandler.abortCallback) {
            KeyboardHandler.abortCallback();
        }
        // Do NOT call process.exit — let the agent loop handle abort gracefully
    };
    /**
     * Check if currently listening
     */
    static isActive() {
        return this.isListening;
    }
}
exports.KeyboardHandler = KeyboardHandler;
//# sourceMappingURL=KeyboardHandler.js.map