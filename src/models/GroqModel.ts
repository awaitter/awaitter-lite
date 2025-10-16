import OpenAI from 'openai';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';

export class GroqModel implements Model {
  private client: OpenAI;
  private model: string;
  private modelName: string;

  constructor(config: any) {
    // Groq uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: 'https://api.groq.com/openai/v1'
    });
    this.model = config.model || 'llama-3.1-70b-versatile';
    this.modelName = config.name || 'groq';
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

    try {
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
    } catch (error: any) {
      // Check for function calling validation errors
      if (error.message && error.message.includes('tool call validation failed')) {
        throw new Error(
          `Groq model ${this.model} has limited function calling support. ` +
          'Try using groq-fast (llama-3.1-8b-instant) instead, or switch to a different provider like GPT-4 or Gemini.'
        );
      }

      // Check for token limit errors
      if (error.message && error.message.includes('Request too large')) {
        throw new Error(
          `Groq request exceeded token limit. The system prompt may be too large for this model. ` +
          'Try using a different model or reduce the conversation size.'
        );
      }

      throw error;
    }
  }
}
