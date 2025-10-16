import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

interface SessionData {
  id: string;
  timestamp: string;
  model: string;
  workingDir: string;
  messageCount: number;
  lastActivity: string;
  messages: any[];
  roadmap?: any; // 📋 Store active roadmap to preserve sprint progress
  originalUserRequest?: string; // Store original request for context
}

export class SessionManager {
  private sessionsDir: string;
  private autosaveEnabled: boolean;
  private autosaveInterval: number; // Save every N messages

  constructor(autosaveEnabled: boolean = true, autosaveInterval: number = 5) {
    // Store sessions in user's home directory under .awaitter-lite
    const baseDir = path.join(homedir(), '.awaitter-lite', 'sessions');
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
  async saveSession(
    messages: any[],
    model: string,
    workingDir: string,
    sessionId?: string,
    roadmap?: any,
    originalUserRequest?: string
  ): Promise<string> {
    const id = sessionId || this.generateSessionId();
    const filename = `${id}.json`;
    const filepath = path.join(this.sessionsDir, filename);

    const data: SessionData = {
      id,
      timestamp: new Date().toISOString(),
      model,
      workingDir,
      messageCount: messages.length,
      lastActivity: new Date().toISOString(),
      messages,
      roadmap,  // 📋 Save roadmap to restore sprint progress
      originalUserRequest  // Save original request for context
    };

    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

    return id;
  }

  /**
   * Load a session from disk
   */
  async loadSession(sessionId: string): Promise<SessionData | null> {
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
  async getLastSession(): Promise<SessionData | null> {
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
  async listSessions(): Promise<Array<{
    id: string;
    timestamp: string;
    model: string;
    workingDir: string;
    messageCount: number;
    lastActivity: string;
  }>> {
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
  async deleteSession(sessionId: string): Promise<boolean> {
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
  async clearAllSessions(): Promise<number> {
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
  shouldAutosave(messageCount: number): boolean {
    if (!this.autosaveEnabled) {
      return false;
    }

    // Save every N messages (skip system messages)
    return messageCount > 0 && messageCount % this.autosaveInterval === 0;
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .substring(0, 19); // YYYY-MM-DD_HH-MM-SS

    return `session_${timestamp}`;
  }

  /**
   * Get sessions directory path
   */
  getSessionsDir(): string {
    return this.sessionsDir;
  }

  /**
   * Export session to a specific location
   */
  async exportSession(sessionId: string, exportPath: string): Promise<boolean> {
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
  async importSession(importPath: string): Promise<string | null> {
    if (!fs.existsSync(importPath)) {
      return null;
    }

    const data = JSON.parse(fs.readFileSync(importPath, 'utf-8'));

    // Generate new ID if not present
    const sessionId = data.id || this.generateSessionId();

    await this.saveSession(
      data.messages,
      data.model,
      data.workingDir,
      sessionId
    );

    return sessionId;
  }
}
