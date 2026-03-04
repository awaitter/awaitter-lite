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
 * Sanitizes a raw JSON string by escaping literal control characters
 * that appear inside string values. Some models emit unescaped newlines
 * inside content strings which breaks JSON.parse.
 */
function sanitizeJsonString(raw: string): string {
  let result = '';
  let inString = false;
  let escape = false;

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];

    if (escape) {
      escape = false;
      result += ch;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      result += ch;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString) {
      if (ch === '\n') { result += '\\n'; continue; }
      if (ch === '\r') { result += '\\r'; continue; }
      if (ch === '\t') { result += '\\t'; continue; }
    }
    result += ch;
  }
  return result;
}

/**
 * Extracts a complete JSON object starting at startIdx using brace-counting.
 * Returns the full JSON string or null if no complete object found.
 */
function extractJsonObject(content: string, startIdx: number): string | null {
  const openBrace = content.indexOf('{', startIdx);
  if (openBrace === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = openBrace; i < content.length; i++) {
    const ch = content[i];

    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }

    if (!inString) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          return content.slice(openBrace, i + 1);
        }
      }
    }
  }
  return null;
}

/**
 * Tries to parse a raw JSON string into a ParsedToolCall.
 * Returns null if the JSON is invalid or doesn't have {name, arguments} shape.
 */
function tryParseToolCall(raw: string, id: number): ParsedToolCall | null {
  const sanitized = sanitizeJsonString(raw);
  try {
    const parsed = JSON.parse(sanitized);
    if (parsed && typeof parsed.name === 'string' && parsed.arguments !== undefined) {
      return {
        id: `call_${Date.now()}_${id}`,
        type: 'function',
        function: {
          name: parsed.name,
          arguments: typeof parsed.arguments === 'string'
            ? parsed.arguments
            : JSON.stringify(parsed.arguments)
        }
      };
    }
  } catch {
    // Not valid JSON or wrong shape
  }
  return null;
}

/**
 * Strategy A: Extract tool calls from ```json ... ``` blocks.
 * Uses brace-counting (not regex) to correctly handle nested JSON.
 */
function extractFromJsonBlocks(content: string): { calls: ParsedToolCall[]; positions: Array<[number, number]> } {
  const calls: ParsedToolCall[] = [];
  const positions: Array<[number, number]> = []; // [start, end] of each matched block
  let id = 0;
  let searchFrom = 0;

  while (true) {
    const markerIdx = content.indexOf('```json', searchFrom);
    if (markerIdx === -1) break;

    const afterMarker = markerIdx + 7; // length of '```json'
    const openBrace = content.indexOf('{', afterMarker);
    if (openBrace === -1) { searchFrom = afterMarker; continue; }

    // Make sure the brace comes before the closing ```
    const closeMarker = content.indexOf('```', afterMarker);
    if (closeMarker !== -1 && openBrace > closeMarker) {
      searchFrom = closeMarker + 3;
      continue;
    }

    const raw = extractJsonObject(content, openBrace);
    if (raw) {
      const call = tryParseToolCall(raw, id++);
      if (call) {
        calls.push(call);
        // Find the closing ``` after this JSON object
        const endMarker = content.indexOf('```', openBrace + raw.length);
        const blockEnd = endMarker !== -1 ? endMarker + 3 : openBrace + raw.length;
        positions.push([markerIdx, blockEnd]);
      }
      searchFrom = openBrace + raw.length;
    } else {
      searchFrom = afterMarker;
    }
  }

  return { calls, positions };
}

/**
 * Strategy B: Extract bare JSON objects from free text (no delimiters).
 * Scans every '{' and uses brace-counting. Only accepts {name, arguments} shapes.
 */
function extractFromBareJson(content: string): { calls: ParsedToolCall[]; positions: Array<[number, number]> } {
  const calls: ParsedToolCall[] = [];
  const positions: Array<[number, number]> = [];
  let id = 0;
  let i = 0;

  while (i < content.length) {
    const openBrace = content.indexOf('{', i);
    if (openBrace === -1) break;

    const raw = extractJsonObject(content, openBrace);
    if (raw) {
      const call = tryParseToolCall(raw, id++);
      if (call) {
        calls.push(call);
        positions.push([openBrace, openBrace + raw.length]);
      }
      i = openBrace + raw.length;
    } else {
      i = openBrace + 1;
    }
  }

  return { calls, positions };
}

/**
 * Removes matched regions from content string (in reverse order to preserve indices).
 */
function removeRegions(content: string, positions: Array<[number, number]>): string {
  let result = content;
  // Sort in reverse order so removing from the end doesn't shift earlier indices
  const sorted = [...positions].sort((a, b) => b[0] - a[0]);
  for (const [start, end] of sorted) {
    result = result.slice(0, start) + result.slice(end);
  }
  return result.trim();
}

/**
 * Main entry point: parses tool calls from model content text.
 *
 * Tries strategy A (```json blocks) first, then strategy B (bare JSON).
 * Returns the extracted tool calls and the content with the JSON stripped out
 * so it doesn't get displayed as raw text to the user.
 */
export function parseToolCallsFromContent(
  content: string
): { calls: ParsedToolCall[]; cleanedContent: string } {
  // Strategy A: ```json blocks
  const blockResult = extractFromJsonBlocks(content);
  if (blockResult.calls.length > 0) {
    const cleanedContent = removeRegions(content, blockResult.positions);
    return { calls: blockResult.calls, cleanedContent };
  }

  // Strategy B: bare JSON objects
  const bareResult = extractFromBareJson(content);
  if (bareResult.calls.length > 0) {
    const cleanedContent = removeRegions(content, bareResult.positions);
    return { calls: bareResult.calls, cleanedContent };
  }

  return { calls: [], cleanedContent: content };
}
