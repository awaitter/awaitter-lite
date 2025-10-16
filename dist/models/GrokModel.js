"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrokModel = void 0;
const openai_1 = __importDefault(require("openai"));
const model_configs_1 = require("../config/model-configs");
class GrokModel {
    client;
    model;
    modelName;
    constructor(config) {
        // xAI uses OpenAI-compatible API
        this.client = new openai_1.default({
            apiKey: config.apiKey,
            baseURL: 'https://api.x.ai/v1'
        });
        this.model = config.model || 'grok-beta';
        this.modelName = config.name || 'grok';
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
        if (modelConfig.frequencyPenalty !== undefined) {
            params.frequency_penalty = modelConfig.frequencyPenalty;
        }
        if (modelConfig.presencePenalty !== undefined) {
            params.presence_penalty = modelConfig.presencePenalty;
        }
        if (modelConfig.stopSequences && modelConfig.stopSequences.length > 0) {
            params.stop = modelConfig.stopSequences;
        }
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
exports.GrokModel = GrokModel;
//# sourceMappingURL=GrokModel.js.map