/**
 * RoadmapPlanner - Generates structured roadmaps for complex tasks
 */

import { Roadmap, Sprint, Task, ProjectType, RoadmapProgress } from './types';

export class RoadmapPlanner {
  /**
   * Detect if a user request requires a roadmap (complex multi-step task)
   */
  static requiresRoadmap(userRequest: string): boolean {
    const requestLower = userRequest.toLowerCase();

    // Keywords that indicate complex tasks
    const complexKeywords = [
      // Creation
      'create app', 'create application', 'build app', 'build application',
      'crea app', 'crea aplicación', 'crear app', 'crear aplicación',
      'develop app', 'new project', 'nuevo proyecto',

      // Full-stack
      'full-stack', 'fullstack', 'frontend and backend', 'front y back',
      'web app', 'web application', 'aplicación web',

      // Major refactors
      'refactor entire', 'refactor all', 'refactorizar todo',
      'restructure', 'reorganize', 'reestructurar',

      // Analysis of large codebases
      'analyze entire', 'analyze all', 'analizar todo',
      'review codebase', 'code review', 'revisar código',

      // Multiple features
      'implement multiple', 'add multiple', 'agregar múltiples',
    ];

    // Check for complex indicators
    const hasComplexKeyword = complexKeywords.some(keyword => requestLower.includes(keyword));

    // Check for multiple requirements (using "and", "y", commas)
    const hasMultipleRequirements = (
      (requestLower.match(/\band\b/g) || []).length >= 2 ||
      (requestLower.match(/\by\b/g) || []).length >= 2 ||
      (requestLower.match(/,/g) || []).length >= 2
    );

    return hasComplexKeyword || hasMultipleRequirements;
  }

  /**
   * Detect project type from user request
   */
  static detectProjectType(userRequest: string): ProjectType {
    const requestLower = userRequest.toLowerCase();

    if (requestLower.includes('web app') || requestLower.includes('aplicación web') ||
        requestLower.includes('full-stack') || requestLower.includes('frontend') ||
        requestLower.includes('backend')) {
      return 'web-app';
    }

    if (requestLower.includes('api') || requestLower.includes('rest') ||
        requestLower.includes('graphql') || requestLower.includes('endpoint')) {
      return 'api';
    }

    if (requestLower.includes('cli') || requestLower.includes('command line') ||
        requestLower.includes('terminal')) {
      return 'cli';
    }

    if (requestLower.includes('library') || requestLower.includes('package') ||
        requestLower.includes('npm') || requestLower.includes('pip')) {
      return 'library';
    }

    if (requestLower.includes('refactor') || requestLower.includes('refactorizar') ||
        requestLower.includes('improve') || requestLower.includes('clean')) {
      return 'refactor';
    }

    if (requestLower.includes('analyze') || requestLower.includes('analizar') ||
        requestLower.includes('review') || requestLower.includes('audit')) {
      return 'analysis';
    }

    if (requestLower.includes('fix') || requestLower.includes('bug') ||
        requestLower.includes('error') || requestLower.includes('arreglar')) {
      return 'bug-fix';
    }

    return 'feature';
  }

