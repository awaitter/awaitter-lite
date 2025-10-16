"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroqModel = void 0;
const openai_1 = __importDefault(require("openai"));
const model_configs_1 = require("../config/model-configs");
class GroqModel {
    client;
    model;
    modelName;
    constructor(config) {
        // Groq uses OpenAI-compatible API
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: 'https://api.groq.com/openai/v1'
        });
        this.model = config.model || 'llama-3.1-70b-versatile';
        this.modelName = config.name || 'groq';
    }
    async chat(messages, tools) {
        const modelConfig = (0, model_configs_1.getModelConfig)(this.modelName);
        const params = {
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
        }
        catch (error) {
            // Check for function calling validation errors
            if (error.message && error.message.includes('tool call validation failed')) {
                throw new Error(`Groq model ${this.model} has limited function calling support. ` +
                    'Try using groq-fast (llama-3.1-8b-instant) instead, or switch to a different provider like GPT-4 or Gemini.');
            }
            // Check for token limit errors
            if (error.message && error.message.includes('Request too large')) {
                throw new Error(`Groq request exceeded token limit. The system prompt may be too large for this model. ` +
                    'Try using a different model or reduce the conversation size.');
            }
            throw error;
        }
    }
}
exports.GroqModel = GroqModel;
//# sourceMappingURL=GroqModel.js.map