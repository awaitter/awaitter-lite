import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';

const execAsync = promisify(exec);

export interface ModelSetupResult {
  ready: boolean;
  ollamaInstalled: boolean;
  modelDownloaded: boolean;
  ollamaModelName: string;
}

/**
 * Map of internal model names to Ollama names
 */
const MODEL_NAME_MAP: Record<string, string> = {
  'local': 'qwen2.5-coder:1.5b',  // Faster on CPU
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
const MODEL_INFO: Record<string, { size: string, vram: string, quality: string }> = {
  'qwen2.5-coder:1.5b': { size: '986MB', vram: '2GB (runs well on CPU)', quality: 'Basic but fast' },
  'qwen2.5-coder:7b': { size: '4.7GB', vram: '8GB GPU', quality: 'Good' },
  'qwen2.5-coder:14b': { size: '9GB', vram: '16GB GPU', quality: 'Better' },
  'qwen2.5-coder:32b': { size: '19GB', vram: '24GB GPU', quality: 'Excellent' },
  'deepseek-coder-v2:16b': { size: '8.9GB', vram: '16GB GPU', quality: 'Excellent' },
  'codestral:22b': { size: '12GB', vram: '16GB GPU', quality: 'Very good' },
};

export class ModelSetup {
  /**
   * Verifies and prepares a local model for use
   */
  static async setupLocalModel(modelName: string): Promise<ModelSetupResult> {
    const ollamaModelName = MODEL_NAME_MAP[modelName] || 'qwen2.5-coder:7b';

    console.log();
    console.log(chalk.cyan('🔧 Setting up local model:'), chalk.bold(ollamaModelName));
    console.log();

    // 1. Check if Ollama is installed
    const ollamaInstalled = await this.checkOllamaInstalled();

    if (!ollamaInstalled) {
      console.log(chalk.yellow('⚠️  Ollama is not installed'));
      console.log();
      console.log(chalk.dim('Ollama is required to run local models.'));
      console.log(chalk.dim('Download and install from:'), chalk.cyan('https://ollama.com/download'));
      console.log();
      console.log(chalk.dim('After installing, run again:'), chalk.green(`code-cli --model ${modelName}`));
      console.log();

      return {
        ready: false,
        ollamaInstalled: false,
        modelDownloaded: false,
        ollamaModelName
      };
    }

    console.log(chalk.green('✓'), 'Ollama installed');

    // 2. Check if the model is downloaded
    console.log(chalk.dim('Checking if model is downloaded...'));
    const modelDownloaded = await this.checkModelDownloaded(ollamaModelName);
    console.log(chalk.dim(`Result: ${modelDownloaded ? 'downloaded' : 'not downloaded'}`));

    if (!modelDownloaded) {
      // Show model info
      const info = MODEL_INFO[ollamaModelName];
      if (info) {
        console.log();
        console.log(chalk.dim('Model:'), chalk.bold(ollamaModelName));
        console.log(chalk.dim('Download size:'), info.size);
        console.log(chalk.dim('Required VRAM:'), info.vram);
        console.log(chalk.dim('Quality:'), info.quality);
        console.log();
      }

      // Ask if user wants to download
      const shouldDownload = await this.askToDownload(ollamaModelName);

      if (!shouldDownload) {
        console.log();
        console.log(chalk.yellow('⚠️  Download cancelled'));
        console.log(chalk.dim('You can download manually with:'), chalk.green(`ollama pull ${ollamaModelName}`));
        console.log(chalk.dim('Or use another model with:'), chalk.green('code-cli --model gpt4'));
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
      console.log(chalk.green('✓'), 'Model downloaded and ready');
      console.log();
    } else {
      console.log(chalk.green('✓'), 'Model already downloaded');
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
  private static async checkOllamaInstalled(): Promise<boolean> {
    try {
      await execAsync('ollama --version', {
        timeout: 5000 // 5 seconds timeout
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if a model is downloaded
   */
  private static async checkModelDownloaded(modelName: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ollama list', {
        timeout: 10000 // 10 seconds timeout
      });
      return stdout.includes(modelName.split(':')[0]);
    } catch (error: any) {
      console.log(chalk.yellow(`⚠️  Error checking model: ${error.message}`));
      return false;
    }
  }

  /**
   * Ask the user if they want to download the model
   */
  private static async askToDownload(modelName: string): Promise<boolean> {
    return new Promise((resolve) => {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(
        chalk.yellow('Download this model now? (y/n): '),
        (answer) => {
          rl.close();
          resolve(answer.toLowerCase() === 's' || answer.toLowerCase() === 'y' || answer.toLowerCase() === 'si' || answer.toLowerCase() === 'yes');
        }
      );
    });
  }

  /**
   * Download a model using ollama pull
   */
  private static async downloadModel(modelName: string): Promise<boolean> {
    const spinner = ora({
      text: chalk.dim(`Downloading ${modelName}... This may take several minutes`),
      color: 'yellow'
    }).start();

    try {
      // Execute ollama pull
      await execAsync(`ollama pull ${modelName}`, {
        maxBuffer: 1024 * 1024 * 100 // 100MB buffer for large output
      });

      spinner.succeed(chalk.green(`Model ${modelName} downloaded successfully`));
      return true;
    } catch (error: any) {
      spinner.fail(chalk.red(`Error downloading model: ${error.message}`));
      console.log();
      console.log(chalk.dim('You can try downloading it manually:'));
      console.log(chalk.green(`  ollama pull ${modelName}`));
      console.log();
      return false;
    }
  }

  /**
   * Get the Ollama name for a model
   */
  static getOllamaModelName(modelName: string): string {
    return MODEL_NAME_MAP[modelName] || 'qwen2.5-coder:7b';
  }

  /**
   * List all available local models
   */
  static async listAvailableModels(): Promise<string[]> {
    try {
      const { stdout } = await execAsync('ollama list');
      const lines = stdout.split('\n').slice(1); // Skip header
      return lines
        .filter(line => line.trim())
        .map(line => line.split(/\s+/)[0]); // Get model name
    } catch {
      return [];
    }
  }
}
