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
exports.CodeCLI = void 0;
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const Agent_1 = require("../agent/Agent");
const ModelManager_1 = require("../models/ModelManager");
const UIHelper_1 = require("../utils/UIHelper");
const HardwareDetector_1 = require("../utils/HardwareDetector");
const model_info_1 = require("../config/model-info");
const readline = __importStar(require("readline"));
class CodeCLI {
    config;
    modelName;
    workingDir;
    agent;
    modelManager;
    rl = null;
    rlPausedByUs = false;
    closeHandler = null;
    ignoreNextClose = false;
    ignoreNextLine = false;
    commandInProgress = false;
    constructor(config, modelName, workingDir) {
        this.config = config;
        this.modelName = modelName;
        this.workingDir = workingDir;
        // Initialize model manager
        this.modelManager = new ModelManager_1.ModelManager(config);
        // Initialize UI Helper
        UIHelper_1.UIHelper.initialize(workingDir, modelName);
        // Initialize agent
        this.agent = new Agent_1.Agent(config, this.modelManager, workingDir);
    }
    async initialize() {
        // Setup model (may download if necessary)
        await this.modelManager.setModel(this.modelName);
        // 🔄 Auto-load last session to restore roadmap and context
        const loaded = await this.agent.loadLastSession();
        if (loaded) {
            console.log(chalk_1.default.dim('  📋 Session restored - continuing from where you left off\n'));
        }
    }
    async start() {
        this.printWelcome();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        this.showPrompt();
        this.rl.on('line', async (line) => {
            // Skip this line if we're ignoring it (post-inquirer cleanup)
            if (this.ignoreNextLine) {
                this.ignoreNextLine = false;
                return;
            }
            const input = line.trim();
            if (!input) {
                this.showPrompt();
                return;
            }
            // Clear the status line
            this.clearStatusLine();
            // Handle commands
            if (input.startsWith('/')) {
                // Prevent simultaneous command execution
                if (this.commandInProgress) {
                    return;
                }
                this.commandInProgress = true;
                try {
                    await this.handleCommand(input);
                }
                finally {
                    this.commandInProgress = false;
                }
                console.log();
                this.showPrompt();
                return;
            }
            // Process with agent
            try {
                await this.agent.process(input);
            }
            catch (error) {
                console.log();
                console.log(chalk_1.default.red('  ✗ Error: ') + chalk_1.default.white(error instanceof Error ? error.message : String(error)));
                console.log();
            }
            this.showPrompt();
        });
        this.closeHandler = () => {
            // Ignore close events right after inquirer to prevent spurious exits
            if (this.ignoreNextClose) {
                this.ignoreNextClose = false;
                return;
            }
            console.log(chalk_1.default.blue('\n👋 Goodbye!'));
            process.exit(0);
        };
        this.rl.on('close', this.closeHandler);
    }
    showPrompt() {
        UIHelper_1.UIHelper.showInputPrompt();
        // Save cursor position, print status bar below, then restore cursor
        process.stdout.write('\x1b7'); // Save cursor position
        process.stdout.write('\n');
        UIHelper_1.UIHelper.showStatusBar();
        process.stdout.write('\x1b8'); // Restore cursor position
    }
    clearStatusLine() {
        UIHelper_1.UIHelper.clearStatus();
    }
    pauseReadlineForInquirer() {
        if (this.rl && !this.rlPausedByUs) {
            // Remove close handler to prevent inquirer from triggering exit
            if (this.closeHandler) {
                this.rl.removeListener('close', this.closeHandler);
            }
            // Close readline completely to free stdin for inquirer
            this.rl.close();
            this.rl = null;
            this.rlPausedByUs = true;
        }
    }
    async resumeReadlineAfterInquirer() {
        if (this.rlPausedByUs) {
            // Give inquirer time to fully clean up
            await new Promise(resolve => setTimeout(resolve, 100));
            // Clear any pending data in stdin buffer
            if (process.stdin.readable && process.stdin.readableLength > 0) {
                process.stdin.read();
            }
            // Recreate the readline interface
            this.rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true
            });
            // Set flags to ignore spurious events after inquirer
            this.ignoreNextClose = true;
            this.ignoreNextLine = true;
            // Re-attach line handler
            this.rl.on('line', async (line) => {
                // Skip this line if we're ignoring it (post-inquirer cleanup)
                if (this.ignoreNextLine) {
                    this.ignoreNextLine = false;
                    return;
                }
                const input = line.trim();
                if (!input) {
                    this.showPrompt();
                    return;
                }
                // Clear the status line
                this.clearStatusLine();
                // Handle commands
                if (input.startsWith('/')) {
                    // Prevent simultaneous command execution
                    if (this.commandInProgress) {
                        return;
                    }
                    this.commandInProgress = true;
                    try {
                        await this.handleCommand(input);
                    }
                    finally {
                        this.commandInProgress = false;
                    }
                    console.log();
                    this.showPrompt();
                    return;
                }
                // Process with agent
                try {
                    await this.agent.process(input);
                }
                catch (error) {
                    console.log();
                    console.log(chalk_1.default.red('  ✗ Error: ') + chalk_1.default.white(error instanceof Error ? error.message : String(error)));
                    console.log();
                }
                this.showPrompt();
            });
            // Re-add close handler
            if (this.closeHandler) {
                this.rl.on('close', this.closeHandler);
            }
            this.rlPausedByUs = false;
            // After a short delay, reset the flags if events didn't happen
            await new Promise(resolve => setTimeout(resolve, 300));
            if (this.ignoreNextClose) {
                this.ignoreNextClose = false;
            }
            if (this.ignoreNextLine) {
                this.ignoreNextLine = false;
            }
        }
    }
    printWelcome() {
        console.log(chalk_1.default.hex('#FF9500')('  ═'.repeat(40)));
        console.log();
        console.log(chalk_1.default.dim('  Available commands:'));
        console.log();
        console.log(chalk_1.default.hex('#FF9500')('  /help     ') + chalk_1.default.dim('Show help'));
        console.log(chalk_1.default.hex('#FF9500')('  /models   ') + chalk_1.default.dim('List and switch models'));
        console.log(chalk_1.default.hex('#FF9500')('  /hardware ') + chalk_1.default.dim('Analyze system hardware'));
        console.log(chalk_1.default.hex('#FF9500')('  /apikey   ') + chalk_1.default.dim('Manage API keys'));
        console.log(chalk_1.default.hex('#FF9500')('  /setup    ') + chalk_1.default.dim('Run configuration wizard'));
        console.log(chalk_1.default.hex('#FF9500')('  /context  ') + chalk_1.default.dim('Show context info'));
        console.log(chalk_1.default.hex('#FF9500')('  /sessions ') + chalk_1.default.dim('Manage auto-saved sessions'));
        console.log(chalk_1.default.hex('#FF9500')('  /clear    ') + chalk_1.default.dim('Clear conversation'));
        console.log(chalk_1.default.hex('#FF9500')('  /exit     ') + chalk_1.default.dim('Exit'));
        console.log();
        console.log(chalk_1.default.dim('  Type a message to start...'));
        console.log();
        console.log(chalk_1.default.hex('#FF9500')('  ═'.repeat(40)));
        console.log();
    }
    async handleCommand(command) {
        const parts = command.slice(1).split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        switch (cmd) {
            case 'help':
                this.showHelp();
                break;
            case 'models':
                if (args.length > 0) {
                    await this.switchModel(args[0]);
                }
                else {
                    await this.listModels();
                }
                break;
            case 'hardware':
                await this.showHardware();
                break;
            case 'apikey':
                if (args.length < 2) {
                    console.log(chalk_1.default.red('Usage: /apikey <provider> <key>'));
                    console.log(chalk_1.default.gray('Example: /apikey openai sk-...'));
                    return;
                }
                await this.setApiKey(args[0], args.slice(1).join(' '));
                break;
            case 'setup':
                await this.runSetupWizard();
                break;
            case 'context':
                this.showContext();
                break;
            case 'clear':
                this.agent.clearContext();
                console.log(chalk_1.default.green('✅ Context cleared'));
                break;
            case 'save':
                const savePath = await this.agent.saveConversation(args[0]);
                console.log(chalk_1.default.green(`✅ Conversation saved: ${savePath}`));
                break;
            case 'load':
                if (args.length === 0) {
                    console.log(chalk_1.default.red('Usage: /load <filename>'));
                    return;
                }
                await this.agent.loadConversation(args[0]);
                console.log(chalk_1.default.green(`✅ Conversation loaded: ${args[0]}`));
                break;
            case 'tools':
                this.showTools();
                break;
            case 'sessions':
                if (args.length === 0) {
                    await this.listSessions();
                }
                else if (args[0] === 'load' && args.length > 1) {
                    await this.loadSessionCommand(args[1]);
                }
                else if (args[0] === 'clear') {
                    await this.clearSessions();
                }
                else {
                    console.log(chalk_1.default.red('Usage: /sessions [load <id>|clear]'));
                }
                break;
            case 'undo':
                const count = args.length > 0 ? parseInt(args[0]) : 1;
                if (isNaN(count) || count < 1) {
                    console.log(chalk_1.default.red('Usage: /undo [count]'));
                    console.log(chalk_1.default.gray('Example: /undo 3 (undo last 3 operations)'));
                    return;
                }
                await this.undoOperations(count);
                break;
            case 'snapshots':
                await this.listSnapshots();
                break;
            case 'mode':
                if (args.length === 0) {
                    await this.showCurrentMode();
                }
                else {
                    await this.setMode(args[0]);
                }
                break;
            case 'roadmap':
                await this.showRoadmap();
                break;
            case 'exit':
            case 'quit':
                process.exit(0);
            default:
                console.log(chalk_1.default.red(`Unknown command: ${cmd}`));
                console.log(chalk_1.default.gray('Use /help to see available commands'));
        }
    }
    showHelp() {
        console.log(chalk_1.default.blue('\n' + '━'.repeat(60)));
        console.log(chalk_1.default.bold.white('  Available Commands:\n'));
        const commands = [
            ['/help', 'Show this help'],
            ['/models [name]', 'List or switch models'],
            ['/mode [name]', 'Show or set execution mode (unstoppable/sprint/step-by-step)'],
            ['/roadmap', 'Show current project roadmap'],
            ['/hardware', 'Analyze system hardware and model compatibility'],
            ['/apikey <provider> <key>', 'Set API key for a provider'],
            ['/setup', 'Run interactive setup wizard'],
            ['/context', 'Show context information'],
            ['/clear', 'Clear conversation'],
            ['/save [file]', 'Save conversation'],
            ['/load <file>', 'Load conversation'],
            ['/sessions [load|clear]', 'Manage auto-saved sessions'],
            ['/undo [n]', 'Undo last n operations (rollback changes)'],
            ['/snapshots', 'List all file snapshots'],
            ['/tools', 'List available tools'],
            ['/exit', 'Exit']
        ];
        commands.forEach(([cmd, desc]) => {
            console.log(chalk_1.default.cyan('  ' + cmd.padEnd(20)) + chalk_1.default.gray(desc));
        });
        console.log(chalk_1.default.bold.white('\n  Examples:\n'));
        console.log(chalk_1.default.dim('  > ') + chalk_1.default.white('Create a FastAPI server with authentication'));
        console.log(chalk_1.default.dim('  > ') + chalk_1.default.white('Read main.ts and explain what it does'));
        console.log(chalk_1.default.dim('  > ') + chalk_1.default.white('Find all .js files in src/ and list their exports'));
        console.log(chalk_1.default.dim('  > ') + chalk_1.default.white('Run npm test and fix any errors'));
        console.log(chalk_1.default.dim('  > ') + chalk_1.default.white('Refactor the login function to use async/await'));
        console.log(chalk_1.default.blue('\n' + '━'.repeat(60) + '\n'));
    }
    async listModels() {
        const models = this.config.get('models');
        const current = this.modelName;
        console.log(chalk_1.default.bold('\n📊 Model Benchmark & Selection\n'));
        // Build choices for inquirer
        const choices = [];
        const providerGroups = {
            'local': [],
            'openai': [],
            'anthropic': [],
            'google': [],
            'xai': [],
            'groq': [],
            'deepseek': []
        };
        // Group models
        for (const [name, config] of Object.entries(models)) {
            providerGroups[config.type].push([name, config]);
        }
        // Provider labels with icons
        const providerLabels = {
            'local': '🏠 Local Models (Ollama)',
            'openai': '🤖 OpenAI',
            'anthropic': '🧠 Anthropic (Claude)',
            'google': '🔍 Google (Gemini)',
            'xai': '⚡ xAI (Grok)',
            'groq': '🚀 Groq (Free & Ultra-Fast)',
            'deepseek': '💎 DeepSeek (Most Cost-Effective)'
        };
        // Build formatted table for each provider
        for (const [provider, modelList] of Object.entries(providerGroups)) {
            if (modelList.length === 0)
                continue;
            // Add separator
            choices.push(new inquirer_1.default.Separator(chalk_1.default.bold(`\n${providerLabels[provider]}`)));
            choices.push(new inquirer_1.default.Separator(chalk_1.default.gray('─'.repeat(120))));
            for (const [name, config] of modelList) {
                const info = (0, model_info_1.getModelInfo)(name);
                if (!info)
                    continue;
                const isCurrent = name === current;
                const hasApiKey = config.apiKey ? true : false;
                const apiKeyIcon = provider === 'local' ? '' : (hasApiKey ? chalk_1.default.green(' ✓') : chalk_1.default.red(' ✗'));
                // Build row display
                const displayName = info.displayName.padEnd(22);
                const context = `${(info.contextWindow / 1000).toFixed(0)}K`.padEnd(6);
                const speed = this.getSpeedIcon(info.speed).padEnd(10);
                const quality = this.getQualityBadge(info.quality).padEnd(15);
                const cost = info.cost.substring(0, 28).padEnd(30);
                const useCase = info.useCase.substring(0, 25);
                const row = `${isCurrent ? chalk_1.default.green('→') : ' '} ${chalk_1.default.cyan(displayName)} ${speed} ${quality} ${chalk_1.default.dim(context)} ${chalk_1.default.yellow(cost)} ${chalk_1.default.gray(useCase)}${apiKeyIcon}`;
                choices.push({
                    name: row,
                    value: name,
                    short: info.displayName
                });
            }
        }
        // Add header before showing choices
        console.log(chalk_1.default.dim('  Legend: ✓ = API key configured, ✗ = API key missing\n'));
        console.log(chalk_1.default.bold('  Model'.padEnd(24)) +
            chalk_1.default.bold('Speed'.padEnd(12)) +
            chalk_1.default.bold('Quality'.padEnd(17)) +
            chalk_1.default.bold('Context'.padEnd(8)) +
            chalk_1.default.bold('Cost'.padEnd(32)) +
            chalk_1.default.bold('Best For'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(120)));
        // Show interactive selector
        try {
            // Pause readline and remove close handler before using inquirer
            this.pauseReadlineForInquirer();
            const { selectedModel } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'selectedModel',
                    message: 'Select a model to switch:',
                    choices: choices,
                    pageSize: 20,
                    loop: false
                }
            ]);
            // Check if model needs API key and handle it here (before resuming readline)
            const selectedConfig = models[selectedModel];
            let apiKeyConfigured = true;
            let shouldPromptForApiKey = false;
            // Check if model needs API key configuration
            if (selectedConfig && selectedConfig.type !== 'local') {
                if (!selectedConfig.apiKey) {
                    // No API key configured
                    console.log(chalk_1.default.bold(`\n📋 Selected: ${(0, model_info_1.getModelInfo)(selectedModel)?.displayName || selectedModel}`));
                    console.log(chalk_1.default.yellow(`\n  ⚠️  This model requires an API key for ${selectedConfig.type}`));
                    console.log();
                    shouldPromptForApiKey = true;
                }
                else {
                    // API key exists - ask if user wants to reconfigure
                    console.log(chalk_1.default.bold(`\n📋 Selected: ${(0, model_info_1.getModelInfo)(selectedModel)?.displayName || selectedModel}`));
                    console.log(chalk_1.default.dim(`\n  ℹ️  This model has an API key configured for ${selectedConfig.type}`));
                    console.log();
                }
            }
            if (shouldPromptForApiKey || (selectedConfig && selectedConfig.type !== 'local' && selectedConfig.apiKey)) {
                // First ask if user wants to configure/reconfigure
                const message = selectedConfig.apiKey
                    ? 'Would you like to reconfigure the API key?'
                    : 'Would you like to configure the API key now?';
                const { configureNow } = await inquirer_1.default.prompt([
                    {
                        type: 'confirm',
                        name: 'configureNow',
                        message: message,
                        default: shouldPromptForApiKey // default true if no key, false if key exists
                    }
                ]);
                if (!configureNow) {
                    // User doesn't want to configure/reconfigure
                    if (!selectedConfig.apiKey) {
                        console.log(chalk_1.default.yellow('\n  Model switch cancelled. Use /apikey to configure it later.\n'));
                        apiKeyConfigured = false;
                    }
                    // If key exists and user said no, continue with existing key
                }
                else {
                    // Then ask for the API key
                    // Add a small delay and clear stdin to prevent inquirer conflicts
                    await new Promise(resolve => setTimeout(resolve, 200));
                    // Clear any remaining data in stdin
                    if (process.stdin.readable && process.stdin.readableLength > 0) {
                        process.stdin.read();
                    }
                    let apiKey;
                    try {
                        const result = await inquirer_1.default.prompt([
                            {
                                type: 'password',
                                name: 'apiKey',
                                message: `Enter your ${selectedConfig.type} API key:`,
                                mask: '*',
                                validate: (input) => {
                                    if (!input || !input.trim()) {
                                        return 'API key cannot be empty';
                                    }
                                    return true;
                                }
                            }
                        ]);
                        apiKey = result.apiKey;
                    }
                    catch (error) {
                        console.log(chalk_1.default.yellow('\n  Could not prompt for API key. Use /apikey to configure it later.\n'));
                        apiKeyConfigured = false;
                    }
                    if (!apiKey) {
                        console.log(chalk_1.default.yellow('\n  No API key provided. Use /apikey to configure it later.\n'));
                        apiKeyConfigured = false;
                    }
                    else {
                        // Save the API key
                        const allModels = this.config.get('models');
                        let updated = 0;
                        for (const [name, config] of Object.entries(allModels)) {
                            if (config.type === selectedConfig.type) {
                                config.apiKey = apiKey.trim();
                                updated++;
                            }
                        }
                        this.config.set('models', allModels);
                        console.log(chalk_1.default.green(`\n  ✓ API key saved for ${selectedConfig.type} (${updated} models updated)`));
                    }
                }
            }
            // Resume readline before switching model
            await this.resumeReadlineAfterInquirer();
            // Now switch to the model (if API key was configured or not needed)
            if (apiKeyConfigured) {
                await this.switchToModelInteractive(selectedModel);
            }
        }
        catch (error) {
            // User cancelled (Ctrl+C)
            console.log(chalk_1.default.yellow('\n  Model selection cancelled\n'));
            await this.resumeReadlineAfterInquirer();
        }
    }
    getSpeedIcon(speed) {
        const icons = {
            'instant': chalk_1.default.green('⚡ Instant'),
            'very-fast': chalk_1.default.green('🚀 V.Fast'),
            'fast': chalk_1.default.green('💨 Fast'),
            'medium': chalk_1.default.yellow('⏱️  Medium'),
            'slow': chalk_1.default.red('🐢 Slow')
        };
        return icons[speed] || speed;
    }
    getQualityBadge(quality) {
        const badges = {
            'excellent': chalk_1.default.green('⭐⭐⭐⭐⭐'),
            'very-good': chalk_1.default.green('⭐⭐⭐⭐'),
            'good': chalk_1.default.yellow('⭐⭐⭐'),
            'fair': chalk_1.default.yellow('⭐⭐')
        };
        return badges[quality] || quality;
    }
    async switchToModelInteractive(modelName) {
        const modelConfig = this.config.get('models')[modelName];
        if (!modelConfig) {
            console.log(chalk_1.default.red(`\n  ✗ Model not found: ${modelName}\n`));
            return;
        }
        const info = (0, model_info_1.getModelInfo)(modelName);
        // Only show header if not already shown
        if (modelConfig.type === 'local' || modelConfig.apiKey) {
            console.log(chalk_1.default.bold(`\n📋 Selected: ${info?.displayName || modelName}`));
        }
        // Show model details
        if (info) {
            console.log(chalk_1.default.dim('\n  Model Details:'));
            console.log(chalk_1.default.gray('  ─'.repeat(60)));
            console.log(`  ${chalk_1.default.cyan('Provider:')}       ${info.provider}`);
            console.log(`  ${chalk_1.default.cyan('Context Window:')} ${info.contextWindow.toLocaleString()} tokens`);
            console.log(`  ${chalk_1.default.cyan('Speed:')}          ${info.speed}`);
            console.log(`  ${chalk_1.default.cyan('Quality:')}        ${info.quality}`);
            console.log(`  ${chalk_1.default.cyan('Cost:')}           ${info.cost}`);
            console.log(`  ${chalk_1.default.cyan('Rate Limit:')}     ${info.rateLimit}`);
            console.log(`  ${chalk_1.default.cyan('Best For:')}       ${info.useCase}`);
            if (info.notes) {
                console.log(`  ${chalk_1.default.cyan('Notes:')}          ${chalk_1.default.dim(info.notes)}`);
            }
            console.log(chalk_1.default.gray('  ─'.repeat(60)));
        }
        // Switch model
        try {
            await this.modelManager.setModel(modelName);
            this.modelName = modelName;
            this.config.set('defaultModel', modelName);
            // Notify agent of model switch to preserve context
            this.agent.notifyModelSwitch(modelName);
            console.log(chalk_1.default.green(`\n  ✅ Successfully switched to: ${info?.displayName || modelName}`));
            console.log(chalk_1.default.dim('  Context and roadmap preserved. You can continue from where you left off.\n'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`\n  ✗ Error switching model: ${error instanceof Error ? error.message : error}\n`));
        }
    }
    async switchModel(modelName) {
        try {
            await this.modelManager.setModel(modelName);
            this.modelName = modelName;
            this.config.set('defaultModel', modelName);
            // Notify agent of model switch to preserve context
            this.agent.notifyModelSwitch(modelName);
            console.log(chalk_1.default.green(`\n  ✅ Switched to model: ${modelName}`));
            console.log(chalk_1.default.dim('  Context and roadmap preserved. You can continue from where you left off.\n'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`\n  ❌ Error switching model: ${error instanceof Error ? error.message : error}\n`));
        }
    }
    showContext() {
        const info = this.agent.getContextInfo();
        console.log(chalk_1.default.bold('\n📊 Context Information:\n'));
        for (const [key, value] of Object.entries(info)) {
            console.log(`  ${chalk_1.default.gray(key + ':')} ${value}`);
        }
        console.log();
    }
    showTools() {
        const tools = this.agent.getAvailableTools();
        console.log(chalk_1.default.bold('\n🛠️  Available Tools:\n'));
        for (const tool of tools) {
            console.log(`  ${chalk_1.default.cyan('•')} ${chalk_1.default.bold(tool.name)}: ${chalk_1.default.gray(tool.description)}`);
        }
        console.log();
    }
    async showHardware() {
        const detector = new HardwareDetector_1.HardwareDetector();
        console.log(chalk_1.default.bold('\n🖥️  Hardware Analysis\n'));
        console.log(chalk_1.default.dim('  Detecting system specifications...'));
        try {
            const specs = await detector.detect();
            const requirements = HardwareDetector_1.HardwareDetector.getModelRequirements();
            // Display hardware specs
            console.log(chalk_1.default.bold('\n  System Specifications:'));
            console.log(chalk_1.default.gray('  ─'.repeat(40)));
            console.log(`  ${chalk_1.default.cyan('OS:')}        ${specs.os}`);
            console.log(`  ${chalk_1.default.cyan('CPU:')}       ${specs.cpu.model}`);
            console.log(`  ${chalk_1.default.cyan('Cores:')}     ${specs.cpu.cores} cores`);
            console.log(`  ${chalk_1.default.cyan('RAM:')}       ${specs.ram.total} GB (${specs.ram.free} GB free)`);
            if (specs.gpu.detected) {
                console.log(`  ${chalk_1.default.cyan('GPU:')}       ${specs.gpu.model}`);
                const vramDisplay = specs.gpu.vram > 0 ? `${specs.gpu.vram} GB` : chalk_1.default.dim('Unknown');
                console.log(`  ${chalk_1.default.cyan('VRAM:')}      ${vramDisplay}`);
                console.log(`  ${chalk_1.default.cyan('Vendor:')}    ${specs.gpu.vendor}`);
            }
            else {
                console.log(`  ${chalk_1.default.cyan('GPU:')}       ${chalk_1.default.yellow('Not detected')}`);
            }
            // Display model compatibility table
            console.log(chalk_1.default.bold('\n  Model Compatibility:'));
            console.log(chalk_1.default.gray('  ' + '─'.repeat(60)));
            // Table header
            const header = `  ${chalk_1.default.bold('Model').padEnd(35)} ${chalk_1.default.bold('Status').padEnd(15)} ${chalk_1.default.bold('Performance').padEnd(15)} ${chalk_1.default.bold('Notes')}`;
            console.log(header);
            console.log(chalk_1.default.gray('  ' + '─'.repeat(60)));
            // Group models by type
            const localModels = requirements.filter(r => r.minRAM > 0);
            const apiModels = requirements.filter(r => r.minRAM === 0);
            // Local models
            console.log(chalk_1.default.bold('\n  Local Models (Ollama):'));
            for (const req of localModels) {
                const result = detector.canRunModel(specs, req);
                const status = this.getStatusIcon(result.canRun, result.performance);
                const perfDisplay = this.getPerformanceDisplay(result.performance);
                const notes = result.reason || '';
                console.log(`  ${req.name.padEnd(35)} ${status.padEnd(15)} ${perfDisplay.padEnd(15)} ${chalk_1.default.dim(notes)}`);
            }
            // API models
            console.log(chalk_1.default.bold('\n  API Models (Cloud):'));
            for (const req of apiModels) {
                const result = detector.canRunModel(specs, req);
                const status = this.getStatusIcon(result.canRun, result.performance);
                const perfDisplay = this.getPerformanceDisplay(result.performance);
                console.log(`  ${req.name.padEnd(35)} ${status.padEnd(15)} ${perfDisplay.padEnd(15)} ${chalk_1.default.dim('Requires API key')}`);
            }
            console.log(chalk_1.default.gray('\n  ' + '─'.repeat(60)));
            console.log(chalk_1.default.dim('\n  💡 Tip: Use /models to switch between available models'));
            console.log(chalk_1.default.dim('  💡 Tip: Use /apikey to configure API keys for cloud models\n'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`\n  ✗ Error detecting hardware: ${error instanceof Error ? error.message : error}\n`));
        }
    }
    getStatusIcon(canRun, performance) {
        if (!canRun)
            return chalk_1.default.red('✗ Cannot run');
        switch (performance) {
            case 'excellent':
                return chalk_1.default.green('✓ Excellent');
            case 'good':
                return chalk_1.default.green('✓ Good');
            case 'acceptable':
                return chalk_1.default.yellow('⚠ Acceptable');
            case 'poor':
                return chalk_1.default.yellow('⚠ Poor');
            default:
                return chalk_1.default.red('✗ Impossible');
        }
    }
    getPerformanceDisplay(performance) {
        switch (performance) {
            case 'excellent':
                return chalk_1.default.green('⚡ Instant');
            case 'good':
                return chalk_1.default.green('🚀 Fast');
            case 'acceptable':
                return chalk_1.default.yellow('🐢 Slow');
            case 'poor':
                return chalk_1.default.yellow('🐌 Very Slow');
            default:
                return chalk_1.default.red('❌ N/A');
        }
    }
    async setApiKey(provider, key) {
        const providerLower = provider.toLowerCase();
        // Map provider names to config keys
        const providerMap = {
            'openai': 'openai',
            'anthropic': 'anthropic',
            'claude': 'anthropic',
            'google': 'google',
            'gemini': 'google',
            'xai': 'xai',
            'grok': 'xai',
            'groq': 'groq',
            'deepseek': 'deepseek'
        };
        const providerType = providerMap[providerLower];
        if (!providerType) {
            console.log(chalk_1.default.red(`\n  ✗ Unknown provider: ${provider}`));
            console.log(chalk_1.default.dim('  Available providers: openai, anthropic, google, xai, groq, deepseek\n'));
            return;
        }
        try {
            // Get all models
            const models = this.config.get('models');
            // Update API key for all models of this provider type
            let updated = 0;
            for (const [modelName, modelConfig] of Object.entries(models)) {
                if (modelConfig.type === providerType) {
                    modelConfig.apiKey = key;
                    updated++;
                }
            }
            // Save updated models
            this.config.set('models', models);
            console.log(chalk_1.default.green(`\n  ✅ API key set for ${providerType} (${updated} models updated)`));
            console.log(chalk_1.default.dim(`  You can now use ${providerType} models with /models\n`));
        }
        catch (error) {
            console.log(chalk_1.default.red(`\n  ✗ Error setting API key: ${error instanceof Error ? error.message : error}\n`));
        }
    }
    async runSetupWizard() {
        console.log(chalk_1.default.bold('\n🚀 Welcome to Code CLI Setup Wizard\n'));
        console.log(chalk_1.default.dim('  This wizard will help you configure your CLI for optimal performance.\n'));
        // Pause readline and remove close handler before using inquirer
        this.pauseReadlineForInquirer();
        try {
            // Step 1: Ask about use case
            const { useCase } = await inquirer_1.default.prompt([
                {
                    type: 'list',
                    name: 'useCase',
                    message: 'What will you primarily use this CLI for?',
                    choices: [
                        { name: '🎨 Hobby projects and learning', value: 'hobby' },
                        { name: '💼 Professional development', value: 'professional' },
                        { name: '🚀 Production applications', value: 'production' }
                    ]
                }
            ]);
            console.log(chalk_1.default.dim('\n  Analyzing your system hardware...\n'));
            // Step 2: Detect hardware
            const detector = new HardwareDetector_1.HardwareDetector();
            const specs = await detector.detect();
            console.log(chalk_1.default.green('  ✓ Hardware detected'));
            console.log(chalk_1.default.gray(`    CPU: ${specs.cpu.model}`));
            console.log(chalk_1.default.gray(`    RAM: ${specs.ram.total} GB`));
            if (specs.gpu.detected) {
                const vramDisplay = specs.gpu.vram > 0 ? `${specs.gpu.vram} GB` : 'Unknown';
                console.log(chalk_1.default.gray(`    GPU: ${specs.gpu.model} (${vramDisplay})`));
            }
            // Step 3: Recommend models based on use case and hardware
            const recommendations = this.getModelRecommendations(useCase, specs, detector);
            console.log(chalk_1.default.bold('\n  📊 Recommended Models:\n'));
            for (const rec of recommendations) {
                const icon = rec.priority === 'primary' ? '🌟' : '✨';
                console.log(`  ${icon} ${chalk_1.default.cyan(rec.name)} - ${rec.reason}`);
            }
            // Step 4: Ask for API keys for recommended cloud models
            console.log(chalk_1.default.bold('\n  🔑 API Key Configuration\n'));
            const neededProviders = new Set();
            for (const rec of recommendations) {
                const modelConfig = this.config.get('models')[rec.name];
                if (modelConfig && modelConfig.type !== 'local') {
                    neededProviders.add(modelConfig.type);
                }
            }
            if (neededProviders.size > 0) {
                console.log(chalk_1.default.dim('  You can configure API keys now or skip and add them later with /apikey\n'));
                for (const provider of neededProviders) {
                    try {
                        const { configureNow } = await inquirer_1.default.prompt([
                            {
                                type: 'confirm',
                                name: 'configureNow',
                                message: `Configure ${provider} API key now?`,
                                default: false
                            }
                        ]);
                        if (configureNow) {
                            const { apiKey } = await inquirer_1.default.prompt([
                                {
                                    type: 'password',
                                    name: 'apiKey',
                                    message: `Enter your ${provider} API key:`,
                                    mask: '*'
                                }
                            ]);
                            if (apiKey && apiKey.trim()) {
                                // Don't print the full output, just confirm
                                const models = this.config.get('models');
                                let updated = 0;
                                for (const [modelName, modelConfig] of Object.entries(models)) {
                                    if (modelConfig.type === provider) {
                                        modelConfig.apiKey = apiKey.trim();
                                        updated++;
                                    }
                                }
                                this.config.set('models', models);
                                console.log(chalk_1.default.green(`  ✓ ${provider} API key configured (${updated} models)`));
                            }
                        }
                    }
                    catch (err) {
                        // If user cancels (Ctrl+C), continue with setup
                        console.log(chalk_1.default.yellow('\n  Skipped API key configuration'));
                    }
                }
            }
            else {
                console.log(chalk_1.default.dim('  No API keys needed for your recommended models.\n'));
            }
            // Step 5: Set default model
            const primaryRec = recommendations.find(r => r.priority === 'primary');
            if (primaryRec) {
                this.config.set('defaultModel', primaryRec.name);
                console.log(chalk_1.default.green(`\n  ✓ Default model set to: ${primaryRec.name}`));
            }
            console.log(chalk_1.default.bold.green('\n  ✅ Setup complete!\n'));
            console.log(chalk_1.default.dim('  You can now start using Code CLI. Type a message to begin.'));
            console.log(chalk_1.default.dim('  Use /help to see all available commands.\n'));
        }
        catch (error) {
            console.log(chalk_1.default.red(`\n  ✗ Setup error: ${error instanceof Error ? error.message : error}\n`));
        }
        finally {
            // Resume readline and restore close handler after inquirer
            await this.resumeReadlineAfterInquirer();
        }
    }
    getModelRecommendations(useCase, specs, detector) {
        const requirements = HardwareDetector_1.HardwareDetector.getModelRequirements();
        const recommendations = [];
        // Map model requirements to model config names
        const modelMap = {
            'gpt-4-turbo': 'gpt4',
            'gpt-3.5-turbo': 'gpt35',
            'claude-3-5-sonnet': 'claude',
            'gemini-2.0-flash': 'gemini',
            'groq-llama-3.3-70b': 'groq',
            'deepseek-coder (API)': 'deepseek-api',
            'qwen2.5-coder:1.5b': 'qwen-1.5b',
            'qwen2.5-coder:7b': 'qwen-7b',
            'qwen2.5-coder:14b': 'qwen-14b',
            'qwen2.5-coder:32b': 'qwen-32b',
            'deepseek-coder-v2:16b': 'deepseek',
            'codestral:22b': 'codestral'
        };
        if (useCase === 'hobby') {
            // Free options first
            recommendations.push({
                name: 'groq-fast',
                priority: 'primary',
                reason: 'Free, ultra-fast API model (6000 requests/day)'
            });
            // Check for local models
            const qwen15 = requirements.find(r => r.name === 'qwen2.5-coder:1.5b');
            if (qwen15) {
                const result = detector.canRunModel(specs, qwen15);
                if (result.canRun) {
                    recommendations.push({
                        name: 'qwen-1.5b',
                        priority: 'secondary',
                        reason: 'Free local model, works offline'
                    });
                }
            }
            recommendations.push({
                name: 'gemini',
                priority: 'secondary',
                reason: 'Free API with 50 requests/day limit'
            });
        }
        else if (useCase === 'professional') {
            // Best paid option
            recommendations.push({
                name: 'gpt4',
                priority: 'primary',
                reason: 'Best quality, reliable, ~$30-50/month'
            });
            // Fast free alternative
            recommendations.push({
                name: 'groq-fast',
                priority: 'secondary',
                reason: 'Free ultra-fast alternative for simple tasks'
            });
            // Check for powerful local models
            const qwen32 = requirements.find(r => r.name === 'qwen2.5-coder:32b');
            if (qwen32) {
                const result = detector.canRunModel(specs, qwen32);
                if (result.canRun && result.performance !== 'impossible') {
                    recommendations.push({
                        name: 'qwen-32b',
                        priority: 'secondary',
                        reason: 'Powerful local model for offline work'
                    });
                }
            }
        }
        else if (useCase === 'production') {
            // Most reliable options
            recommendations.push({
                name: 'claude',
                priority: 'primary',
                reason: 'Most reliable and accurate, best for production'
            });
            recommendations.push({
                name: 'gpt4',
                priority: 'secondary',
                reason: 'Excellent alternative with proven reliability'
            });
            recommendations.push({
                name: 'deepseek-api',
                priority: 'secondary',
                reason: 'Cost-effective option ($0.14 per 1M tokens)'
            });
        }
        return recommendations;
    }
    async listSessions() {
        const sessionManager = this.agent.getSessionManager();
        const sessions = await sessionManager.listSessions();
        if (sessions.length === 0) {
            console.log(chalk_1.default.yellow('\n  No saved sessions found.\n'));
            console.log(chalk_1.default.dim('  Sessions are auto-saved every 5 messages.'));
            console.log(chalk_1.default.dim('  You can also manually save with /save\n'));
            return;
        }
        console.log(chalk_1.default.bold('\n📚 Saved Sessions\n'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
        console.log(chalk_1.default.bold('  ID'.padEnd(28)) +
            chalk_1.default.bold('Date'.padEnd(22)) +
            chalk_1.default.bold('Model'.padEnd(20)) +
            chalk_1.default.bold('Messages'.padEnd(12)) +
            chalk_1.default.bold('Directory'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
        for (const session of sessions) {
            const id = session.id.padEnd(26);
            const date = new Date(session.lastActivity).toLocaleString().padEnd(20);
            const model = session.model.padEnd(18);
            const messageCount = session.messageCount.toString().padEnd(10);
            const workingDir = session.workingDir.length > 30
                ? '...' + session.workingDir.slice(-27)
                : session.workingDir;
            console.log(`  ${chalk_1.default.cyan(id)} ${chalk_1.default.dim(date)} ${chalk_1.default.yellow(model)} ${chalk_1.default.white(messageCount)} ${chalk_1.default.gray(workingDir)}`);
        }
        console.log(chalk_1.default.gray('\n  ' + '─'.repeat(100)));
        console.log(chalk_1.default.dim('\n  Use /sessions load <id> to load a session'));
        console.log(chalk_1.default.dim('  Use /sessions clear to delete all sessions\n'));
    }
    async loadSessionCommand(sessionId) {
        const success = await this.agent.loadSession(sessionId);
        if (success) {
            console.log(chalk_1.default.green(`\n  ✅ Session loaded: ${sessionId}`));
            console.log(chalk_1.default.dim('  Conversation history restored. Continue from where you left off.\n'));
        }
        else {
            console.log(chalk_1.default.red(`\n  ✗ Session not found: ${sessionId}`));
            console.log(chalk_1.default.dim('  Use /sessions to see available sessions\n'));
        }
    }
    async clearSessions() {
        // Pause readline and remove close handler before using inquirer
        this.pauseReadlineForInquirer();
        try {
            const { confirm } = await inquirer_1.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Are you sure you want to delete all saved sessions?',
                    default: false
                }
            ]);
            if (confirm) {
                const sessionManager = this.agent.getSessionManager();
                const count = await sessionManager.clearAllSessions();
                console.log(chalk_1.default.green(`\n  ✅ Cleared ${count} session(s)\n`));
            }
            else {
                console.log(chalk_1.default.yellow('\n  Cancelled\n'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.yellow('\n  Cancelled\n'));
        }
        finally {
            // Resume readline and restore close handler after inquirer
            await this.resumeReadlineAfterInquirer();
        }
    }
    async undoOperations(count) {
        const result = await this.agent.undoOperations(count);
        if (result.success) {
            console.log(chalk_1.default.green(`\n  ✅ ${result.message}`));
            console.log(chalk_1.default.dim(`  Files restored: ${result.filesRestored.length}`));
            if (result.filesRestored.length > 0) {
                console.log(chalk_1.default.cyan('\n  Restored files:'));
                result.filesRestored.forEach(file => {
                    console.log(chalk_1.default.gray(`    - ${file}`));
                });
            }
            console.log();
        }
        else {
            console.log(chalk_1.default.red(`\n  ✗ ${result.message}\n`));
        }
    }
    async listSnapshots() {
        const snapshotManager = this.agent.getSnapshotManager();
        const snapshots = snapshotManager.getSnapshots();
        if (snapshots.length === 0) {
            console.log(chalk_1.default.yellow('\n  No snapshots available.\n'));
            console.log(chalk_1.default.dim('  Snapshots are created automatically before file modifications.'));
            console.log(chalk_1.default.dim('  Use /undo to rollback changes.\n'));
            return;
        }
        console.log(chalk_1.default.bold('\n📸 File Snapshots (Undo History)\n'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
        console.log(chalk_1.default.bold('  #'.padEnd(5)) +
            chalk_1.default.bold('Time'.padEnd(22)) +
            chalk_1.default.bold('Operation'.padEnd(15)) +
            chalk_1.default.bold('Files'.padEnd(10)) +
            chalk_1.default.bold('Description'));
        console.log(chalk_1.default.gray('  ' + '─'.repeat(100)));
        snapshots.forEach((snapshot, index) => {
            const num = (index + 1).toString().padEnd(3);
            const time = new Date(snapshot.timestamp).toLocaleString().padEnd(20);
            const operation = snapshot.operation.padEnd(13);
            const fileCount = snapshot.fileCount.toString().padEnd(8);
            const description = snapshot.description.length > 50
                ? snapshot.description.substring(0, 47) + '...'
                : snapshot.description;
            console.log(`  ${chalk_1.default.cyan(num)} ${chalk_1.default.dim(time)} ${chalk_1.default.yellow(operation)} ${chalk_1.default.white(fileCount)} ${chalk_1.default.gray(description)}`);
        });
        console.log(chalk_1.default.gray('\n  ' + '─'.repeat(100)));
        console.log(chalk_1.default.dim('\n  Use /undo [n] to rollback last n operations'));
        console.log(chalk_1.default.dim(`  Example: /undo 3 (rollback last 3 changes)\n`));
    }
    async showCurrentMode() {
        const mode = this.agent.getExecutionMode();
        console.log(chalk_1.default.bold('\n🎚️  Execution Mode\n'));
        const modes = [
            {
                name: 'unstoppable',
                icon: '⚡',
                description: 'Execute all tasks automatically without stopping',
                ideal: 'Fast prototyping, simple projects'
            },
            {
                name: 'sprint',
                icon: '🏃',
                description: 'Execute one sprint at a time, pause between sprints',
                ideal: 'Balanced control, medium projects'
            },
            {
                name: 'step-by-step',
                icon: '👣',
                description: 'Execute one task at a time, pause after each',
                ideal: 'Learning, complex projects, debugging'
            }
        ];
        for (const m of modes) {
            const isCurrent = m.name === mode;
            const indicator = isCurrent ? chalk_1.default.green('→ ACTIVE') : '  ';
            console.log(`${indicator} ${m.icon} ${chalk_1.default.bold(m.name)}`);
            console.log(chalk_1.default.dim(`     ${m.description}`));
            console.log(chalk_1.default.gray(`     Best for: ${m.ideal}`));
            console.log();
        }
        console.log(chalk_1.default.dim('Use /mode <name> to switch modes'));
        console.log(chalk_1.default.dim('Example: /mode unstoppable\n'));
    }
    async setMode(mode) {
        const validModes = ['unstoppable', 'sprint', 'step-by-step'];
        if (!validModes.includes(mode)) {
            console.log(chalk_1.default.red(`\n  ✗ Invalid mode: ${mode}`));
            console.log(chalk_1.default.dim('  Valid modes: unstoppable, sprint, step-by-step\n'));
            return;
        }
        const icons = {
            'unstoppable': '⚡',
            'sprint': '🏃',
            'step-by-step': '👣'
        };
        // Check if there's an active roadmap
        const hasRoadmap = this.agent.getRoadmap() !== undefined;
        // Notify agent of mode switch (reinitializes system prompt)
        this.agent.notifyModeSwitch(mode);
        console.log(chalk_1.default.green(`\n  ✅ Execution mode set to: ${icons[mode]} ${mode}`));
        if (hasRoadmap) {
            console.log(chalk_1.default.dim('  Mode changed immediately. Current roadmap preserved.'));
            console.log(chalk_1.default.dim('  Type "continua" to continue with the new mode.\n'));
        }
        else {
            console.log(chalk_1.default.dim('  This will take effect on the next complex task\n'));
        }
    }
    async showRoadmap() {
        const roadmap = this.agent.getRoadmap();
        if (!roadmap) {
            console.log(chalk_1.default.yellow('\n  No active roadmap.\n'));
            console.log(chalk_1.default.dim('  Roadmaps are generated automatically for complex tasks like:'));
            console.log(chalk_1.default.dim('  - "Create a complete app"'));
            console.log(chalk_1.default.dim('  - "Refactor entire codebase"'));
            console.log(chalk_1.default.dim('  - "Implement multiple features"\n'));
            return;
        }
        const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
        const { UIHelper } = require('../utils/UIHelper');
        const progress = RoadmapPlanner.calculateProgress(roadmap);
        UIHelper.showRoadmap(roadmap, progress);
    }
}
exports.CodeCLI = CodeCLI;
//# sourceMappingURL=CodeCLI.js.map