import * as path from 'path';
import * as fs from 'fs';
import fg from 'fast-glob';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

export class GrepTool implements Tool {
  name = 'grep';
  description = 'Search for a pattern in files. Supports regex patterns.';
  parameters = {
    pattern: {
      type: 'string',
      description: 'The regex pattern to search for'
    },
    path: {
      type: 'string',
      description: 'File or directory to search in (default: current directory)'
    },
    glob_pattern: {
      type: 'string',
      description: 'Glob pattern to filter files (e.g., \'*.py\')'
    },
    case_insensitive: {
      type: 'boolean',
      description: 'Case insensitive search (default: false)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ pattern, path: searchPath = '.', glob_pattern = '*', case_insensitive = false }: any): Promise<string> {
    try {
      const fullPath = path.resolve(this.workingDir, searchPath);

      if (!fullPath.startsWith(this.workingDir)) {
        return 'Error: Access denied - path is outside working directory';
      }

      if (!fs.existsSync(fullPath)) {
        return `Error: Path not found: ${searchPath}`;
      }

      // Create regex
      const flags = case_insensitive ? 'gi' : 'g';
      const regex = new RegExp(pattern, flags);

      // Get files to search
      let files: string[];
      if (fs.statSync(fullPath).isFile()) {
        files = [fullPath];
      } else {
        files = await fg(`**/${glob_pattern}`, {
          cwd: fullPath,
          absolute: true,
          onlyFiles: true
        });
      }

      // Search in files
      const results: string[] = [];
      let totalMatches = 0;

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          const fileMatches: string[] = [];

          lines.forEach((line, i) => {
            if (regex.test(line)) {
              totalMatches++;
              const lineNum = i + 1;
              fileMatches.push(`  → ${lineNum}: ${line.trim()}`);
            }
          });

          if (fileMatches.length > 0) {
            const relPath = path.relative(this.workingDir, filePath);
            results.push(`\n${relPath}:`);
            results.push(...fileMatches);
          }

        } catch (error) {
          // Skip files that can't be read
          continue;
        }
      }

      if (results.length === 0) {
        return `No matches found for pattern: ${pattern}`;
      }

      const output = [`Found ${totalMatches} matches in ${results.filter(r => r.startsWith('\n')).length} files:`, ...results];

      // Limit output
      const outputStr = output.join('\n');
      if (outputStr.length > 10000) {
        return outputStr.slice(0, 10000) + '\n... (output truncated)';
      }

      return outputStr;

    } catch (error) {
      return `Error searching files: ${error instanceof Error ? error.message : error}`;
    }
  }

  needsConfirmation(): boolean {
    return false;
  }
}
