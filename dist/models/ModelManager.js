"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelManager = void 0;
const LocalModel_1 = require("./LocalModel");
const OpenAIModel_1 = require("./OpenAIModel");
const AnthropicModel_1 = require("./AnthropicModel");
const GeminiModel_1 = require("./GeminiModel");
const GrokModel_1 = require("./GrokModel");
const GroqModel_1 = require("./GroqModel");
const DeepSeekModel_1 = require("./DeepSeekModel");
const ModelSetup_1 = require("./ModelSetup");
class ModelManager {
    config;
    currentModel = null;
    currentModelName = '';
    constructor(config) {
        this.config = config;
    }
    async setModel(modelName) {
        const models = this.config.get('models');
        if (!models[modelName]) {
            throw new Error(`Model not found: ${modelName}`);
        }
        const modelConfig = models[modelName];
        switch (modelConfig.type) {
            case 'local':
                // Auto-setup for local models (checks Ollama, downloads model if missing)
                const setupResult = await ModelSetup_1.ModelSetup.setupLocalModel(modelName);
                if (!setupResult.ready) {
                    throw new Error('Local model is not ready. Install Ollama or download the model first.');
                }
                // Add Ollama model name to config
                modelConfig.model = setupResult.ollamaModelName;
                modelConfig.name = modelName;
                this.currentModel = new LocalModel_1.LocalModel(modelConfig);
                break;
            case 'openai':
                this.currentModel = new OpenAIModel_1.OpenAIModel(modelConfig);
                break;
            case 'anthropic':
                this.currentModel = new AnthropicModel_1.AnthropicModel(modelConfig);
                break;
            case 'google':
                this.currentModel = new GeminiModel_1.GeminiModel(modelConfig);
                break;
            case 'xai':
                this.currentModel = new GrokModel_1.GrokModel(modelConfig);
                break;
            case 'groq':
                this.currentModel = new GroqModel_1.GroqModel(modelConfig);
                break;
            case 'deepseek':
                this.currentModel = new DeepSeekModel_1.DeepSeekModel(modelConfig);
                break;
            default:
                throw new Error(`Unknown model type: ${modelConfig.type}`);
        }
        this.currentModelName = modelName;
    }
    async chat(messages, tools) {
        if (!this.currentModel) {
            throw new Error('No model selected');
        }
        return this.currentModel.chat(messages, tools);
    }
    getCurrentModelName() {
        return this.currentModelName;
    }
}
exports.ModelManager = ModelManager;
//# sourceMappingURL=ModelManager.js.map