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
        // Get optimized configuration for this model
        const modelConfig = (0, model_configs_1.getModelConfig)(this.modelName);
        // Ollama format
        const payload = {
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
            const toolDescriptions = tools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n');
            const systemMsg = messages.find(m => m.role === 'system');
            if (systemMsg) {
                systemMsg.content += `\n\nAvailable tools:\n${toolDescriptions}`;
            }
            else {
                messages.unshift({
                    role: 'system',
                    content: `Available tools:\n${toolDescriptions}`
                });
            }
        }
        try {
            const response = await axios_1.default.post(`${this.url}/api/chat`, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 300000 // 5 minutes for slow CPU
            });
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
        }
        catch (error) {
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
exports.LocalModel = LocalModel;
//# sourceMappingURL=LocalModel.js.map