/**
 * Model-Specific Optimizations
 * Fine-tuned parameters for each model to maximize code generation quality
 */

export interface ModelConfig {
  temperature: number;
  maxTokens: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
  reasoning?: {
    enabled: boolean;
    budget?: number;
  };
}

export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  // ============ OPENAI MODELS ============

  // GPT-4: Best for complex reasoning and architectural decisions
  'gpt4': {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: []
  },

  'gpt4-turbo': {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // GPT-3.5: Faster, good for simple tasks
  'gpt35': {
    temperature: 0.2,
    maxTokens: 4000,
    topP: 0.9,
    frequencyPenalty: 0.2,
    presencePenalty: 0.1
  },

  // O1: Advanced reasoning model
  'o1': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.05,
    presencePenalty: 0.05
  },

  // ============ ANTHROPIC MODELS ============

  // Claude Sonnet 4.5: Excellent at following instructions methodically
  'claude': {
    temperature: 0.4,
    maxTokens: 8192,
    topP: 0.95
  },

  'claude-sonnet': {
    temperature: 0.4,
    maxTokens: 8192,
    topP: 0.95
  },

  // Claude Opus: Most capable for complex tasks
  'claude-opus': {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.95
  },

  // ============ GOOGLE MODELS ============

  // Gemini 2.0 Flash: Fast and efficient
  'gemini': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95
  },

  'gemini-flash': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95
  },

  // Gemini Pro: More capable version
  'gemini-pro': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95
  },

  // ============ XAI MODELS (GROK) ============

  // Grok: xAI's model
  'grok': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  'grok-2': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // ============ GROQ MODELS (GRATIS Y ULTRA RÁPIDO) ============

  // Groq Llama 3.1 70B: Excelente calidad, 500+ tokens/seg
  'groq': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  'groq-llama': {
    temperature: 0.3,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // Groq Qwen 2.5 Coder 32B: Especializado en código
  'groq-qwen': {
    temperature: 0.2,
    maxTokens: 8192,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // Groq Mixtral: Modelo grande, 32k context
  'groq-mixtral': {
    temperature: 0.3,
    maxTokens: 32768,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // ============ DEEPSEEK MODELS (MUY BARATO) ============

  // DeepSeek Coder: Especializado en código, $0.14/1M tokens
  'deepseek-api': {
    temperature: 0.2,
    maxTokens: 16384,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  'deepseek-chat': {
    temperature: 0.3,
    maxTokens: 16384,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1
  },

  // ============ LOCAL MODELS (UNLIMITED USE) ============

  // Generic local model fallback
  'local': {
    temperature: 0.2,
    maxTokens: 4096,
    topP: 0.9,
    frequencyPenalty: 0.15,
    presencePenalty: 0.1,
    stopSequences: ['<|endoftext|>', '<|im_end|>', '</s>']
  },

  // Qwen2.5-Coder 7B: Good for basic coding, runs on 8GB GPU
  'qwen-7b': {
    temperature: 0.2,
    maxTokens: 8192,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: ['<|im_end|>', '<|endoftext|>', '<|im_start|>']
  },

  // Qwen2.5-Coder 14B: Better quality, needs 16GB GPU
  'qwen-14b': {
    temperature: 0.2,
    maxTokens: 8192,
    topP: 0.9,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: ['<|im_end|>', '<|endoftext|>', '<|im_start|>']
  },

  // Qwen2.5-Coder 32B: Best quality, needs 24GB+ GPU
  'qwen-32b': {
    temperature: 0.2,
    maxTokens: 16384,
    topP: 0.9,
    frequencyPenalty: 0.05,
    presencePenalty: 0.05,
    stopSequences: ['<|im_end|>', '<|endoftext|>', '<|im_start|>']
  },

  // DeepSeek-Coder: Alternative to Qwen, excellent for code
  'deepseek': {
    temperature: 0.2,
    maxTokens: 16384,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: ['<|EOT|>', '<｜end▁of▁sentence｜>']
  },

  'deepseek-coder': {
    temperature: 0.2,
    maxTokens: 16384,
    topP: 0.95,
    stopSequences: ['<|EOT|>']
  },

  // Codestral: Mistral's code model, very capable
  'codestral': {
    temperature: 0.2,
    maxTokens: 32768,
    topP: 0.95,
    frequencyPenalty: 0.1,
    presencePenalty: 0.1,
    stopSequences: ['</s>', '[INST]', '[/INST]']
  },

  // Generic Qwen fallback
  'qwen': {
    temperature: 0.2,
    maxTokens: 8192,
    topP: 0.9,
    stopSequences: ['<|im_end|>', '<|endoftext|>']
  },

  'qwen-coder': {
    temperature: 0.2,
    maxTokens: 8192,
    topP: 0.9,
    stopSequences: ['<|im_end|>', '<|endoftext|>']
  }
};

/**
 * Get optimized config for a model
 */
export function getModelConfig(modelName: string): ModelConfig {
  // Try exact match first
  if (MODEL_CONFIGS[modelName]) {
    return MODEL_CONFIGS[modelName];
  }

  // Try partial match
  for (const [key, config] of Object.entries(MODEL_CONFIGS)) {
    if (modelName.toLowerCase().includes(key.toLowerCase())) {
      return config;
    }
  }

  // Default fallback
  return {
    temperature: 0.3,
    maxTokens: 4096,
    topP: 0.95
  };
}

/**
 * Reasoning modes for different task complexities
 */
export const REASONING_MODES = {
  // Quick tasks: refactoring, simple bug fixes
  QUICK: {
    temperature: 0.2,
    reasoning: { enabled: false }
  },

  // Standard tasks: feature implementation, moderate complexity
  STANDARD: {
    temperature: 0.3,
    reasoning: { enabled: true, budget: 5000 }
  },

  // Complex tasks: architecture, debugging, optimization
  DEEP: {
    temperature: 0.4,
    reasoning: { enabled: true, budget: 10000 }
  }
};

/**
 * Task-specific parameter adjustments
 */
export function getTaskOptimizedConfig(
  baseConfig: ModelConfig,
  taskType: 'debug' | 'implement' | 'refactor' | 'explain' | 'architecture'
): ModelConfig {
  switch (taskType) {
    case 'debug':
      // Debugging needs methodical, deterministic reasoning
      return {
        ...baseConfig,
        temperature: Math.min(baseConfig.temperature, 0.2),
        topP: 0.9
      };

    case 'implement':
      // Implementation benefits from some creativity
      return {
        ...baseConfig,
        temperature: 0.3,
        topP: 0.95
      };

    case 'refactor':
      // Refactoring should be conservative and safe
      return {
        ...baseConfig,
        temperature: 0.2,
        topP: 0.9
      };

    case 'explain':
      // Explanations can be more creative/varied
      return {
        ...baseConfig,
        temperature: 0.5,
        maxTokens: Math.max(baseConfig.maxTokens, 6000)
      };

    case 'architecture':
      // Architecture needs deep thinking and creativity
      return {
        ...baseConfig,
        temperature: 0.4,
        maxTokens: Math.max(baseConfig.maxTokens, 8000),
        topP: 0.95
      };

    default:
      return baseConfig;
  }
}
