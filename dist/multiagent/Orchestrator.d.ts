import { Config } from '../config/Config';
import { MessageBus } from './MessageBus';
import { Lang } from '../utils/LangStrings';
export declare class Orchestrator {
    private config;
    private workingDir;
    private bus;
    private renderer;
    private orchestratorModel;
    private lang;
    constructor(config: Config, workingDir: string);
    run(userRequest: string, modelName: string, lang?: Lang): Promise<void>;
    private createPlan;
    private parsePlan;
    private buildSharedContext;
    private finalReview;
    /**
     * After QA finishes, extract its actionable recommendations, present them
     * to the user as a numbered list, and execute only the approved ones.
     */
    private applyQARecommendations;
    /**
     * Prompt the user to pick recommendation indices.
     * Accepts: "1,2", "all", "todos", "none", or empty → none.
     */
    private askUserSelection;
    getBus(): MessageBus;
}
//# sourceMappingURL=Orchestrator.d.ts.map