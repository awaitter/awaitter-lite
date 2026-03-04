/**
 * ToolCallParser — Shared utility for extracting tool calls from model content.
 *
 * Local models (qwen2.5-coder, deepseek, etc.) don't always use the native
 * OpenAI tool_calls API format. They sometimes emit tool calls as:
 *   1. JSON inside ```json ... ``` blocks
 *   2. Bare JSON objects in free text (no delimiters)
 *
 * This parser handles all three cases with a brace-counting approach
 * that correctly handles arbitrarily nested JSON (unlike regex).
 */
export interface ParsedToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}
/**
 * Main entry point: parses tool calls from model content text.
 *
 * Tries strategy A (```json blocks) first, then strategy B (bare JSON).
 * Returns the extracted tool calls and the content with the JSON stripped out
 * so it doesn't get displayed as raw text to the user.
 */
export declare function parseToolCallsFromContent(content: string): {
    calls: ParsedToolCall[];
    cleanedContent: string;
};
//# sourceMappingURL=ToolCallParser.d.ts.map