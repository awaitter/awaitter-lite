import OpenAI from 'openai';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';

export class OpenAIModel implements Model {
  private client: OpenAI;
  private model: string;
  private modelName: string;

  constructor(config: any) {
    this.client = new OpenAI({
      apiKey: config.apiKey
    });
    this.model = config.model || 'gpt-4-turbo';
    this.modelName = config.name || 'gpt4';
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    // Get optimized configuration for this model
    const modelConfig = getModelConfig(this.modelName);

    const params: any = {
      model: this.model,
      messages,
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP
    };

    // Add optional parameters if defined
    if (modelConfig.frequencyPenalty !== undefined) {
      params.frequency_penalty = modelConfig.frequencyPenalty;
    }
    if (modelConfig.presencePenalty !== undefined) {
      params.presence_penalty = modelConfig.presencePenalty;
    }
    if (modelConfig.stopSequences && modelConfig.stopSequences.length > 0) {
      params.stop = modelConfig.stopSequences;
    }

    if (tools && tools.length > 0) {
      params.tools = tools.map(tool => ({
        type: 'function',
        function: tool
      }));
      params.tool_choice = 'auto';
    }

    const response = await this.client.chat.completions.create(params);

    return {
      choices: response.choices.map(choice => ({
        message: {
          role: choice.message.role,
          content: choice.message.content,
          tool_calls: choice.message.tool_calls
        }
      })),
      usage: response.usage
    };
  }
}
