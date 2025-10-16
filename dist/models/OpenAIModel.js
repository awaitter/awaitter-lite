"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIModel = void 0;
const openai_1 = __importDefault(require("openai"));
const model_configs_1 = require("../config/model-configs");
class OpenAIModel {
    client;
    model;
    modelName;
    constructor(config) {
        this.client = new openai_1.default({
            apiKey: config.apiKey
        });
        this.model = config.model || 'gpt-4-turbo';
        this.modelName = config.name || 'gpt4';
    }
    async chat(messages, tools) {
        // Get optimized configuration for this model
        const modelConfig = (0, model_configs_1.getModelConfig)(this.modelName);
        const params = {
            model: this.model,
            messages,
            max_tokens: modelConfig.maxTokens,
            temperature: modelConfig.temperature,
            top_p: modelConfig.topP
        };
        // Add optional parameters if defined
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
exports.OpenAIModel = OpenAIModel;
//# sourceMappingURL=OpenAIModel.js.map