import { exec } from 'child_process';
import { promisify } from 'util';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';

const execAsync = promisify(exec);

export class GitBranchTool implements Tool {
  name = 'git_branch';
  description = 'Manages git branches: list, create, switch, or delete branches.';
  parameters = {
    action: {
      type: 'string',
      description: 'Action to perform: list, create, switch, delete (default: list)'
    },
    name: {
      type: 'string',
      description: 'Branch name (required for create, switch, delete)'
    },
    force: {
      type: 'boolean',
      description: 'Force delete branch (default: false)'
    }
  };

  constructor(private workingDir: string, private config: Config) {}

  async execute({ action = 'list', name = '', force = false }: any): Promise<string> {
    try {
      let command: string;

      switch (action.toLowerCase()) {
        case 'list':
          command = 'git branch -vv';
          break;

        case 'create':
          if (!name) return 'Error: Branch name required for create action';
          command = `git checkout -b ${name}`;
          break;

        case 'switch':
          if (!name) return 'Error: Branch name required for switch action';
          command = `git checkout ${name}`;
          break;

        case 'delete':
          if (!name) return 'Error: Branch name required for delete action';
          command = force ? `git branch -D ${name}` : `git branch -d ${name}`;
          break;

        default:
          return `Error: Unknown action '${action}'. Use: list, create, switch, or delete`;
      }

      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workingDir
      });

      const output: string[] = [];
      if (stdout) output.push(stdout);
      if (stderr) output.push(stderr);

      return output.join('\n') || 'Operation completed';

    } catch (error: any) {
      return `Error: ${error.message}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return config.get('safety').confirmBash;
  }
}
