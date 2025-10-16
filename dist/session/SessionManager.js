"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os_1 = require("os");
class SessionManager {
    sessionsDir;
    autosaveEnabled;
    autosaveInterval; // Save every N messages
    constructor(autosaveEnabled = true, autosaveInterval = 5) {
        // Store sessions in user's home directory under .awaitter-lite
        const baseDir = path.join((0, os_1.homedir)(), '.awaitter-lite', 'sessions');
        this.sessionsDir = baseDir;
        this.autosaveEnabled = autosaveEnabled;
        this.autosaveInterval = autosaveInterval;
        // Create sessions directory if it doesn't exist
        if (!fs.existsSync(this.sessionsDir)) {
            fs.mkdirSync(this.sessionsDir, { recursive: true });
        }
    }
    /**
     * Save a session to disk
     */
    async saveSession(messages, model, workingDir, sessionId, roadmap, originalUserRequest) {
        const id = sessionId || this.generateSessionId();
        const filename = `${id}.json`;
        const filepath = path.join(this.sessionsDir, filename);
        const data = {
            id,
            timestamp: new Date().toISOString(),
            model,
            workingDir,
            messageCount: messages.length,
            lastActivity: new Date().toISOString(),
            messages,
            roadmap, // 📋 Save roadmap to restore sprint progress
            originalUserRequest // Save original request for context
        };
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        return id;
    }
    /**
     * Load a session from disk
     */
    async loadSession(sessionId) {
        const filename = `${sessionId}.json`;
        const filepath = path.join(this.sessionsDir, filename);
        if (!fs.existsSync(filepath)) {
            return null;
        }
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        return data;
    }
    /**
     * Get the most recent session
     */
    async getLastSession() {
        const sessions = await this.listSessions();
        if (sessions.length === 0) {
            return null;
        }
        // Sessions are already sorted by lastActivity (newest first)
        const lastSessionId = sessions[0].id;
        return this.loadSession(lastSessionId);
    }
    /**
     * List all sessions (sorted by most recent first)
     */
    async listSessions() {
        if (!fs.existsSync(this.sessionsDir)) {
            return [];
        }
        const files = fs.readdirSync(this.sessionsDir)
            .filter(f => f.endsWith('.json'));
        const sessions = files.map(file => {
            const filepath = path.join(this.sessionsDir, file);
            const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            return {
                id: data.id,
                timestamp: data.timestamp,
                model: data.model,
                workingDir: data.workingDir,
                messageCount: data.messageCount,
                lastActivity: data.lastActivity
            };
        });
        // Sort by last activity (newest first)
        sessions.sort((a, b) => {
            return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
        });
        return sessions;
    }
    /**
     * Delete a session
     */
    async deleteSession(sessionId) {
        const filename = `${sessionId}.json`;
        const filepath = path.join(this.sessionsDir, filename);
        if (!fs.existsSync(filepath)) {
            return false;
        }
        fs.unlinkSync(filepath);
        return true;
    }
    /**
     * Clear all sessions
     */
    async clearAllSessions() {
        if (!fs.existsSync(this.sessionsDir)) {
            return 0;
        }
        const files = fs.readdirSync(this.sessionsDir)
            .filter(f => f.endsWith('.json'));
        files.forEach(file => {
            fs.unlinkSync(path.join(this.sessionsDir, file));
        });
        return files.length;
    }
    /**
     * Check if auto-save should happen based on message count
     */
    shouldAutosave(messageCount) {
        if (!this.autosaveEnabled) {
            return false;
        }
        // Save every N messages (skip system messages)
        return messageCount > 0 && messageCount % this.autosaveInterval === 0;
    }
    /**
     * Generate a unique session ID
     */
    generateSessionId() {
        const timestamp = new Date().toISOString()
            .replace(/[:.]/g, '-')
            .replace('T', '_')
            .substring(0, 19); // YYYY-MM-DD_HH-MM-SS
        return `session_${timestamp}`;
    }
    /**
     * Get sessions directory path
     */
    getSessionsDir() {
        return this.sessionsDir;
    }
    /**
     * Export session to a specific location
     */
    async exportSession(sessionId, exportPath) {
        const session = await this.loadSession(sessionId);
        if (!session) {
            return false;
        }
        fs.writeFileSync(exportPath, JSON.stringify(session, null, 2));
        return true;
    }
    /**
     * Import session from a file
     */
    async importSession(importPath) {
        if (!fs.existsSync(importPath)) {
            return null;
        }
        const data = JSON.parse(fs.readFileSync(importPath, 'utf-8'));
        // Generate new ID if not present
        const sessionId = data.id || this.generateSessionId();
        await this.saveSession(data.messages, data.model, data.workingDir, sessionId);
        return sessionId;
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map