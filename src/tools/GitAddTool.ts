import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class GitAddTool implements Tool {
  name = 'git_add';
  description = 'Stages files for git commit. Use before git_commit to stage specific files or all changes.';
  parameters = {
    files: {
      type: 'array',
      description: 'Specific files or patterns to stage (e.g. ["src/index.ts", "package.json"]). If empty, stages all changes.',
      items: {
        type: 'string'
      }
    },
    all: {
      type: 'boolean',
      description: 'Stage all changes including untracked files with git add -A (default: true when no files specified)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ files = [], all = true }: any): Promise<string> {
    try {
      const command = files && files.length > 0
        ? `git add ${files.join(' ')}`
        : all ? 'git add -A' : 'git add .';

      await execAsync(command, { cwd: this.workingDir });

      // Show what was staged
      const { stdout: statusOut } = await execAsync('git status -s', { cwd: this.workingDir });

      const staged = statusOut
        .split('\n')
        .filter(line => line.startsWith('A ') || line.startsWith('M ') || line.startsWith('D '))
        .join('\n');

      return `Staged successfully.\n${staged || statusOut || 'No changes to show'}`;
    } catch (error: any) {
      if (error.message.includes('not a git repository')) {
        return 'Error: Not a git repository. Run git init first.';
      }
      return `Error: ${error.message}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return false; // git add is safe, no confirmation needed
  }
}
