import { Roadmap, Sprint, Task, ProjectType } from './types';

/**
 * Parse a roadmap from model's text response
 */
export class RoadmapParser {
  /**
   * Detect if the text contains a roadmap
   */
  static hasRoadmap(text: string): boolean {
    return text.includes('📋 PROJECT ROADMAP:') ||
           text.includes('PROJECT ROADMAP:');
  }

  /**
   * Parse roadmap from text
   */
  static parseRoadmap(text: string, originalRequest: string): Roadmap | null {
    if (!this.hasRoadmap(text)) {
      console.log('  [Parser] No roadmap marker found in text');
      return null;
    }

    console.log('  [Parser] Roadmap marker found, attempting to parse...');

    try {
      // Extract project name - try both with and without emoji
      const projectNameMatch = text.match(/(?:📋\s*)?PROJECT ROADMAP:\s*(.+)/i);
      if (!projectNameMatch) {
        console.log('  [Parser] Failed to extract project name');
        return null;
      }
      const projectName = projectNameMatch[1].trim();
      console.log(`  [Parser] Project name extracted: "${projectName}"`);

      // Extract sprints
      const sprints = this.parseSprints(text);
      console.log(`  [Parser] Found ${sprints.length} sprints`);
      if (sprints.length === 0) {
        console.log('  [Parser] No sprints found, parsing failed');
        return null;
      }

      // Calculate totals
      const totalTasks = sprints.reduce((sum, sprint) => sum + sprint.tasks.length, 0);
      const totalEstimatedMinutes = sprints.reduce((sum, sprint) => sum + sprint.estimatedMinutes, 0);

      // Detect project type from text
      const projectType = this.detectProjectType(text, originalRequest);

      const roadmap: Roadmap = {
        id: `roadmap_${Date.now()}`,
        projectName,
        projectType,
        originalRequest,
        sprints,
        totalTasks,
        totalEstimatedMinutes,
        createdAt: new Date(),
        status: 'planning',
        currentSprintId: 1,
        currentTaskId: sprints[0]?.tasks[0]?.id
      };

      return roadmap;
    } catch (error) {
      console.error('Error parsing roadmap:', error);
      return null;
    }
  }

  /**
   * Parse sprints from text
   */
  private static parseSprints(text: string): Sprint[] {
    const sprints: Sprint[] = [];

    // Match sprint headers like: 🏗️  SPRINT 1: FOUNDATION (Estimated: ~10 min)
    const sprintRegex = /([🏗️🎨🔗🚀🔍🧹⚡✅📡🔐🔧])\s*SPRINT\s+(\d+):\s*([A-Z\s-]+)\s*\(Estimated:\s*~?(\d+)\s*min\)/gi;

    let match;
    const sprintMatches: Array<{ emoji: string; id: number; name: string; estimatedMinutes: number; index: number }> = [];

    while ((match = sprintRegex.exec(text)) !== null) {
      console.log(`  [Parser] Found sprint ${match[2]}: ${match[3].trim()}`);
      sprintMatches.push({
        emoji: match[1],
        id: parseInt(match[2]),
        name: match[3].trim(),
        estimatedMinutes: parseInt(match[4]),
        index: match.index
      });
    }

    if (sprintMatches.length === 0) {
      console.log('  [Parser] No sprint headers matched the regex pattern');
      console.log('  [Parser] Looking for pattern: [emoji] SPRINT [N]: [NAME] (Estimated: ~[N] min)');
    }

    // For each sprint, extract its tasks
    for (let i = 0; i < sprintMatches.length; i++) {
      const sprintMatch = sprintMatches[i];
      const nextSprintIndex = sprintMatches[i + 1]?.index || text.length;

      // Extract text between this sprint and the next
      const sprintText = text.substring(sprintMatch.index, nextSprintIndex);

      // Parse tasks for this sprint
      const tasks = this.parseTasks(sprintText, sprintMatch.id);
      console.log(`  [Parser] Sprint ${sprintMatch.id} has ${tasks.length} tasks`);

      const sprint: Sprint = {
        id: sprintMatch.id,
        name: sprintMatch.name,
        description: sprintMatch.name,
        emoji: sprintMatch.emoji,
        estimatedMinutes: sprintMatch.estimatedMinutes,
        tasks,
        status: 'pending'
      };

      sprints.push(sprint);
    }

    return sprints;
  }

  /**
   * Parse tasks from sprint text
   */
  private static parseTasks(sprintText: string, sprintId: number): Task[] {
    const tasks: Task[] = [];

    // Match tasks like: ☐ 1.1  Set up React + TypeScript project
    const taskRegex = /[☐□✓✅]\s*(\d+\.\d+)\s+(.+)/g;

    let match;
    while ((match = taskRegex.exec(sprintText)) !== null) {
      const taskId = match[1];
      const description = match[2].trim();

      // Determine status from checkbox
      const checkbox = match[0][0];
      let status: 'pending' | 'in-progress' | 'completed';
      if (checkbox === '✓' || checkbox === '✅') {
        status = 'completed';
      } else if (checkbox === '⏳') {
        status = 'in-progress';
      } else {
        status = 'pending';
      }

      const task: Task = {
        id: taskId,
        sprintId,
        description,
        status
      };

      tasks.push(task);
    }

    return tasks;
  }

