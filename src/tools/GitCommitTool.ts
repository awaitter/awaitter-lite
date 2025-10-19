import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class GitCommitTool implements Tool {
  name = 'git_commit';
  description = 'Creates a git commit with the specified message. Automatically stages all changes unless files are specified.';
  parameters = {
    message: {
      type: 'string',
      description: 'Commit message (required)'
    },
    files: {
      type: 'array',
      description: 'Specific files to stage and commit (default: all changes)',
      items: {
        type: 'string'
      }
    },
    amend: {
      type: 'boolean',
      description: 'Amend the last commit (default: false)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ message, files = [], amend = false }: any): Promise<string> {
    try {
      if (!message) {
        return 'Error: Commit message is required';
      }

      const output: string[] = [];

      // Stage files
      if (!amend) {
        const addCommand = files.length > 0
          ? `git add ${files.join(' ')}`
          : 'git add -A';

        const { stdout: addStdout, stderr: addStderr } = await execAsync(addCommand, {
          cwd: this.workingDir
        });

        if (addStderr) {
          output.push(`Stage warnings: ${addStderr}`);
        }
      }

      // Create commit
      const commitCommand = amend
        ? `git commit --amend -m "${message.replace(/"/g, '\\"')}"`
        : `git commit -m "${message.replace(/"/g, '\\"')}"`;

      const { stdout, stderr } = await execAsync(commitCommand, {
        cwd: this.workingDir
      });

      if (stdout) output.push(stdout);
      if (stderr) output.push(stderr);

      // Show brief status after commit
      const { stdout: statusStdout } = await execAsync('git status -s', {
        cwd: this.workingDir
      });

      if (statusStdout) {
        output.push('\nRemaining changes:');
        output.push(statusStdout);
      }

      return output.join('\n') || 'Commit created successfully';

    } catch (error: any) {
      if (error.message.includes('nothing to commit')) {
        return 'No changes to commit';
      }
      return `Error: ${error.message}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return config.get('safety').confirmBash; // Use same safety setting as bash
  }
}
