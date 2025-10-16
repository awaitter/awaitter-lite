import * as fs from 'fs';
import * as path from 'path';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

export class ReadTool implements Tool {
  name = 'read';
  description = 'Read the contents of a file. Returns the file content with line numbers.';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The path to the file to read (relative to working directory)'
    },
    offset: {
      type: 'number',
      description: 'Line number to start reading from (optional)'
    },
    limit: {
      type: 'number',
      description: 'Number of lines to read (optional)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ file_path, offset, limit }: any): Promise<string> {
    try {
      const fullPath = path.resolve(this.workingDir, file_path);

      // Security check
      if (!fullPath.startsWith(this.workingDir)) {
        return 'Error: Access denied - path is outside working directory';
      }

      if (!fs.existsSync(fullPath)) {
        return `Error: File not found: ${file_path}`;
      }

      if (!fs.statSync(fullPath).isFile()) {
        return `Error: Not a file: ${file_path}`;
      }

      // Read file
      const content = fs.readFileSync(fullPath, 'utf-8');
      let lines = content.split('\n');

      // Apply offset and limit
      if (offset) {
        lines = lines.slice(offset - 1);
      }

      if (limit) {
        lines = lines.slice(0, limit);
      }

      // Format with line numbers
      const startLine = offset || 1;
      const formatted = lines.map((line, i) => {
        const lineNum = startLine + i;
        return `${lineNum.toString().padStart(6)} \t${line}`;
      }).join('\n');

      return formatted;

    } catch (error) {
      return `Error reading file: ${error instanceof Error ? error.message : error}`;
    }
  }

  needsConfirmation(): boolean {
    return false;
  }
}
