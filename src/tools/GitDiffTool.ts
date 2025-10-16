import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class GitDiffTool implements Tool {
  name = 'git_diff';
  description = 'Shows git diff for changes. Can show staged, unstaged, or diff between commits.';
  parameters = {
    staged: {
      type: 'boolean',
      description: 'Show staged changes only (git diff --staged)'
    },
    file: {
      type: 'string',
      description: 'Specific file to diff'
    },
    commit1: {
      type: 'string',
      description: 'First commit hash for comparison'
    },
    commit2: {
      type: 'string',
      description: 'Second commit hash for comparison (defaults to HEAD)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ staged = false, file = '', commit1 = '', commit2 = '' }: any): Promise<string> {
    try {
      let command = 'git diff';

      if (commit1) {
        command = commit2
          ? `git diff ${commit1} ${commit2}`
          : `git diff ${commit1}`;
      } else if (staged) {
        command = 'git diff --staged';
      }

      if (file) {
        command += ` -- ${file}`;
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB for large diffs
      });

      if (stderr) {
        return `STDERR:\n${stderr}`;
      }

      return stdout || 'No changes';

    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return false; // git diff is read-only, no confirmation needed
  }
}
