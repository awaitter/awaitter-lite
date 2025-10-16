#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { CodeCLI } from './cli/CodeCLI';
import { Config } from './config/Config';
import * as path from 'path';

// Note: .env is already loaded by bin/code-cli.js

const { version } = require('../package.json');
const program = new Command();

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
    const config = new Config(options.config);
    await config.load();

    // Get model
    const model = options.model || config.get('defaultModel', 'local');

    // Get working directory
    const workingDir = path.resolve(options.directory);

    // Print welcome
    const { Logo } = require('./utils/Logo');
    Logo.print();
    console.log(chalk.dim(`  Working directory: `) + chalk.white(workingDir));
    console.log(chalk.dim(`  Active model: `) + chalk.hex('#FF9500')(model));
    console.log();

    // Start CLI
    const cli = new CodeCLI(config, model, workingDir);
    await cli.initialize(); // Setup model (auto-download si es necesario)
    await cli.start();

  } catch (error) {
    console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();
