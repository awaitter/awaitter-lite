/**
 * Type definitions for the Roadmap planning system
 */
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'skipped' | 'failed';
export type ExecutionMode = 'unstoppable' | 'sprint' | 'step-by-step';
export type ProjectType = 'web-app' | 'api' | 'cli' | 'library' | 'refactor' | 'analysis' | 'bug-fix' | 'feature';
export interface Task {
    id: string;
    sprintId: number;
    description: string;
    status: TaskStatus;
    estimatedMinutes?: number;
    startedAt?: Date;
    completedAt?: Date;
    filesCreated?: string[];
    filesModified?: string[];
    errors?: string[];
    notes?: string;
}
export interface Sprint {
    id: number;
    name: string;
    description: string;
    emoji: string;
    estimatedMinutes: number;
    tasks: Task[];
    status: TaskStatus;
    startedAt?: Date;
    completedAt?: Date;
}
export interface Roadmap {
    id: string;
    projectName: string;
    projectType: ProjectType;
    originalRequest: string;
    sprints: Sprint[];
    totalTasks: number;
    totalEstimatedMinutes: number;
    createdAt: Date;
    status: 'planning' | 'in-progress' | 'completed' | 'paused' | 'cancelled';
    currentSprintId?: number;
    currentTaskId?: string;
}
export interface RoadmapProgress {
    completedTasks: number;
    totalTasks: number;
    completedSprints: number;
    totalSprints: number;
    percentComplete: number;
    elapsedMinutes: number;
    estimatedRemainingMinutes: number;
}
export interface RoadmapSummary {
    roadmap: Roadmap;
    progress: RoadmapProgress;
    filesCreated: string[];
    filesModified: string[];
    errors: string[];
}
//# sourceMappingURL=types.d.ts.map