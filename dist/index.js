#!/usr/bin/env node
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
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const CodeCLI_1 = require("./cli/CodeCLI");
const Config_1 = require("./config/Config");
const path = __importStar(require("path"));
// Note: .env is already loaded by bin/code-cli.js
const { version } = require('../package.json');
const program = new commander_1.Command();
program
    .name('awaitter-lite')
    .description('Awaitter Lite - Multi-model AI coding assistant')
    .version(version)
    .option('-m, --model <model>', 'Model to use (local, gpt4, claude, gemini, groq, etc.)')
    .option('-d, --directory <path>', 'Working directory', process.cwd())
    .option('-c, --config <path>', 'Config file path')
    .parse(process.argv);
const options = program.opts();
async function main() {
    try {
        // Load config
        const config = new Config_1.Config(options.config);
        await config.load();
        // Get model
        const model = options.model || config.get('defaultModel', 'local');
        // Get working directory
        const workingDir = path.resolve(options.directory);
        // Print welcome
        const { Logo } = require('./utils/Logo');
        Logo.print();
        console.log(chalk_1.default.dim(`  Working directory: `) + chalk_1.default.white(workingDir));
        console.log(chalk_1.default.dim(`  Active model: `) + chalk_1.default.hex('#FF9500')(model));
        console.log();
        // Start CLI
        const cli = new CodeCLI_1.CodeCLI(config, model, workingDir);
        await cli.initialize(); // Setup model (auto-download si es necesario)
        await cli.start();
    }
    catch (error) {
        console.error(chalk_1.default.red('Error:'), error instanceof Error ? error.message : error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map