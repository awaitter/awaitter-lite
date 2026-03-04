import { AgentMessage, AgentRoleType } from './types';
export declare class LiveConsoleRenderer {
    private dividerWidth;
    printHeader(userRequest: string): void;
    printMessage(message: AgentMessage): void;
    printToolUse(agent: AgentRoleType, toolName: string, args: Record<string, any>): void;
    printToolResult(agent: AgentRoleType, toolName: string, result: string): void;
    printAgentStart(agent: AgentRoleType, task: string): void;
    printAgentComplete(agent: AgentRoleType): void;
    printPlan(plan: Array<{
        role: AgentRoleType;
        task: string;
    }>): void;
    printSummary(completedTasks: number, totalTasks: number, duration: number): void;
    printError(agent: AgentRoleType, error: string): void;
    printStatus(text: string): void;
}
//# sourceMappingURL=LiveConsoleRenderer.d.ts.map