export type AgentRoleType = 'orchestrator' | 'architect' | 'backend' | 'frontend' | 'qa';
export type MessageType = 'task_assignment' | 'task_result' | 'question' | 'answer' | 'status' | 'thinking' | 'tool_use' | 'error' | 'complete';
export interface AgentMessage {
    id: string;
    fromAgent: AgentRoleType;
    toAgent: AgentRoleType | 'all';
    type: MessageType;
    content: string;
    timestamp: Date;
}
export interface AgentTask {
    id: string;
    assignedTo: AgentRoleType;
    description: string;
    context?: string;
    dependencies?: string[];
    status: 'pending' | 'in_progress' | 'completed' | 'failed';
    result?: string;
}
export interface MultiAgentSession {
    id: string;
    userRequest: string;
    workingDir: string;
    tasks: AgentTask[];
    messages: AgentMessage[];
    status: 'planning' | 'executing' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
}
export interface AgentRoleConfig {
    role: AgentRoleType;
    name: string;
    emoji: string;
    color: string;
    description: string;
    systemPrompt: string;
}
//# sourceMappingURL=types.d.ts.map