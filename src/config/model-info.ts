/**
 * Model information database for benchmark display
 */

export interface ModelInfo {
  name: string;
  displayName: string;
  provider: string;
  contextWindow: number;
  cost: string;
  speed: 'instant' | 'very-fast' | 'fast' | 'medium' | 'slow';
  quality: 'excellent' | 'very-good' | 'good' | 'fair';
  rateLimit: string;
  useCase: string;
  notes?: string;
}

export const MODEL_INFO: Record<string, ModelInfo> = {
  // Local Models (Ollama) - Qwen 2.5 Coder Series
  'local': {
    name: 'local',
    displayName: 'Qwen 2.5 Coder 1.5B',
    provider: 'Ollama',
    contextWindow: 4096,
    cost: 'Free',
    speed: 'medium',
    quality: 'good',
    rateLimit: 'Unlimited',
    useCase: 'Learning, small projects',
    notes: 'Requires 2GB RAM'
  },
  'qwen-0.5b': {
    name: 'qwen-0.5b',
    displayName: 'Qwen 2.5 Coder 0.5B',
    provider: 'Ollama',
    contextWindow: 4096,
    cost: 'Free',
    speed: 'fast',
    quality: 'fair',
    rateLimit: 'Unlimited',
    useCase: 'Very lightweight, testing',
    notes: 'Requires 1GB RAM'
  },
  'qwen-1.5b': {
    name: 'qwen-1.5b',
    displayName: 'Qwen 2.5 Coder 1.5B',
    provider: 'Ollama',
    contextWindow: 4096,
    cost: 'Free',
    speed: 'medium',
    quality: 'good',
    rateLimit: 'Unlimited',
    useCase: 'Learning, small projects',
    notes: 'Requires 2GB RAM'
  },
  'qwen-3b': {
    name: 'qwen-3b',
    displayName: 'Qwen 2.5 Coder 3B',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'medium',
    quality: 'good',
    rateLimit: 'Unlimited',
    useCase: 'Good balance for laptops',
    notes: 'Requires 4GB RAM'
  },
  'qwen-7b': {
    name: 'qwen-7b',
    displayName: 'Qwen 2.5 Coder 7B',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'slow',
    quality: 'very-good',
    rateLimit: 'Unlimited',
    useCase: 'Medium projects, offline work',
    notes: 'Requires 8GB RAM'
  },
  'qwen-14b': {
    name: 'qwen-14b',
    displayName: 'Qwen 2.5 Coder 14B',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'slow',
    quality: 'very-good',
    rateLimit: 'Unlimited',
    useCase: 'Large projects, offline work',
    notes: 'Requires 16GB RAM'
  },
  'qwen-32b': {
    name: 'qwen-32b',
    displayName: 'Qwen 2.5 Coder 32B',
    provider: 'Ollama',
    contextWindow: 16384,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'Production, complex tasks',
    notes: 'Requires 32GB RAM'
  },
  // Qwen 3 Series (NEW - January 2025)
  'qwen3-1.7b': {
    name: 'qwen3-1.7b',
    displayName: 'Qwen 3 1.7B',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'medium',
    quality: 'good',
    rateLimit: 'Unlimited',
    useCase: 'Fast general purpose',
    notes: 'Requires 2GB RAM, faster than 2.5'
  },
  'qwen3-4b': {
    name: 'qwen3-4b',
    displayName: 'Qwen 3 4B',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'medium',
    quality: 'very-good',
    rateLimit: 'Unlimited',
    useCase: 'Balanced performance',
    notes: 'Requires 4GB RAM'
  },
  'qwen3-14b': {
    name: 'qwen3-14b',
    displayName: 'Qwen 3 14B',
    provider: 'Ollama',
    contextWindow: 16384,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'High quality tasks',
    notes: 'Requires 16GB RAM'
  },
  'qwen3-30b': {
    name: 'qwen3-30b',
    displayName: 'Qwen 3 30B ⭐',
    provider: 'Ollama',
    contextWindow: 16384,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'Best local model (Jan 2025)',
    notes: 'Requires 24GB RAM, recommended'
  },
  'qwen3-70b': {
    name: 'qwen3-70b',
    displayName: 'Qwen 3 70B',
    provider: 'Ollama',
    contextWindow: 32768,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'Maximum quality, workstations',
    notes: 'Requires 48GB RAM'
  },
  // Other Local Models
  'deepseek': {
    name: 'deepseek',
    displayName: 'DeepSeek Coder V2 16B',
    provider: 'Ollama',
    contextWindow: 16384,
    cost: 'Free',
    speed: 'slow',
    quality: 'very-good',
    rateLimit: 'Unlimited',
    useCase: 'Code-focused tasks',
    notes: 'Requires 16GB RAM'
  },
  'deepseek-v3': {
    name: 'deepseek-v3',
    displayName: 'DeepSeek V3 671B',
    provider: 'Ollama',
    contextWindow: 65536,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'Extreme quality (if you have GPU)',
    notes: 'Requires 300GB+ VRAM (datacenter)'
  },
  'codestral': {
    name: 'codestral',
    displayName: 'Codestral 22B',
    provider: 'Ollama',
    contextWindow: 32768,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'Advanced coding tasks',
    notes: 'Requires 24GB RAM'
  },
  'llama-70b': {
    name: 'llama-70b',
    displayName: 'Llama 3.3 70B Instruct',
    provider: 'Ollama',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: 'Unlimited',
    useCase: 'General purpose, excellent',
    notes: 'Requires 48GB RAM'
  },
  'mistral-nemo': {
    name: 'mistral-nemo',
    displayName: 'Mistral Nemo 12B',
    provider: 'Ollama',
    contextWindow: 131072,
    cost: 'Free',
    speed: 'medium',
    quality: 'very-good',
    rateLimit: 'Unlimited',
    useCase: 'Large context window',
    notes: 'Requires 12GB RAM'
  },

  // OpenAI Models
  'gpt4': {
    name: 'gpt4',
    displayName: 'GPT-4 Turbo',
    provider: 'OpenAI',
    contextWindow: 128000,
    cost: '$10 per 1M input / $30 per 1M output',
    speed: 'fast',
    quality: 'excellent',
    rateLimit: '30K TPM (tier 1)',
    useCase: 'Professional, production apps',
    notes: 'Best overall quality'
  },
  'gpt4-turbo': {
    name: 'gpt4-turbo',
    displayName: 'GPT-4 Turbo 2024',
    provider: 'OpenAI',
    contextWindow: 128000,
    cost: '$10 per 1M input / $30 per 1M output',
    speed: 'fast',
    quality: 'excellent',
    rateLimit: '30K TPM (tier 1)',
    useCase: 'Professional, production apps',
    notes: 'Latest GPT-4 version'
  },
  'gpt35': {
    name: 'gpt35',
    displayName: 'GPT-3.5 Turbo',
    provider: 'OpenAI',
    contextWindow: 16385,
    cost: '$0.50 per 1M input / $1.50 per 1M output',
    speed: 'very-fast',
    quality: 'good',
    rateLimit: '60K TPM (tier 1)',
    useCase: 'Fast, cheap tasks',
    notes: 'Very cost-effective'
  },
  'o1': {
    name: 'o1',
    displayName: 'O1 Preview',
    provider: 'OpenAI',
    contextWindow: 128000,
    cost: '$15 per 1M input / $60 per 1M output',
    speed: 'slow',
    quality: 'excellent',
    rateLimit: '20K TPM (tier 1)',
    useCase: 'Complex reasoning tasks',
    notes: 'Advanced reasoning model'
  },

  // Anthropic Models
  'claude': {
    name: 'claude',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    cost: '$3 per 1M input / $15 per 1M output',
    speed: 'fast',
    quality: 'excellent',
    rateLimit: 'Varies by tier',
    useCase: 'Production, long context',
    notes: 'Best for reliability'
  },
  'claude-opus': {
    name: 'claude-opus',
    displayName: 'Claude 3 Opus',
    provider: 'Anthropic',
    contextWindow: 200000,
    cost: '$15 per 1M input / $75 per 1M output',
    speed: 'medium',
    quality: 'excellent',
    rateLimit: 'Varies by tier',
    useCase: 'Complex tasks, highest quality',
    notes: 'Most capable Claude model'
  },
  'claude-sonnet': {
    name: 'claude-sonnet',
    displayName: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    contextWindow: 200000,
    cost: '$3 per 1M input / $15 per 1M output',
    speed: 'fast',
    quality: 'excellent',
    rateLimit: 'Varies by tier',
    useCase: 'Production, long context',
    notes: 'Best balance'
  },

  // Google Models
  'gemini': {
    name: 'gemini',
    displayName: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: 1000000,
    cost: 'Free (50 req/day) or $0.075/$0.30 per 1M',
    speed: 'instant',
    quality: 'very-good',
    rateLimit: '50/day free, 2K RPM paid',
    useCase: 'Fast prototyping, free tier',
    notes: 'Longest context window'
  },
  'gemini-flash': {
    name: 'gemini-flash',
    displayName: 'Gemini 2.0 Flash',
    provider: 'Google',
    contextWindow: 1000000,
    cost: 'Free (50 req/day) or $0.075/$0.30 per 1M',
    speed: 'instant',
    quality: 'very-good',
    rateLimit: '50/day free, 2K RPM paid',
    useCase: 'Fast prototyping, free tier',
    notes: 'Longest context window'
  },
  'gemini-pro': {
    name: 'gemini-pro',
    displayName: 'Gemini 1.5 Pro',
    provider: 'Google',
    contextWindow: 2000000,
    cost: '$1.25 per 1M input / $5 per 1M output',
    speed: 'fast',
    quality: 'excellent',
    rateLimit: '2K RPM',
    useCase: 'Long documents, video analysis',
    notes: '2M token context'
  },

  // xAI Models
  'grok': {
    name: 'grok',
    displayName: 'Grok Beta',
    provider: 'xAI',
    contextWindow: 131072,
    cost: '$5 per 1M input / $15 per 1M output',
    speed: 'fast',
    quality: 'very-good',
    rateLimit: 'Varies',
    useCase: 'General purpose',
    notes: 'Real-time info access'
  },
  'grok-2': {
    name: 'grok-2',
    displayName: 'Grok 2 Latest',
    provider: 'xAI',
    contextWindow: 131072,
    cost: '$5 per 1M input / $15 per 1M output',
    speed: 'fast',
    quality: 'very-good',
    rateLimit: 'Varies',
    useCase: 'General purpose',
    notes: 'Latest Grok version'
  },

  // Groq Models (Free & Fast)
  'groq': {
    name: 'groq',
    displayName: 'Llama 3.3 70B',
    provider: 'Groq',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'instant',
    quality: 'very-good',
    rateLimit: '6K requests/day',
    useCase: 'Fast free alternative',
    notes: 'Limited function calling'
  },
  'groq-llama': {
    name: 'groq-llama',
    displayName: 'Llama 3.3 70B',
    provider: 'Groq',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'instant',
    quality: 'very-good',
    rateLimit: '6K requests/day',
    useCase: 'Fast free alternative',
    notes: 'Limited function calling'
  },
  'groq-qwen': {
    name: 'groq-qwen',
    displayName: 'Qwen 3 32B',
    provider: 'Groq',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'instant',
    quality: 'very-good',
    rateLimit: '6K TPM',
    useCase: 'Fast free alternative',
    notes: 'Low token limit'
  },
  'groq-fast': {
    name: 'groq-fast',
    displayName: 'Llama 3.1 8B',
    provider: 'Groq',
    contextWindow: 8192,
    cost: 'Free',
    speed: 'instant',
    quality: 'good',
    rateLimit: '6K requests/day',
    useCase: 'Ultra-fast prototyping',
    notes: 'Recommended Groq model'
  },

  // DeepSeek API Models
  'deepseek-api': {
    name: 'deepseek-api',
    displayName: 'DeepSeek Coder',
    provider: 'DeepSeek',
    contextWindow: 16384,
    cost: '$0.14 per 1M input / $0.28 per 1M output',
    speed: 'fast',
    quality: 'very-good',
    rateLimit: 'Varies by tier',
    useCase: 'Cost-effective coding',
    notes: 'Cheapest API option'
  },
  'deepseek-chat': {
    name: 'deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'DeepSeek',
    contextWindow: 16384,
    cost: '$0.14 per 1M input / $0.28 per 1M output',
    speed: 'fast',
    quality: 'very-good',
    rateLimit: 'Varies by tier',
    useCase: 'Cost-effective general use',
    notes: 'Best price/quality ratio'
  }
};

export function getModelInfo(modelName: string): ModelInfo | undefined {
  return MODEL_INFO[modelName];
}

export function getAllModelInfo(): ModelInfo[] {
  return Object.values(MODEL_INFO);
}
