export interface HardwareSpecs {
    os: string;
    cpu: {
        model: string;
        cores: number;
        threads: number;
    };
    ram: {
        total: number;
        free: number;
    };
    gpu: {
        detected: boolean;
        model: string;
        vram: number;
        vendor: 'nvidia' | 'amd' | 'intel' | 'apple' | 'unknown';
    };
}
export interface ModelRequirement {
    name: string;
    minRAM: number;
    minVRAM: number;
    minCPUCores: number;
    estimatedSpeed: 'instant' | 'fast' | 'medium' | 'slow' | 'very-slow';
    canRunOnCPU: boolean;
}
export declare class HardwareDetector {
    detect(): Promise<HardwareSpecs>;
    private getOS;
    private getCPU;
    private getRAM;
    private getGPU;
    private getGPUWindows;
    private getGPULinux;
    private getGPUMacOS;
    private detectVendor;
    static getModelRequirements(): ModelRequirement[];
    canRunModel(specs: HardwareSpecs, requirement: ModelRequirement): {
        canRun: boolean;
        reason?: string;
        performance: 'excellent' | 'good' | 'acceptable' | 'poor' | 'impossible';
    };
}
//# sourceMappingURL=HardwareDetector.d.ts.map