  /**
   * Extract project name from user request
   */
  static extractProjectName(userRequest: string): string {
    // Try to extract after "create", "build", "crea", etc.
    const patterns = [
      /create (?:a |an )?([^.]+?)(?:\s+app|\s+application)?$/i,
      /build (?:a |an )?([^.]+?)(?:\s+app|\s+application)?$/i,
      /crea(?:r)? (?:una? )?([^.]+?)(?:\s+app|\s+aplicación)?$/i,
      /develop (?:a |an )?([^.]+?)(?:\s+app|\s+application)?$/i,
    ];

    for (const pattern of patterns) {
      const match = userRequest.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    // Fallback: use first few words
    const words = userRequest.split(' ').slice(0, 4).join(' ');
    return words.length > 50 ? words.substring(0, 47) + '...' : words;
  }

  /**
   * Calculate progress statistics for a roadmap
   */
  static calculateProgress(roadmap: Roadmap): RoadmapProgress {
    let completedTasks = 0;
    let totalTasks = roadmap.totalTasks;
    let completedSprints = 0;
    let elapsedMinutes = 0;

    for (const sprint of roadmap.sprints) {
      const sprintCompleted = sprint.tasks.every(t => t.status === 'completed' || t.status === 'skipped');
      if (sprintCompleted) {
        completedSprints++;
      }

      for (const task of sprint.tasks) {
        if (task.status === 'completed' || task.status === 'skipped') {
          completedTasks++;
        }

        if (task.startedAt && task.completedAt) {
          elapsedMinutes += (task.completedAt.getTime() - task.startedAt.getTime()) / 60000;
        }
      }
    }

    const percentComplete = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const estimatedRemainingMinutes = roadmap.totalEstimatedMinutes - elapsedMinutes;

    return {
      completedTasks,
      totalTasks,
      completedSprints,
      totalSprints: roadmap.sprints.length,
      percentComplete: Math.round(percentComplete),
      elapsedMinutes: Math.round(elapsedMinutes),
      estimatedRemainingMinutes: Math.max(0, Math.round(estimatedRemainingMinutes))
    };
  }

  /**
   * Get the current active task in the roadmap
   */
  static getCurrentTask(roadmap: Roadmap): Task | undefined {
    for (const sprint of roadmap.sprints) {
      for (const task of sprint.tasks) {
        if (task.status === 'in-progress') {
          return task;
        }
      }
    }

    // If no in-progress task, return first pending task
    for (const sprint of roadmap.sprints) {
      for (const task of sprint.tasks) {
        if (task.status === 'pending') {
          return task;
        }
      }
    }

    return undefined;
  }

  /**
   * Get the next task to execute
   */
  static getNextTask(roadmap: Roadmap): Task | undefined {
    for (const sprint of roadmap.sprints) {
      for (const task of sprint.tasks) {
        if (task.status === 'pending') {
          return task;
        }
      }
    }
    return undefined;
  }

  /**
   * Get the current sprint
   */
  static getCurrentSprint(roadmap: Roadmap): Sprint | undefined {
    const currentTask = this.getCurrentTask(roadmap);
    if (!currentTask) return undefined;

    return roadmap.sprints.find(s => s.id === currentTask.sprintId);
  }

  /**
   * Mark task as started
   */
  static startTask(roadmap: Roadmap, taskId: string): void {
    for (const sprint of roadmap.sprints) {
      const task = sprint.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'in-progress';
        task.startedAt = new Date();

        // Also mark sprint as in-progress if not already
        if (sprint.status === 'pending') {
          sprint.status = 'in-progress';
          sprint.startedAt = new Date();
        }

        roadmap.currentSprintId = sprint.id;
        roadmap.currentTaskId = taskId;
        break;
      }
    }
  }

  /**
   * Mark task as completed
   */
  static completeTask(roadmap: Roadmap, taskId: string, filesCreated?: string[], filesModified?: string[]): void {
    for (const sprint of roadmap.sprints) {
      const task = sprint.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'completed';
        task.completedAt = new Date();
        if (filesCreated) task.filesCreated = filesCreated;
        if (filesModified) task.filesModified = filesModified;

        // Check if sprint is completed
        const allTasksComplete = sprint.tasks.every(t =>
          t.status === 'completed' || t.status === 'skipped'
        );

        if (allTasksComplete) {
          sprint.status = 'completed';
          sprint.completedAt = new Date();
        }

        // Check if entire roadmap is completed
        const allSprintsComplete = roadmap.sprints.every(s =>
          s.status === 'completed'
        );

        if (allSprintsComplete) {
          roadmap.status = 'completed';
        }

        break;
      }
    }
  }

  /**
   * Mark task as failed
   */
  static failTask(roadmap: Roadmap, taskId: string, error: string): void {
    for (const sprint of roadmap.sprints) {
      const task = sprint.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'failed';
        task.errors = task.errors || [];
        task.errors.push(error);
        break;
      }
    }
  }

  /**
   * Skip a task
   */
  static skipTask(roadmap: Roadmap, taskId: string, reason?: string): void {
    for (const sprint of roadmap.sprints) {
      const task = sprint.tasks.find(t => t.id === taskId);
      if (task) {
        task.status = 'skipped';
        if (reason) task.notes = reason;
        break;
      }
    }
  }
}
