"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageBus = void 0;
const events_1 = require("events");
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
class MessageBus extends events_1.EventEmitter {
    messages = [];
    handlers = new Map();
    publish(fromAgent, toAgent, type, content) {
        const message = {
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
    subscribe(agent, handler) {
        const key = String(agent);
        if (!this.handlers.has(key)) {
            this.handlers.set(key, []);
        }
        this.handlers.get(key).push(handler);
    }
    getMessages(filter) {
        if (!filter)
            return [...this.messages];
        return this.messages.filter(m => {
            if (filter.fromAgent && m.fromAgent !== filter.fromAgent)
                return false;
            if (filter.toAgent && m.toAgent !== filter.toAgent && m.toAgent !== 'all')
                return false;
            if (filter.type && m.type !== filter.type)
                return false;
            return true;
        });
    }
    getConversation() {
        return [...this.messages];
    }
    clear() {
        this.messages = [];
        this.handlers.clear();
    }
}
exports.MessageBus = MessageBus;
//# sourceMappingURL=MessageBus.js.map