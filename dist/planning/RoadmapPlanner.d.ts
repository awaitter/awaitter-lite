/**
 * RoadmapPlanner - Generates structured roadmaps for complex tasks
 */
import { Roadmap, Sprint, Task, ProjectType, RoadmapProgress } from './types';
export declare class RoadmapPlanner {
    /**
     * Detect if a user request requires a roadmap (complex multi-step task)
     */
    static requiresRoadmap(userRequest: string): boolean;
    /**
     * Detect project type from user request
     */
    static detectProjectType(userRequest: string): ProjectType;
    /**
     * Extract project name from user request
     */
    static extractProjectName(userRequest: string): string;
    /**
     * Calculate progress statistics for a roadmap
     */
    static calculateProgress(roadmap: Roadmap): RoadmapProgress;
    /**
     * Get the current active task in the roadmap
     */
    static getCurrentTask(roadmap: Roadmap): Task | undefined;
    /**
     * Get the next task to execute
     */
    static getNextTask(roadmap: Roadmap): Task | undefined;
    /**
     * Get the current sprint
     */
    static getCurrentSprint(roadmap: Roadmap): Sprint | undefined;
    /**
     * Mark task as started
     */
    static startTask(roadmap: Roadmap, taskId: string): void;
    /**
     * Mark task as completed
     */
    static completeTask(roadmap: Roadmap, taskId: string, filesCreated?: string[], filesModified?: string[]): void;
    /**
     * Mark task as failed
     */
    static failTask(roadmap: Roadmap, taskId: string, error: string): void;
    /**
     * Skip a task
     */
    static skipTask(roadmap: Roadmap, taskId: string, reason?: string): void;
}
//# sourceMappingURL=RoadmapPlanner.d.ts.map