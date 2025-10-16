import axios from 'axios';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';
import { ModelSetup } from './ModelSetup';

export class LocalModel implements Model {
  private url: string;
  private ollamaModelName: string;
  private modelName: string;

  constructor(config: any) {
    this.url = config.url || 'http://localhost:11434';
    this.modelName = config.name || 'local';
    this.ollamaModelName = config.model || ModelSetup.getOllamaModelName(this.modelName);
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    // Get optimized configuration for this model
    const modelConfig = getModelConfig(this.modelName);

    // Ollama format
    const payload: any = {
      model: this.ollamaModelName,
      messages,
      stream: false,
      options: {
        temperature: modelConfig.temperature,
        top_p: modelConfig.topP,
        num_predict: modelConfig.maxTokens,
      }
    };

    // Add stop sequences if present
    if (modelConfig.stopSequences && modelConfig.stopSequences.length > 0) {
      payload.options.stop = modelConfig.stopSequences;
    }

    // Ollama doesn't support function calling natively yet
    // If tools are provided, add them to system message as context
    if (tools && tools.length > 0) {
      const toolDescriptions = tools.map(tool =>
        `- ${tool.name}: ${tool.description}`
      ).join('\n');

      const systemMsg = messages.find(m => m.role === 'system');
      if (systemMsg) {
        systemMsg.content += `\n\nAvailable tools:\n${toolDescriptions}`;
      } else {
        messages.unshift({
          role: 'system',
          content: `Available tools:\n${toolDescriptions}`
        });
      }
    }

    try {
      const response = await axios.post(
        `${this.url}/api/chat`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 300000 // 5 minutes for slow CPU
        }
      );

      // Convert Ollama response to OpenAI format
      return {
        choices: [{
          message: {
            role: response.data.message.role,
            content: response.data.message.content,
            tool_calls: undefined // Ollama doesn't support function calling yet
          }
        }],
        usage: {
          prompt_tokens: response.data.prompt_eval_count || 0,
          completion_tokens: response.data.eval_count || 0,
          total_tokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0)
        }
      };
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama. Make sure Ollama is running.');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error(`Timeout: Model took more than 5 minutes to respond. On CPU, local models are very slow. Consider using: code-cli --model gpt4`);
      }
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}
