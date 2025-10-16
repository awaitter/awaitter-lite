import * as path from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

export class GlobTool implements Tool {
  name = 'glob';
  description = 'Find files matching a glob pattern (e.g., \'**/*.py\', \'src/**/*.js\')';
  parameters = {
    pattern: {
      type: 'string',
      description: 'The glob pattern to match (e.g., \'**/*.py\' for all Python files)'
    },
    path: {
      type: 'string',
      description: 'Directory to search in (default: current directory)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ pattern, path: searchPath = '.' }: any): Promise<string> {
    try {
      const fullPath = path.resolve(this.workingDir, searchPath);

      if (!fullPath.startsWith(this.workingDir)) {
        return 'Error: Access denied - path is outside working directory';
      }

      if (!fs.existsSync(fullPath)) {
        return `Error: Directory not found: ${searchPath}`;
      }

      // Find matching files
      const matches = await fg(pattern, {
        cwd: fullPath,
        absolute: false,
        stats: true
      });

      if (matches.length === 0) {
        return `No files found matching pattern: ${pattern}`;
      }

      // Sort by modification time
      matches.sort((a: any, b: any) => b.stats.mtimeMs - a.stats.mtimeMs);

      // Format output
      const output: string[] = [`Found ${matches.length} files matching '${pattern}':`];

      const limit = Math.min(matches.length, 100);
      for (let i = 0; i < limit; i++) {
        const match: any = matches[i];
        const size = match.stats.size;
        output.push(`  ${match.path} (${size} bytes)`);
      }

      if (matches.length > 100) {
        output.push(`  ... and ${matches.length - 100} more files`);
      }

      return output.join('\n');

    } catch (error) {
      return `Error finding files: ${error instanceof Error ? error.message : error}`;
    }
  }

  needsConfirmation(): boolean {
    return false;
  }
}
