import * as os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface HardwareSpecs {
  os: string;
  cpu: {
    model: string;
    cores: number;
    threads: number;
  };
  ram: {
    total: number; // GB
    free: number; // GB
  };
  gpu: {
    detected: boolean;
    model: string;
    vram: number; // GB
    vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown';
  };
}

export interface ModelRequirement {
  name: string;
  minRAM: number; // GB
  minVRAM: number; // GB (0 = can run on CPU)
  minCPUCores: number;
  estimatedSpeed: 'instant' | 'fast' | 'medium' | 'slow' | 'very-slow';
  canRunOnCPU: boolean;
}

export class HardwareDetector {

  async detect(): Promise<HardwareSpecs> {
    const specs: HardwareSpecs = {
      os: this.getOS(),
      cpu: await this.getCPU(),
      ram: this.getRAM(),
      gpu: await this.getGPU()
    };

    return specs;
  }

  private getOS(): string {
    const platform = os.platform();
    const release = os.release();

    const osMap: Record<string, string> = {
      'win32': 'Windows',
      'darwin': 'macOS',
      'linux': 'Linux'
    };

    return `${osMap[platform] || platform} ${release}`;
  }

  private async getCPU() {
    const cpus = os.cpus();

    return {
      model: cpus[0].model,
      cores: os.cpus().length,
      threads: os.cpus().length // Simplificado
    };
  }

  private getRAM() {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();

    return {
      total: Math.round(totalBytes / (1024 ** 3)), // Bytes to GB
      free: Math.round(freeBytes / (1024 ** 3))
    };
  }

  private async getGPU(): Promise<HardwareSpecs['gpu']> {
    const platform = os.platform();

    try {
      if (platform === 'win32') {
        return await this.getGPUWindows();
      } else if (platform === 'linux') {
        return await this.getGPULinux();
      } else if (platform === 'darwin') {
        return await this.getGPUMacOS();
      }
    } catch (error) {
      // If detection fails, return unknown
    }

    return {
      detected: false,
      model: 'Unknown',
      vram: 0,
      vendor: 'unknown'
    };
  }

  private async getGPUWindows(): Promise<HardwareSpecs['gpu']> {
    try {
      // Try NVIDIA first
      const { stdout: nvidiaOutput } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');

      if (nvidiaOutput) {
        const lines = nvidiaOutput.trim().split('\n');
        const [name, vramMB] = lines[0].split(',').map(s => s.trim());

        return {
          detected: true,
          model: name,
          vram: Math.round(parseInt(vramMB) / 1024), // MB to GB
          vendor: 'nvidia'
        };
      }
    } catch (e) {
      // NVIDIA not found, try generic detection
    }

    try {
      // Try Windows WMIC for Intel/AMD/other GPUs
      const { stdout } = await execAsync('wmic path win32_VideoController get name,AdapterRAM');
      const lines = stdout.trim().split('\n').filter(l => l.trim());

      if (lines.length > 1) {
        // Parse the output - WMIC returns columns aligned with spaces
        const headerLine = lines[0];
        const dataLine = lines[1];

        // Find where "AdapterRAM" column starts
        const ramColumnIndex = headerLine.indexOf('AdapterRAM');

        let name = '';
        let ramBytes = 0;

        if (ramColumnIndex > 0) {
          // Extract name (everything before AdapterRAM column)
          name = dataLine.substring(0, ramColumnIndex).trim();
          // Extract RAM value (everything after AdapterRAM column start)
          const ramString = dataLine.substring(ramColumnIndex).trim();
          ramBytes = parseInt(ramString) || 0;
        } else {
          // Fallback: split by multiple spaces
          const parts = dataLine.trim().split(/\s{2,}/);
          name = parts[0] || 'Unknown GPU';
          ramBytes = parseInt(parts[1]) || 0;
        }

        // Validate ramBytes is a valid number
        if (isNaN(ramBytes) || ramBytes <= 0) {
          ramBytes = 0;
        }

        // Convert bytes to GB (only if we have a valid value)
        const vramGB = ramBytes > 0 ? Math.round(ramBytes / (1024 ** 3)) : 0;

        return {
          detected: true,
          model: name || 'Unknown GPU',
          vram: vramGB,
          vendor: this.detectVendor(name)
        };
      }
    } catch (e) {
      // Generic detection failed
    }

    return {
      detected: false,
      model: 'Unknown',
      vram: 0,
      vendor: 'unknown'
    };
  }

  private async getGPULinux(): Promise<HardwareSpecs['gpu']> {
    try {
      // Try NVIDIA on Linux
      const { stdout } = await execAsync('nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits');

      if (stdout) {
        const [name, vramMB] = stdout.trim().split(',').map(s => s.trim());

        return {
          detected: true,
          model: name,
          vram: Math.round(parseInt(vramMB) / 1024),
          vendor: 'nvidia'
        };
      }
    } catch (e) {
      // Try lspci for other GPUs
      try {
        const { stdout } = await execAsync('lspci | grep -i vga');

        if (stdout) {
          return {
            detected: true,
            model: stdout.trim(),
            vram: 0, // Can't detect VRAM easily on Linux without nvidia-smi
            vendor: this.detectVendor(stdout)
          };
        }
      } catch (e2) {
        // Detection failed
      }
    }

    return {
      detected: false,
      model: 'Unknown',
      vram: 0,
      vendor: 'unknown'
    };
  }

