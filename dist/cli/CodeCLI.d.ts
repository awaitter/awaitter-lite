import { Config } from '../config/Config';
export declare class CodeCLI {
    private config;
    private modelName;
    private workingDir;
    private agent;
    private modelManager;
    private rl;
    private rlPausedByUs;
    private closeHandler;
    private ignoreNextClose;
    private ignoreNextLine;
    private commandInProgress;
    private isShuttingDown;
    private lineHandler;
    /**
     * Detect if a user request is complex enough to warrant multi-agent mode.
     * Triggers on project/app/system creation tasks that benefit from specialized agents.
     * Simple tasks (fix a bug, add a function, explain code) stay in single-agent mode.
     */
    private isComplexTask;
    constructor(config: Config, modelName: string, workingDir: string);
    initialize(): Promise<void>;
    start(): Promise<void>;
    private showPrompt;
    private clearStatusLine;
    private pauseReadlineForInquirer;
    private resumeReadlineAfterInquirer;
    private printWelcome;
    private handleCommand;
    private runMultiAgent;
    private showHelp;
    private listModels;
    private getSpeedIcon;
    private getQualityBadge;
    private switchToModelInteractive;
    private switchModel;
    private showContext;
    private showTools;
    private showHardware;
    private getStatusIcon;
    private getPerformanceDisplay;
    private setApiKey;
    private runSetupWizard;
    private getModelRecommendations;
    private listSessions;
    private loadSessionCommand;
    private clearSessions;
    private undoOperations;
    private listSnapshots;
    private showCurrentMode;
    private setMode;
    private showRoadmap;
}
//# sourceMappingURL=CodeCLI.d.ts.map