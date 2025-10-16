import { Config } from '../config/Config';
import { LocalModel } from './LocalModel';
import { OpenAIModel } from './OpenAIModel';
import { AnthropicModel } from './AnthropicModel';
import { GeminiModel } from './GeminiModel';
import { GrokModel } from './GrokModel';
import { GroqModel } from './GroqModel';
import { DeepSeekModel } from './DeepSeekModel';
import { ModelSetup } from './ModelSetup';

export interface Model {
  chat(messages: any[], tools?: any[]): Promise<any>;
}

export class ModelManager {
  private currentModel: Model | null = null;
  private currentModelName: string = '';

  constructor(private config: Config) {}

  async setModel(modelName: string) {
    const models = this.config.get('models');

    if (!models[modelName]) {
      throw new Error(`Model not found: ${modelName}`);
    }

    const modelConfig = models[modelName];

    switch (modelConfig.type) {
      case 'local':
        // Auto-setup for local models (checks Ollama, downloads model if missing)
        const setupResult = await ModelSetup.setupLocalModel(modelName);

        if (!setupResult.ready) {
          throw new Error('Local model is not ready. Install Ollama or download the model first.');
        }

        // Add Ollama model name to config
        modelConfig.model = setupResult.ollamaModelName;
        modelConfig.name = modelName;

        this.currentModel = new LocalModel(modelConfig);
        break;

      case 'openai':
        this.currentModel = new OpenAIModel(modelConfig);
        break;

      case 'anthropic':
        this.currentModel = new AnthropicModel(modelConfig);
        break;

      case 'google':
        this.currentModel = new GeminiModel(modelConfig);
        break;

      case 'xai':
        this.currentModel = new GrokModel(modelConfig);
        break;

      case 'groq':
        this.currentModel = new GroqModel(modelConfig);
        break;

      case 'deepseek':
        this.currentModel = new DeepSeekModel(modelConfig);
        break;

      default:
        throw new Error(`Unknown model type: ${modelConfig.type}`);
    }

    this.currentModelName = modelName;
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    if (!this.currentModel) {
      throw new Error('No model selected');
    }

    return this.currentModel.chat(messages, tools);
  }

  getCurrentModelName(): string {
    return this.currentModelName;
  }
}
