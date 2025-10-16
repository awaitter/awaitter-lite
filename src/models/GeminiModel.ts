import { GoogleGenerativeAI } from '@google/generative-ai';
import { Model } from './ModelManager';
import { getModelConfig } from '../config/model-configs';

export class GeminiModel implements Model {
  private client: GoogleGenerativeAI;
  private model: string;
  private modelName: string;

  constructor(config: any) {
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model || 'gemini-2.0-flash-exp';
    this.modelName = config.name || 'gemini';
  }

  async chat(messages: any[], tools?: any[]): Promise<any> {
    const modelConfig = getModelConfig(this.modelName);

    // Convert messages to Gemini format
    const geminiMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content || '' }]
      }));

    // Get system message if exists
    const systemMessage = messages.find(m => m.role === 'system');
    const systemInstruction = systemMessage?.content;

    const model = this.client.getGenerativeModel({
      model: this.model,
      systemInstruction: systemInstruction ? { text: systemInstruction } : undefined
    });

    // Convert tools to Gemini format
    const geminiTools = tools && tools.length > 0 ? [{
      functionDeclarations: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters
      }))
    }] : undefined;

    const generationConfig = {
      temperature: modelConfig.temperature,
      topP: modelConfig.topP,
      maxOutputTokens: modelConfig.maxTokens,
    };

    const result = await model.generateContent({
      contents: geminiMessages,
      tools: geminiTools,
      generationConfig
    });

    const response = result.response;
    const candidate = response.candidates?.[0];

    // Check for function calls
    const functionCalls = candidate?.content?.parts
      ?.filter(part => part.functionCall)
      .map(part => ({
        id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'function',
        function: {
          name: part.functionCall!.name,
          arguments: JSON.stringify(part.functionCall!.args)
        }
      }));

    return {
      choices: [{
        message: {
          role: 'assistant',
          content: candidate?.content?.parts
            ?.filter(part => part.text)
            .map(part => part.text)
            .join('') || null,
          tool_calls: functionCalls && functionCalls.length > 0 ? functionCalls : undefined
        }
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }
}
