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
    const modelConfig = getModelConfig(this.modelName);

    // Use OpenAI-compatible endpoint for native tool/function calling support
    const payload: any = {
      model: this.ollamaModelName,
      messages,
      stream: false,
      temperature: modelConfig.temperature,
      top_p: modelConfig.topP,
      max_tokens: modelConfig.maxTokens,
    };

    // Pass tools natively — Ollama supports this since v0.3+
    if (tools && tools.length > 0) {
      payload.tools = tools.map(tool => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters || tool.input_schema || {}
        }
      }));
    }

    try {
      const response = await axios.post(
        `${this.url}/v1/chat/completions`,
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 300000
        }
      );

      // Already in OpenAI format — return directly
      return response.data;

    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Cannot connect to Ollama. Make sure Ollama is running.');
      }
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        throw new Error('Timeout: Model took too long. Try a smaller model.');
      }
      if (error.response?.status === 400) {
        throw new Error('Ollama error 400: Context too long or invalid request. Try /clear to reset the conversation.');
      }
      throw new Error(`Ollama error: ${error.message}`);
    }
  }
}
