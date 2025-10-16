import OpenAI from 'openai';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';

export class DeepSeekModel implements Model {
  private client: OpenAI;
  private model: string;
  private modelName: string;

  constructor(config: any) {
    // DeepSeek uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://api.deepseek.com'
    });
    this.model = config.model || 'deepseek-coder';
    this.modelName = config.name || 'deepseek-api';
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    const modelConfig = getModelConfig(this.modelName);

    const params: any = {
      model: this.model,
      messages,
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP
    };

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
