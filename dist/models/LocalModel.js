"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalModel = void 0;
const axios_1 = __importDefault(require("axios"));
const model_configs_1 = require("../config/model-configs");
const ModelSetup_1 = require("./ModelSetup");
class LocalModel {
    url;
    ollamaModelName;
    modelName;
    constructor(config) {
        this.url = config.url || 'http://localhost:11434';
        this.modelName = config.name || 'local';
        this.ollamaModelName = config.model || ModelSetup_1.ModelSetup.getOllamaModelName(this.modelName);
    }
    async chat(messages, tools) {
        const modelConfig = (0, model_configs_1.getModelConfig)(this.modelName);
        // Use OpenAI-compatible endpoint for native tool/function calling support
        const payload = {
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
            const response = await axios_1.default.post(`${this.url}/v1/chat/completions`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 300000
            });
            // Already in OpenAI format — return directly
            return response.data;
        }
        catch (error) {
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
exports.LocalModel = LocalModel;
//# sourceMappingURL=LocalModel.js.map