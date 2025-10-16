import Anthropic from '@anthropic-ai/sdk';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';

export class AnthropicModel implements Model {
  private client: Anthropic;
  private model: string;
  private modelName: string;

  constructor(config: any) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.modelName = config.name || 'claude';
  }

  private convertMessages(messages: any[]): [string | undefined, any[]] {
    let systemMessage: string | undefined;
    const converted: any[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        systemMessage = msg.content;
      } else {
        converted.push(msg);
      }
    }

    return [systemMessage, converted];
  }

  private convertTools(tools: any[]): any[] {
    if (!tools || tools.length === 0) return [];

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.parameters
    }));
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    const [system, convertedMessages] = this.convertMessages(messages);

    // Get optimized configuration for this model
    const modelConfig = getModelConfig(this.modelName);

    const params: any = {
      model: this.model,
      messages: convertedMessages,
      max_tokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature
    };

    if (modelConfig.topP !== undefined) {
      params.top_p = modelConfig.topP;
    }

    if (system) {
      params.system = system;
    }

    if (tools && tools.length > 0) {
      params.tools = this.convertTools(tools);
    }

    const response = await this.client.messages.create(params);

    // Convert to OpenAI format
    const textContent = response.content.find((block: any) => block.type === 'text');
    const toolUses = response.content.filter((block: any) => block.type === 'tool_use');

    return {
      choices: [{
        message: {
          role: 'assistant',
          content: textContent ? textContent.text : null,
          tool_calls: toolUses.length > 0 ? toolUses.map((block: any) => ({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input)
            }
          })) : undefined
        }
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      }
    };
  }
}
