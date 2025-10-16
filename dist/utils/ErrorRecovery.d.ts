/**
 * ErrorRecovery - Automatically detects and recovers from common errors
 */
interface RecoveryAction {
    detected: boolean;
    suggestion: string;
    autoFix?: {
        tool: string;
        args: any;
    };
}
export declare class ErrorRecovery {
    /**
     * Analyze an error and suggest recovery actions
     */
    static analyzeError(error: string, toolName: string, args: any): RecoveryAction;
    private static isModuleNotFoundError;
    private static isPortInUseError;
    private static isPythonNotRecognizedError;
    private static isNpmNotRecognizedError;
    private static isPermissionDeniedError;
    private static isPythonSyntaxError;
    private static isJavaScriptError;
    private static isGitError;
    private static handleModuleNotFound;
    private static handlePortInUse;
    private static handlePythonNotRecognized;
    private static handleNpmNotRecognized;
    private static handlePermissionDenied;
    private static handlePythonSyntaxError;
    private static handleJavaScriptError;
    private static handleGitError;
}
export {};
//# sourceMappingURL=ErrorRecovery.d.ts.map