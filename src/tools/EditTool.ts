import * as fs from 'fs';
import * as path from 'path';
import { Tool } from './ToolManager';
import { Config } from '../config/Config';
import { SnapshotManager } from '../snapshot/SnapshotManager';

export class EditTool implements Tool {
  name = 'edit';
  description = 'Edit a file by replacing old_string with new_string. The old_string must match exactly.';
  parameters = {
    file_path: {
      type: 'string',
      description: 'The path to the file to edit'
    },
    old_string: {
      type: 'string',
      description: 'The exact string to replace (must be unique in file)'
    },
    new_string: {
      type: 'string',
      description: 'The new string to replace it with'
    },
    replace_all: {
      type: 'boolean',
      description: 'Replace all occurrences (default: false)'
    }
  };

  constructor(private workingDir: string, private config: Config, private snapshotManager?: SnapshotManager) {}

  async execute({ file_path, old_string, new_string, replace_all = false }: any): Promise<string> {
    try {
      const fullPath = path.resolve(this.workingDir, file_path);

      if (!fullPath.startsWith(this.workingDir)) {
        return 'Error: Access denied - path is outside working directory';
      }

      if (!fs.existsSync(fullPath)) {
        return `Error: File not found: ${file_path}`;
      }

      // Read file
      let content = fs.readFileSync(fullPath, 'utf-8');

      // Check if old_string exists
      if (!content.includes(old_string)) {
        return 'Error: old_string not found in file';
      }

      // Count occurrences
      const count = (content.match(new RegExp(old_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;

      if (count > 1 && !replace_all) {
        return `Error: old_string appears ${count} times. Use replace_all=true or provide a more specific string.`;
      }

      // 📸 Create snapshot BEFORE editing (for /undo functionality)
      if (this.snapshotManager) {
        try {
          await this.snapshotManager.createSnapshot(
            'edit',
            `Editing ${file_path}`,
            [file_path],
            this.workingDir
          );
        } catch (snapshotError) {
          // Non-fatal: continue even if snapshot fails
          console.warn('Warning: Could not create snapshot:', snapshotError);
        }
      }

      // Legacy backup if configured (kept for backwards compatibility)
      if (this.config.get('safety').confirmEdit) {
        const backupPath = fullPath + '.backup';
        fs.writeFileSync(backupPath, content);
      }

      // Replace
      if (replace_all) {
        content = content.split(old_string).join(new_string);
      } else {
        content = content.replace(old_string, new_string);
      }

      // Write back
      fs.writeFileSync(fullPath, content, 'utf-8');

      const replacements = replace_all ? count : 1;
      return `Edited ${file_path}: ${replacements} replacement(s) made`;

    } catch (error) {
      return `Error editing file: ${error instanceof Error ? error.message : error}`;
    }
  }

  needsConfirmation(config: Config): boolean {
    return config.get('safety').confirmEdit;
  }
}
