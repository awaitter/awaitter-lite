import * as fs from 'fs';
import * as path from 'path';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';
import { SnapshotManager } from '../snapshot/SnapshotManager';

export class WriteTool implements Tool {
  name = 'write';
  description = 'Write content to a file. Creates the file if it doesn\'t exist, overwrites if it does.';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The path to the file to write (relative to working directory)'
    },
    content: {
      type: 'string',
      description: 'The content to write to the file'
    }
  };

  constructor(private workingDir: string, private config: Config, private snapshotManager?: SnapshotManager) {}

  async execute({ file_path, content }: any): Promise<string> {
    try {
      const fullPath = path.resolve(this.workingDir, file_path);

      // Security check
      if (!fullPath.startsWith(this.workingDir)) {
        return 'Error: Access denied - path is outside working directory';
      }

      // Create parent directories
      const dir = path.dirname(fullPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const exists = fs.existsSync(fullPath);

      // 📸 Create snapshot BEFORE writing (for /undo functionality)
      if (this.snapshotManager && exists) {
        try {
          await this.snapshotManager.createSnapshot(
            'write',
            `Overwriting ${file_path}`,
            [file_path],
            this.workingDir
          );
        } catch (snapshotError) {
          // Non-fatal: continue even if snapshot fails
          console.warn('Warning: Could not create snapshot:', snapshotError);
        }
      }

      // Write file
      fs.writeFileSync(fullPath, content, 'utf-8');

      const action = exists ? 'Updated' : 'Created';
      const lines = content.split('\n').length;

      return `${action} file: ${file_path} (${lines} lines)`;

    } catch (error) {
      return `Error writing file: ${error instanceof Error ? error.message : error}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return config.get('safety').confirmWrite;
  }
}
