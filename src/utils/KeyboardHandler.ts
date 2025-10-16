import * as readline from 'readline';

/**
 * Handles keyboard input for aborting operations with ESC key
 */
export class KeyboardHandler {
  private static isListening = false;
  private static abortCallback: (() => void) | null = null;
  private static originalRawMode: boolean | undefined;

  /**
   * Start listening for ESC key press
   */
  static startListening(onAbort: () => void) {
    if (this.isListening) {
      return; // Already listening
    }

    this.abortCallback = onAbort;
    this.isListening = true;

    // Enable raw mode to capture individual keystrokes
    if (process.stdin.isTTY) {
      this.originalRawMode = process.stdin.isRaw;
      process.stdin.setRawMode(true);
      process.stdin.resume();

      // Listen for keypress
      process.stdin.on('data', this.handleKeypress);
    }
  }

  /**
   * Stop listening for ESC key press
   */
  static stopListening() {
    if (!this.isListening) {
      return;
    }

    this.isListening = false;
    this.abortCallback = null;

    // Restore original mode
    if (process.stdin.isTTY) {
      process.stdin.removeListener('data', this.handleKeypress);
      process.stdin.setRawMode(this.originalRawMode || false);

      // Don't pause stdin, keep it ready for next input
      // process.stdin.pause();
    }
  }

  /**
   * Handle keypress events
   */
  private static handleKeypress = (buffer: Buffer) => {
    const key = buffer.toString('utf8');
    const code = buffer[0];

    // ESC key has code 27
    if (code === 27) {
      // Call the abort callback
      if (this.abortCallback) {
        this.abortCallback();
      }
    }

    // Ctrl+C should also work (code 3)
    if (code === 3) {
      if (this.abortCallback) {
        this.abortCallback();
      }
    }
  };

  /**
   * Check if currently listening
   */
  static isActive(): boolean {
    return this.isListening;
  }
}
