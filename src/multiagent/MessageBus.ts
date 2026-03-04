import { AgentMessage, AgentRoleType, MessageType } from './types';
import { EventEmitter } from 'events';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

type MessageHandler = (message: AgentMessage) => void;

export class MessageBus extends EventEmitter {
  private messages: AgentMessage[] = [];
  private handlers: Map<string, MessageHandler[]> = new Map();

  publish(
    fromAgent: AgentRoleType,
    toAgent: AgentRoleType | 'all',
    type: MessageType,
    content: string
  ): AgentMessage {
    const message: AgentMessage = {
      id: generateId(),
      fromAgent,
      toAgent,
      type,
      content,
      timestamp: new Date()
    };

    this.messages.push(message);
    this.emit('message', message);

    // Notify specific handlers
    const key = `${toAgent}`;
    const targetHandlers = this.handlers.get(key) || [];
    targetHandlers.forEach(h => h(message));

    // Also notify 'all' handlers
    const allHandlers = this.handlers.get('all') || [];
    allHandlers.forEach(h => h(message));

    return message;
  }

  subscribe(agent: AgentRoleType | 'all', handler: MessageHandler): void {
    const key = String(agent);
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);
  }

  getMessages(filter?: { fromAgent?: AgentRoleType; toAgent?: AgentRoleType | 'all'; type?: MessageType }): AgentMessage[] {
    if (!filter) return [...this.messages];

    return this.messages.filter(m => {
      if (filter.fromAgent && m.fromAgent !== filter.fromAgent) return false;
      if (filter.toAgent && m.toAgent !== filter.toAgent && m.toAgent !== 'all') return false;
      if (filter.type && m.type !== filter.type) return false;
      return true;
    });
  }

  getConversation(): AgentMessage[] {
    return [...this.messages];
  }

  clear(): void {
    this.messages = [];
    this.handlers.clear();
  }
}
