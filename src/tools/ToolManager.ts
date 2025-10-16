import { Config } from '../config/Config';
import { ReadTool } from './ReadTool';
import { WriteTool } from './WriteTool';
import { EditTool } from './EditTool';
import { BashTool } from './BashTool';
import { GlobTool } from './GlobTool';
import { GrepTool } from './GrepTool';
import { GitStatusTool } from './GitStatusTool';
import { GitDiffTool } from './GitDiffTool';
import { GitCommitTool } from './GitCommitTool';
import { GitBranchTool } from './GitBranchTool';
import { GitLogTool } from './GitLogTool';
import { SnapshotManager } from '../snapshot/SnapshotManager';

export interface Tool {
  name: string;
  description: string;
  parameters: any;
  execute(args: any): Promise<string>;
  needsConfirmation(config: Config): boolean;
}

export class ToolManager {
  private tools: Map<string, Tool> = new Map();

  constructor(private config: Config, private workingDir: string, private snapshotManager?: SnapshotManager) {
    this.initializeTools();
  }

  private initializeTools() {
    const toolConfig = this.config.get('tools');

    // Tools that need SnapshotManager for automatic backups
    if (toolConfig['write']) {
      const writeTool = new WriteTool(this.workingDir, this.config, this.snapshotManager);
      this.tools.set(writeTool.name, writeTool);
    }

    if (toolConfig['edit']) {
      const editTool = new EditTool(this.workingDir, this.config, this.snapshotManager);
      this.tools.set(editTool.name, editTool);
    }

    // Other tools (no snapshot support needed)
    const standardToolClasses = [
      ReadTool,
      BashTool,
      GlobTool,
      GrepTool,
      GitStatusTool,
      GitDiffTool,
      GitCommitTool,
      GitBranchTool,
      GitLogTool
    ];

    for (const ToolClass of standardToolClasses) {
      const tool = new ToolClass(this.workingDir, this.config);

      if (toolConfig[tool.name]) {
        this.tools.set(tool.name, tool);
      }
    }
  }

  getToolSchemas(): any[] {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: {
        type: 'object',
        properties: tool.parameters,
        required: Object.keys(tool.parameters)
      }
    }));
  }

  getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  async executeTool(name: string, args: any): Promise<string> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool not found: ${name}`);
    }

    return tool.execute(args);
  }

  getToolList(): Array<{ name: string; description: string }> {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description
    }));
  }
}
