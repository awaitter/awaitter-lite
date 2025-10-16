import Conf from 'conf';
import * as fs from 'fs';
import * as path from 'path';
import { homedir } from 'os';

export interface ModelConfig {
  type: 'local' | 'openai' | 'anthropic' | 'google' | 'xai' | 'groq' | 'deepseek';
  url?: string;
  apiKey?: string;
  model?: string;
  name?: string;
  maxTokens?: number;
}

export interface ConfigData {
  defaultModel: string;
  models: Record<string, ModelConfig>;
  tools: Record<string, boolean>;
  ui: {
    streaming: boolean;
    showToolCalls: boolean;
    theme: string;
  };
  safety: {
    confirmBash: boolean;
    confirmWrite: boolean;
    confirmEdit: boolean;
  };
  agent: {
    maxIterations: number;
    thinkingMode: boolean;
    executionMode: 'unstoppable' | 'sprint' | 'step-by-step';
    showRoadmap: boolean;
    autoApproveSimpleTasks: boolean;
  };
}

export class Config {
  private conf: Conf<ConfigData>;
  private configPath?: string;

  constructor(configPath?: string) {
    this.configPath = configPath;

    this.conf = new Conf<ConfigData>({
      projectName: 'awaitter-lite',
      defaults: this.getDefaults(),
    });
  }

  private getDefaults(): ConfigData {
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
        maxIterations: 50,  // Increased for complex multi-step tasks
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

  get<K extends keyof ConfigData>(key: K, defaultValue?: ConfigData[K]): ConfigData[K] {
    return this.conf.get(key, defaultValue as any);
  }

  set<K extends keyof ConfigData>(key: K, value: ConfigData[K]) {
    this.conf.set(key, value);
  }

  getAll(): ConfigData {
    return this.conf.store;
  }

  getConfigPath(): string {
    return this.conf.path;
  }
}
