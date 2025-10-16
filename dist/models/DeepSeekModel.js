"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekModel = void 0;
const openai_1 = __importDefault(require("openai"));
const model_configs_1 = require("../config/model-configs");
class DeepSeekModel {
    client;
    model;
    modelName;
    constructor(config) {
        // DeepSeek uses OpenAI-compatible API
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: 'https://api.deepseek.com'
        });
        this.model = config.model || 'deepseek-coder';
        this.modelName = config.name || 'deepseek-api';
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
exports.DeepSeekModel = DeepSeekModel;
//# sourceMappingURL=DeepSeekModel.js.map