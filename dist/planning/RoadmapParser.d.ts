import { Roadmap } from './types';
/**
 * Parse a roadmap from model's text response
 */
export declare class RoadmapParser {
    /**
     * Detect if the text contains a roadmap
     */
    static hasRoadmap(text: string): boolean;
    /**
     * Parse roadmap from text
     */
    static parseRoadmap(text: string, originalRequest: string): Roadmap | null;
    /**
     * Parse sprints from text
     */
    private static parseSprints;
    /**
     * Parse tasks from sprint text
     */
    private static parseTasks;
    /**
     * Detect project type from text
     */
    private static detectProjectType;
    /**
     * Update existing roadmap with new status from text
     * Detects multiple patterns of task completion/progress
     */
    static updateRoadmapFromText(roadmap: Roadmap, text: string): Roadmap;
    /**
     * Helper to update a specific task status
     */
    private static updateTaskStatus;
}
//# sourceMappingURL=RoadmapParser.d.ts.map