  /**
   * Detect project type from text
   */
  private static detectProjectType(text: string, originalRequest: string): ProjectType {
    const combined = (text + ' ' + originalRequest).toLowerCase();

    if (combined.includes('web app') || combined.includes('webapp') || combined.includes('react') || combined.includes('vue') || combined.includes('angular')) {
      return 'web-app';
    }
    if (combined.includes('api') || combined.includes('backend') || combined.includes('endpoint')) {
      return 'api';
    }
    if (combined.includes('cli') || combined.includes('command line') || combined.includes('terminal')) {
      return 'cli';
    }
    if (combined.includes('library') || combined.includes('package') || combined.includes('npm')) {
      return 'library';
    }
    if (combined.includes('refactor') || combined.includes('cleanup') || combined.includes('improve code')) {
      return 'refactor';
    }
    if (combined.includes('bug') || combined.includes('fix') || combined.includes('error')) {
      return 'bug-fix';
    }
    if (combined.includes('feature') || combined.includes('add') || combined.includes('implement')) {
      return 'feature';
    }

    return 'web-app'; // Default
  }

  /**
   * Update existing roadmap with new status from text
   * Detects multiple patterns of task completion/progress
   */
  static updateRoadmapFromText(roadmap: Roadmap, text: string): Roadmap {
    let updatedCount = 0;

    // Pattern 1: ✅ [SPRINT 1] [1.1] Task completed
    const pattern1 = /([✅⏳☐□])\s*\[SPRINT\s+(\d+)\]\s*\[(\d+\.\d+)\]/gi;
    let match;
    while ((match = pattern1.exec(text)) !== null) {
      const statusEmoji = match[1];
      const sprintId = parseInt(match[2]);
      const taskId = match[3];

      if (this.updateTaskStatus(roadmap, sprintId, taskId, statusEmoji)) {
        updatedCount++;
      }
    }

    // Pattern 2: ✅ [SPRINT 1] [1/5] [1.1] Task completed
    const pattern2 = /([✅⏳☐□])\s*\[SPRINT\s+(\d+)\]\s*\[\d+\/\d+\]\s*\[(\d+\.\d+)\]/gi;
    while ((match = pattern2.exec(text)) !== null) {
      const statusEmoji = match[1];
      const sprintId = parseInt(match[2]);
      const taskId = match[3];

      if (this.updateTaskStatus(roadmap, sprintId, taskId, statusEmoji)) {
        updatedCount++;
      }
    }

    // Pattern 3: Look for task IDs near "completed" or "✓" keywords
    // Example: "Task 1.1 completed successfully"
    const pattern3 = /(\d+\.\d+)\s+(completed|done|finished|✓)/gi;
    while ((match = pattern3.exec(text)) !== null) {
      const taskId = match[1];

      // Find which sprint this task belongs to
      for (const sprint of roadmap.sprints) {
        for (const task of sprint.tasks) {
          if (task.id === taskId && task.status !== 'completed') {
            task.status = 'completed';
            task.completedAt = new Date();
            updatedCount++;
            console.log(`  [Parser] Task ${taskId} marked as completed (pattern 3)`);
          }
        }
      }
    }

    // Pattern 4: Tool execution patterns (write, edit) followed by task context
    // If we see "Writing to index.html" and current task is about creating index.html
    const writePattern = /Writing to ([^\s]+\.(html|css|js|ts|tsx|json|md|py|java))/gi;
    const createdFiles = new Set<string>();
    while ((match = writePattern.exec(text)) !== null) {
      createdFiles.add(match[1].toLowerCase());
    }

    // Check if created files match pending task descriptions
    if (createdFiles.size > 0) {
      for (const sprint of roadmap.sprints) {
        for (const task of sprint.tasks) {
          if (task.status === 'pending' || task.status === 'in-progress') {
            const taskDesc = task.description.toLowerCase();

            // Check if any created file is mentioned in this task
            for (const file of createdFiles) {
              if (taskDesc.includes(file) || taskDesc.includes(file.split('/').pop() || '')) {
                task.status = 'completed';
                task.completedAt = new Date();
                updatedCount++;
                console.log(`  [Parser] Task ${task.id} auto-completed (file ${file} created)`);
                break;
              }
            }
          }
        }
      }
    }

    if (updatedCount > 0) {
      console.log(`  [Parser] Updated ${updatedCount} task status(es) from text`);
    }

    return roadmap;
  }

  /**
   * Helper to update a specific task status
   */
  private static updateTaskStatus(
    roadmap: Roadmap,
    sprintId: number,
    taskId: string,
    statusEmoji: string
  ): boolean {
    let status: 'pending' | 'in-progress' | 'completed';
    if (statusEmoji === '✅') {
      status = 'completed';
    } else if (statusEmoji === '⏳') {
      status = 'in-progress';
    } else {
      status = 'pending';
    }

    // Find and update the task
    for (const sprint of roadmap.sprints) {
      if (sprint.id === sprintId) {
        for (const task of sprint.tasks) {
          if (task.id === taskId) {
            const wasUpdated = task.status !== status;
            task.status = status;
            if (status === 'completed' && !task.completedAt) {
              task.completedAt = new Date();
            }
            if (status === 'in-progress' && !task.startedAt) {
              task.startedAt = new Date();
            }
            if (wasUpdated) {
              console.log(`  [Parser] Task ${taskId} status updated to ${status}`);
            }
            return wasUpdated;
          }
        }
      }
    }
    return false;
  }
}
