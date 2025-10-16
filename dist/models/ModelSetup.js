"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModelSetup = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Map of internal model names to Ollama names
 */
const MODEL_NAME_MAP = {
    'local': 'qwen2.5-coder:1.5b', // Faster on CPU
    'qwen-1.5b': 'qwen2.5-coder:1.5b',
    'qwen-7b': 'qwen2.5-coder:7b',
    'qwen-14b': 'qwen2.5-coder:14b',
    'qwen-32b': 'qwen2.5-coder:32b',
    'qwen': 'qwen2.5-coder:1.5b',
    'qwen-coder': 'qwen2.5-coder:1.5b',
    'deepseek': 'deepseek-coder-v2:16b',
    'deepseek-coder': 'deepseek-coder-v2:16b',
    'codestral': 'codestral:22b',
};
/**
 * Information about model requirements
 */
const MODEL_INFO = {
    'qwen2.5-coder:1.5b': { size: '986MB', vram: '2GB (runs well on CPU)', quality: 'Basic but fast' },
    'qwen2.5-coder:7b': { size: '4.7GB', vram: '8GB GPU', quality: 'Good' },
    'qwen2.5-coder:14b': { size: '9GB', vram: '16GB GPU', quality: 'Better' },
    'qwen2.5-coder:32b': { size: '19GB', vram: '24GB GPU', quality: 'Excellent' },
    'deepseek-coder-v2:16b': { size: '8.9GB', vram: '16GB GPU', quality: 'Excellent' },
    'codestral:22b': { size: '12GB', vram: '16GB GPU', quality: 'Very good' },
};
class ModelSetup {
    /**
     * Verifies and prepares a local model for use
     */
    static async setupLocalModel(modelName) {
        const ollamaModelName = MODEL_NAME_MAP[modelName] || 'qwen2.5-coder:7b';
        console.log();
        console.log(chalk_1.default.cyan('🔧 Setting up local model:'), chalk_1.default.bold(ollamaModelName));
        console.log();
        // 1. Check if Ollama is installed
        const ollamaInstalled = await this.checkOllamaInstalled();
        if (!ollamaInstalled) {
            console.log(chalk_1.default.yellow('⚠️  Ollama is not installed'));
            console.log();
            console.log(chalk_1.default.dim('Ollama is required to run local models.'));
            console.log(chalk_1.default.dim('Download and install from:'), chalk_1.default.cyan('https://ollama.com/download'));
            console.log();
            console.log(chalk_1.default.dim('After installing, run again:'), chalk_1.default.green(`code-cli --model ${modelName}`));
            console.log();
            return {
                ready: false,
                ollamaInstalled: false,
                modelDownloaded: false,
                ollamaModelName
            };
        }
        console.log(chalk_1.default.green('✓'), 'Ollama installed');
        // 2. Check if the model is downloaded
        console.log(chalk_1.default.dim('Checking if model is downloaded...'));
        const modelDownloaded = await this.checkModelDownloaded(ollamaModelName);
        console.log(chalk_1.default.dim(`Result: ${modelDownloaded ? 'downloaded' : 'not downloaded'}`));
        if (!modelDownloaded) {
            // Show model info
            const info = MODEL_INFO[ollamaModelName];
            if (info) {
                console.log();
                console.log(chalk_1.default.dim('Model:'), chalk_1.default.bold(ollamaModelName));
                console.log(chalk_1.default.dim('Download size:'), info.size);
                console.log(chalk_1.default.dim('Required VRAM:'), info.vram);
                console.log(chalk_1.default.dim('Quality:'), info.quality);
                console.log();
            }
            // Ask if user wants to download
            const shouldDownload = await this.askToDownload(ollamaModelName);
            if (!shouldDownload) {
                console.log();
                console.log(chalk_1.default.yellow('⚠️  Download cancelled'));
                console.log(chalk_1.default.dim('You can download manually with:'), chalk_1.default.green(`ollama pull ${ollamaModelName}`));
                console.log(chalk_1.default.dim('Or use another model with:'), chalk_1.default.green('code-cli --model gpt4'));
                console.log();
                return {
                    ready: false,
                    ollamaInstalled: true,
                    modelDownloaded: false,
                    ollamaModelName
                };
            }
            // Download model
            const downloaded = await this.downloadModel(ollamaModelName);
            if (!downloaded) {
                return {
                    ready: false,
                    ollamaInstalled: true,
                    modelDownloaded: false,
                    ollamaModelName
                };
            }
            console.log();
            console.log(chalk_1.default.green('✓'), 'Model downloaded and ready');
            console.log();
        }
        else {
            console.log(chalk_1.default.green('✓'), 'Model already downloaded');
            console.log();
        }
        return {
            ready: true,
            ollamaInstalled: true,
            modelDownloaded: true,
            ollamaModelName
        };
    }
    /**
     * Check if Ollama is installed
     */
    static async checkOllamaInstalled() {
        try {
            await execAsync('ollama --version', {
                timeout: 5000 // 5 seconds timeout
            });
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Check if a model is downloaded
     */
    static async checkModelDownloaded(modelName) {
        try {
            const { stdout } = await execAsync('ollama list', {
                timeout: 10000 // 10 seconds timeout
            });
            return stdout.includes(modelName.split(':')[0]);
        }
        catch (error) {
            console.log(chalk_1.default.yellow(`⚠️  Error checking model: ${error.message}`));
            return false;
        }
    }
    /**
     * Ask the user if they want to download the model
     */
    static async askToDownload(modelName) {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            rl.question(chalk_1.default.yellow('Download this model now? (y/n): '), (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'yes');
            });
        });
    }
    /**
     * Download a model using ollama pull
     */
    static async downloadModel(modelName) {
        const spinner = (0, ora_1.default)({
            text: chalk_1.default.dim(`Downloading ${modelName}... This may take several minutes`),
            color: 'yellow'
        }).start();
        try {
            // Execute ollama pull
            await execAsync(`ollama pull ${modelName}`, {
                maxBuffer: 1024 * 1024 * 100 // 100MB buffer for large output
            });
            spinner.succeed(chalk_1.default.green(`Model ${modelName} downloaded successfully`));
            return true;
        }
        catch (error) {
            spinner.fail(chalk_1.default.red(`Error downloading model: ${error.message}`));
            console.log();
            console.log(chalk_1.default.dim('You can try downloading it manually:'));
            console.log(chalk_1.default.green(`  ollama pull ${modelName}`));
            console.log();
            return false;
        }
    }
    /**
     * Get the Ollama name for a model
     */
    static getOllamaModelName(modelName) {
        return MODEL_NAME_MAP[modelName] || 'qwen2.5-coder:7b';
    }
    /**
     * List all available local models
     */
    static async listAvailableModels() {
        try {
            const { stdout } = await execAsync('ollama list');
            const lines = stdout.split('\n').slice(1); // Skip header
            return lines
                .filter(line => line.trim())
                .map(line => line.split(/\s+/)[0]); // Get model name
        }
        catch {
            return [];
        }
    }
}
exports.ModelSetup = ModelSetup;
//# sourceMappingURL=ModelSetup.js.map