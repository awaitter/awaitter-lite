import { Config } from '../config/Config';
import { ModelManager } from '../models/ModelManager';
import { AgentRoleType, AgentTask } from './types';
import { MessageBus } from './MessageBus';
import { LiveConsoleRenderer } from './LiveConsoleRenderer';
import { Lang } from '../utils/LangStrings';
export declare class WorkerAgent {
    private role;
    private config;
    private modelManager;
    private workingDir;
    private bus;
    private lang;
    private messages;
    private toolManager;
    private renderer;
    constructor(role: AgentRoleType, config: Config, modelManager: ModelManager, workingDir: string, bus: MessageBus, renderer: LiveConsoleRenderer, lang?: Lang);
    /**
     * Detect if this task is purely analytical — read-only, no file creation/deletion.
     * Analysis tasks must never modify or delete files.
     */
    private isAnalysisTask;
    execute(task: AgentTask, sharedContext: string): Promise<string>;
    private lastContents;
    private consecutiveToolErrors;
    private consecutiveDescriptions;
    private isLooping;
    private shouldForceContinue;
    private executeTools;
}
//# sourceMappingURL=WorkerAgent.d.ts.map