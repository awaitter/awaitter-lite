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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const conf_1 = __importDefault(require("conf"));
const fs = __importStar(require("fs"));
class Config {
    conf;
    configPath;
    constructor(configPath) {
        this.configPath = configPath;
        this.conf = new conf_1.default({
            projectName: 'awaitter-lite',
            defaults: this.getDefaults(),
        });
    }
    getDefaults() {
        return {
            defaultModel: 'local',
            models: {
                // Local models (unlimited use with Ollama)
                local: {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'qwen2.5-coder:1.5b',
                    maxTokens: 4096,
                },
                'qwen-1.5b': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'qwen2.5-coder:1.5b',
                    maxTokens: 4096,
                },
                'qwen-7b': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'qwen2.5-coder:7b',
                    maxTokens: 8192,
                },
                'qwen-14b': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'qwen2.5-coder:14b',
                    maxTokens: 8192,
                },
                'qwen-32b': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'qwen2.5-coder:32b',
                    maxTokens: 16384,
                },
                'deepseek': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'deepseek-coder-v2:16b',
                    maxTokens: 16384,
                },
                'codestral': {
                    type: 'local',
                    url: process.env.LOCAL_LLM_URL || 'http://localhost:11434',
                    model: 'codestral:22b',
                    maxTokens: 32768,
                },
                // OpenAI models
                gpt4: {
                    type: 'openai',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-4-turbo',
                    maxTokens: 4096,
                },
                'gpt4-turbo': {
                    type: 'openai',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-4-turbo-2024-04-09',
                    maxTokens: 4096,
                },
                'gpt35': {
                    type: 'openai',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'gpt-3.5-turbo',
                    maxTokens: 4096,
                },
                'o1': {
                    type: 'openai',
                    apiKey: process.env.OPENAI_API_KEY || '',
                    model: 'o1-preview',
                    maxTokens: 8192,
                },
                // Anthropic models
                claude: {
                    type: 'anthropic',
                    apiKey: process.env.ANTHROPIC_API_KEY || '',
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 8192,
                },
                'claude-opus': {
                    type: 'anthropic',
                    apiKey: process.env.ANTHROPIC_API_KEY || '',
                    model: 'claude-3-opus-20240229',
                    maxTokens: 4096,
                },
                'claude-sonnet': {
                    type: 'anthropic',
                    apiKey: process.env.ANTHROPIC_API_KEY || '',
                    model: 'claude-3-5-sonnet-20241022',
                    maxTokens: 8192,
                },
                // Google models
                gemini: {
                    type: 'google',
                    apiKey: process.env.GOOGLE_API_KEY || '',
                    model: 'gemini-2.0-flash-exp',
                    maxTokens: 8192,
                },
                'gemini-flash': {
                    type: 'google',
                    apiKey: process.env.GOOGLE_API_KEY || '',
                    model: 'gemini-2.0-flash-exp',
                    maxTokens: 8192,
                },
                'gemini-pro': {
                    type: 'google',
                    apiKey: process.env.GOOGLE_API_KEY || '',
                    model: 'gemini-1.5-pro',
                    maxTokens: 8192,
                },
                // xAI (Grok)
                grok: {
                    type: 'xai',
                    apiKey: process.env.XAI_API_KEY || '',
                    model: 'grok-beta',
                    maxTokens: 8192,
                },
                'grok-2': {
                    type: 'xai',
                    apiKey: process.env.XAI_API_KEY || '',
                    model: 'grok-2-latest',
                    maxTokens: 8192,
                },
                // Groq (GRATIS y ULTRA RÁPIDO)
                'groq': {
                    type: 'groq',
                    apiKey: process.env.GROQ_API_KEY || '',
                    model: 'llama-3.3-70b-versatile',
                    maxTokens: 8192,
                },
                'groq-llama': {
                    type: 'groq',
                    apiKey: process.env.GROQ_API_KEY || '',
                    model: 'llama-3.3-70b-versatile',
                    maxTokens: 8192,
                },
                'groq-qwen': {
                    type: 'groq',
                    apiKey: process.env.GROQ_API_KEY || '',
                    model: 'qwen/qwen3-32b',
                    maxTokens: 8192,
                },
                'groq-fast': {
                    type: 'groq',
                    apiKey: process.env.GROQ_API_KEY || '',
                    model: 'llama-3.1-8b-instant',
                    maxTokens: 8192,
                },
                // DeepSeek (MUY BARATO - $0.14 por 1M tokens)
                'deepseek-api': {
                    type: 'deepseek',
                    apiKey: process.env.DEEPSEEK_API_KEY || '',
                    model: 'deepseek-coder',
                    maxTokens: 16384,
                },
                'deepseek-chat': {
                    type: 'deepseek',
                    apiKey: process.env.DEEPSEEK_API_KEY || '',
                    model: 'deepseek-chat',
                    maxTokens: 16384,
                },
            },
            tools: {
                read: true,
                write: true,
                edit: true,
                bash: true,
                glob: true,
                grep: true,
                git_status: true,
                git_diff: true,
                git_commit: true,
                git_branch: true,
                git_log: true,
            },
            ui: {
                streaming: true,
                showToolCalls: true,
                theme: 'dark',
            },
            safety: {
                confirmBash: true,
                confirmWrite: false,
                confirmEdit: false,
            },
            agent: {
                maxIterations: 50, // Increased for complex multi-step tasks
                thinkingMode: true,
                executionMode: 'sprint', // Default: sprint-by-sprint (balanced)
                showRoadmap: true, // Always show roadmaps for complex tasks
                autoApproveSimpleTasks: true, // Simple tasks don't need roadmaps
            },
        };
    }
    async load() {
        // Load from custom path if provided
        if (this.configPath && fs.existsSync(this.configPath)) {
            const data = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
            this.conf.set(data);
        }
        // Replace env variables in API keys
        const models = this.conf.get('models');
        for (const [name, config] of Object.entries(models)) {
            if (config.apiKey && config.apiKey.startsWith('$')) {
                const envVar = config.apiKey.slice(1);
                config.apiKey = process.env[envVar] || '';
            }
        }
    }
    get(key, defaultValue) {
        return this.conf.get(key, defaultValue);
    }
    set(key, value) {
        this.conf.set(key, value);
    }
    getAll() {
        return this.conf.store;
    }
    getConfigPath() {
        return this.conf.path;
    }
}
exports.Config = Config;
//# sourceMappingURL=Config.js.map