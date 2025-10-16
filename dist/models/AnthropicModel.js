"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicModel = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const model_configs_1 = require("../config/model-configs");
class AnthropicModel {
    client;
    model;
    modelName;
    constructor(config) {
        this.client = new sdk_1.default({
            apiKey: config.apiKey
        });
        this.model = config.model || 'claude-3-5-sonnet-20241022';
        this.modelName = config.name || 'claude';
    }
    convertMessages(messages) {
        let systemMessage;
        const converted = [];
        for (const msg of messages) {
            if (msg.role === 'system') {
                systemMessage = msg.content;
            }
            else {
                converted.push(msg);
            }
        }
        return [systemMessage, converted];
    }
    convertTools(tools) {
        if (!tools || tools.length === 0)
            return [];
        return tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.parameters
        }));
    }
    async chat(messages, tools) {
        const [system, convertedMessages] = this.convertMessages(messages);
        // Get optimized configuration for this model
        const modelConfig = (0, model_configs_1.getModelConfig)(this.modelName);
        const params = {
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
        const textContent = response.content.find((block) => block.type === 'text');
        const toolUses = response.content.filter((block) => block.type === 'tool_use');
        return {
            choices: [{
                    message: {
                        role: 'assistant',
                        content: textContent ? textContent.text : null,
                        tool_calls: toolUses.length > 0 ? toolUses.map((block) => ({
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
exports.AnthropicModel = AnthropicModel;
//# sourceMappingURL=AnthropicModel.js.map