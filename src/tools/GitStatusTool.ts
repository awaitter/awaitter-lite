import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class GitStatusTool implements Tool {
  name = 'git_status';
  description = 'Shows the current git repository status including staged, unstaged, and untracked files.';
  parameters = {
    short: {
      type: 'boolean',
      description: 'Show short format (default: false)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ short = false }: any): Promise<string> {
    try {
      // Check if we're in a git repository
      const { stdout: isRepo } = await execAsync('git rev-parse --is-inside-work-tree', {
        cwd: this.workingDir
      }).catch(() => ({ stdout: '' }));

      if (!isRepo.trim()) {
        return 'Error: Not a git repository. Initialize with: git init';
      }

      const command = short ? 'git status -s' : 'git status';
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDir
      });

      if (stderr) {
        return `STDERR:\n${stderr}`;
      }

      return stdout || 'Working tree clean';

    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return false; // git status is read-only, no confirmation needed
  }
}