  private async getGPUMacOS(): Promise<HardwareSpecs['gpu']> {
    try {
      const { stdout } = await execAsync('system_profiler SPDisplaysDataType');

      // Parse macOS GPU info
      const chipsetMatch = stdout.match(/Chipset Model: (.+)/);
      const vramMatch = stdout.match(/VRAM.*: (\d+) (MB|GB)/);

      if (chipsetMatch) {
        let vram = 0;
        if (vramMatch) {
          vram = parseInt(vramMatch[1]);
          if (vramMatch[2] === 'MB') {
            vram = Math.round(vram / 1024);
          }
        }

        const model = chipsetMatch[1];

        return {
          detected: true,
          model,
          vram,
          vendor: model.includes('Apple') ? 'apple' : this.detectVendor(model)
        };
      }
    } catch (e) {
      // Detection failed
    }

    return {
      detected: false,
      model: 'Unknown',
      vram: 0,
      vendor: 'unknown'
    };
  }

  private detectVendor(gpuName: string): 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown' {
    const name = gpuName.toLowerCase();

    if (name.includes('nvidia') || name.includes('geforce') || name.includes('rtx') || name.includes('gtx')) {
      return 'nvidia';
    }
    if (name.includes('amd') || name.includes('radeon')) {
      return 'amd';
    }
    if (name.includes('intel') || name.includes('iris') || name.includes('uhd')) {
      return 'intel';
    }
    if (name.includes('apple') || name.includes('m1') || name.includes('m2') || name.includes('m3')) {
      return 'apple';
    }

    return 'unknown';
  }

  // Model requirements database
  static getModelRequirements(): ModelRequirement[] {
    return [
      // Local Models
      {
        name: 'qwen2.5-coder:1.5b',
        minRAM: 2,
        minVRAM: 0,
        minCPUCores: 2,
        estimatedSpeed: 'medium',
        canRunOnCPU: true
      },
      {
        name: 'qwen2.5-coder:7b',
        minRAM: 8,
        minVRAM: 8,
        minCPUCores: 4,
        estimatedSpeed: 'slow',
        canRunOnCPU: true
      },
      {
        name: 'qwen2.5-coder:14b',
        minRAM: 16,
        minVRAM: 16,
        minCPUCores: 8,
        estimatedSpeed: 'slow',
        canRunOnCPU: true
      },
      {
        name: 'qwen2.5-coder:32b',
        minRAM: 32,
        minVRAM: 24,
        minCPUCores: 8,
        estimatedSpeed: 'very-slow',
        canRunOnCPU: true
      },
      {
        name: 'deepseek-coder-v2:16b',
        minRAM: 16,
        minVRAM: 16,
        minCPUCores: 8,
        estimatedSpeed: 'slow',
        canRunOnCPU: true
      },
      {
        name: 'codestral:22b',
        minRAM: 24,
        minVRAM: 24,
        minCPUCores: 8,
        estimatedSpeed: 'very-slow',
        canRunOnCPU: true
      },

      // API Models (no hardware requirements)
      {
        name: 'gpt-4-turbo',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'fast',
        canRunOnCPU: true
      },
      {
        name: 'gpt-3.5-turbo',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'fast',
        canRunOnCPU: true
      },
      {
        name: 'claude-3-5-sonnet',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'fast',
        canRunOnCPU: true
      },
      {
        name: 'gemini-2.0-flash',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'instant',
        canRunOnCPU: true
      },
      {
        name: 'groq-llama-3.1-8b (recommended)',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'instant',
        canRunOnCPU: true
      },
      {
        name: 'groq-llama-3.3-70b (limited tools)',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'instant',
        canRunOnCPU: true
      },
      {
        name: 'deepseek-coder (API)',
        minRAM: 0,
        minVRAM: 0,
        minCPUCores: 0,
        estimatedSpeed: 'fast',
        canRunOnCPU: true
      }
    ];
  }

  canRunModel(specs: HardwareSpecs, requirement: ModelRequirement): {
    canRun: boolean;
    reason?: string;
    performance: 'excellent' | 'good' | 'acceptable' | 'poor' | 'impossible';
  } {
    // API models can always run
    if (requirement.minRAM === 0) {
      return { canRun: true, performance: 'excellent' };
    }

    // Check RAM
    if (specs.ram.total < requirement.minRAM) {
      return {
        canRun: false,
        reason: `Insufficient RAM (${specs.ram.total}GB < ${requirement.minRAM}GB required)`,
        performance: 'impossible'
      };
    }

    // Check if GPU available and has enough VRAM
    if (specs.gpu.detected && specs.gpu.vram > 0) {
      if (specs.gpu.vram >= requirement.minVRAM) {
        return { canRun: true, performance: 'excellent' };
      } else if (specs.gpu.vram >= requirement.minVRAM * 0.5) {
        return {
          canRun: true,
          reason: 'Low VRAM, will use CPU + GPU hybrid',
          performance: 'acceptable'
        };
      }
    }

    // No GPU or insufficient VRAM - check if can run on CPU
    if (requirement.canRunOnCPU) {
      if (specs.cpu.cores >= requirement.minCPUCores) {
        return {
          canRun: true,
          reason: 'Running on CPU (slow)',
          performance: 'poor'
        };
      } else {
        return {
          canRun: true,
          reason: `Low CPU cores (${specs.cpu.cores} < ${requirement.minCPUCores} recommended)`,
          performance: 'poor'
        };
      }
    }

    return {
      canRun: false,
      reason: 'Insufficient hardware',
      performance: 'impossible'
    };
  }
}
