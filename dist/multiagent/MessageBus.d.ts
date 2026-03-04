import { AgentMessage, AgentRoleType, MessageType } from './types';
import { EventEmitter } from 'events';
type MessageHandler = (message: AgentMessage) => void;
export declare class MessageBus extends EventEmitter {
    private messages;
    private handlers;
    publish(fromAgent: AgentRoleType, toAgent: AgentRoleType | 'all', type: MessageType, content: string): AgentMessage;
    subscribe(agent: AgentRoleType | 'all', handler: MessageHandler): void;
    getMessages(filter?: {
        fromAgent?: AgentRoleType;
        toAgent?: AgentRoleType | 'all';
        type?: MessageType;
    }): AgentMessage[];
    getConversation(): AgentMessage[];
    clear(): void;
}
export {};
//# sourceMappingURL=MessageBus.d.ts.map