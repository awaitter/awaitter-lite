/**
 * Language detection and bilingual internal prompts.
 * Used by Agent, WorkerAgent and Orchestrator to keep all feedback
 * in the language the user is writing in.
 */
export type Lang = 'es' | 'en';
/**
 * Detect language from a text snippet.
 * Returns 'es' if Spanish indicators are found, 'en' otherwise.
 */
export declare function detectLanguage(text: string): Lang;
/**
 * All internal prompt strings used when injecting messages into the model context.
 * Keep these in sync whenever new injection points are added.
 */
export declare const PROMPTS: {
    refusalCorrectionWithContext: {
        en: (ctx: string) => string;
        es: (ctx: string) => string;
    };
    refusalCorrectionNoContext: {
        en: (dir: string) => string;
        es: (dir: string) => string;
    };
    repeatedToolCall: {
        en: string;
        es: string;
    };
    stopTalkingExecuteRoadmap: {
        en: (taskId: string, taskDesc: string) => string;
        es: (taskId: string, taskDesc: string) => string;
    };
    executeImmediately: {
        en: (originalRequest: string) => string;
        es: (originalRequest: string) => string;
    };
    pendingTodos: {
        en: (count: number, originalRequest: string) => string;
        es: (count: number, originalRequest: string) => string;
    };
    continueWithToolCalls: {
        en: string;
        es: string;
    };
    conversationalContinue: {
        en: string;
        es: string;
    };
    workerStopDescribing: {
        en: (taskDesc: string) => string;
        es: (taskDesc: string) => string;
    };
    workerSystemFooter: {
        en: string;
        es: string;
    };
    languageInstruction: {
        en: string;
        es: string;
    };
    orchestratorPlanRequest: {
        en: (req: string) => string;
        es: (req: string) => string;
    };
    workerInitialTask: {
        en: (taskDesc: string) => string;
        es: (taskDesc: string) => string;
    };
    qaExtractRecommendations: {
        en: (qaOutput: string) => string;
        es: (qaOutput: string) => string;
    };
    qaApprovalHeader: {
        en: (count: number) => string;
        es: (count: number) => string;
    };
    qaApprovalPrompt: {
        en: string;
        es: string;
    };
    qaApplyingRecommendation: {
        en: (i: number, total: number, rec: string) => string;
        es: (i: number, total: number, rec: string) => string;
    };
    qaNoChanges: {
        en: string;
        es: string;
    };
};
//# sourceMappingURL=LangStrings.d.ts.map