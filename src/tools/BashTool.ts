import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class BashTool implements Tool {
  name = 'bash';
  description = 'Execute a bash command in the working directory. Returns stdout and stderr.';
  parameters = {
    command: {
      type: 'string',
      description: 'The command to execute'
    },
    timeout: {
      type: 'number',
      description: 'Timeout in seconds (default: 30)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ command, timeout = 30 }: any): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDir,
        timeout: timeout * 1000,
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      const output: string[] = [];

      if (stdout) {
        output.push('STDOUT:');
        output.push(stdout);
      }

      if (stderr) {
        output.push('STDERR:');
        output.push(stderr);
      }

      return output.join('\n');

    } catch (error: any) {
      if (error.killed) {
        return `Error: Command timed out after ${timeout} seconds`;
      }

      const output: string[] = [];

      if (error.stdout) {
        output.push('STDOUT:');
        output.push(error.stdout);
      }

      if (error.stderr) {
        output.push('STDERR:');
        output.push(error.stderr);
      }

      output.push(`\nExit code: ${error.code || 'unknown'}`);

      return output.join('\n');
    }
  }

  needsConfirmation(config: Config): boolean {
    return config.get('safety').confirmBash;
  }
}
