"use strict";
/**
 * ErrorRecovery - Automatically detects and recovers from common errors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorRecovery = void 0;
class ErrorRecovery {
    /**
     * Analyze an error and suggest recovery actions
     */
    static analyzeError(error, toolName, args) {
        const errorLower = error.toLowerCase();
        // Module not found errors
        if (this.isModuleNotFoundError(errorLower)) {
            return this.handleModuleNotFound(error, args);
        }
        // Port already in use
        if (this.isPortInUseError(errorLower)) {
            return this.handlePortInUse(error);
        }
        // Python/pip not recognized
        if (this.isPythonNotRecognizedError(errorLower)) {
            return this.handlePythonNotRecognized(error, args);
        }
        // npm not recognized
        if (this.isNpmNotRecognizedError(errorLower)) {
            return this.handleNpmNotRecognized(error);
        }
        // Permission denied
        if (this.isPermissionDeniedError(errorLower)) {
            return this.handlePermissionDenied(error, args);
        }
        // Syntax errors (Python)
        if (this.isPythonSyntaxError(errorLower)) {
            return this.handlePythonSyntaxError(error);
        }
        // TypeScript/JavaScript errors
        if (this.isJavaScriptError(errorLower)) {
            return this.handleJavaScriptError(error);
        }
        // Git errors
        if (this.isGitError(errorLower)) {
            return this.handleGitError(error);
        }
        // No automatic recovery available
        return {
            detected: false,
            suggestion: ''
        };
    }
    // Detection methods
    static isModuleNotFoundError(error) {
        return error.includes('cannot find module') ||
            error.includes('module not found') ||
            error.includes('error: cannot find package') ||
            error.includes('no module named');
    }
    static isPortInUseError(error) {
        return error.includes('port') && error.includes('already in use') ||
            error.includes('eaddrinuse') ||
            error.includes('address already in use');
    }
    static isPythonNotRecognizedError(error) {
        return (error.includes('python') || error.includes('pip')) &&
            (error.includes('not recognized') || error.includes('not found') || error.includes('command not found'));
    }
    static isNpmNotRecognizedError(error) {
        return error.includes('npm') &&
            (error.includes('not recognized') || error.includes('not found') || error.includes('command not found'));
    }
    static isPermissionDeniedError(error) {
        return error.includes('permission denied') ||
            error.includes('eacces') ||
            error.includes('access is denied');
    }
    static isPythonSyntaxError(error) {
        return error.includes('syntaxerror:') ||
            error.includes('indentationerror:') ||
            error.includes('invalid syntax');
    }
    static isJavaScriptError(error) {
        return error.includes('syntaxerror') ||
            error.includes('referenceerror') ||
            error.includes('typeerror') ||
            error.includes('unexpected token');
    }
    static isGitError(error) {
        return error.includes('not a git repository') ||
            error.includes('failed to push') ||
            error.includes('merge conflict');
    }
    // Recovery handlers
    static handleModuleNotFound(error, args) {
        // Extract package name if possible
        const packageMatch = error.match(/cannot find (?:module|package) ['"]([^'"]+)['"]/i) ||
            error.match(/no module named ['"]?([^'"\\s]+)['"]?/i);
        if (packageMatch) {
            const packageName = packageMatch[1];
            // Determine if it's npm or pip
            if (error.includes('python') || error.includes('pip') || error.includes('.py')) {
                return {
                    detected: true,
                    suggestion: `Missing Python package: ${packageName}. Installing automatically...`,
                    autoFix: {
                        tool: 'bash',
                        args: { command: `python -m pip install ${packageName}` }
                    }
                };
            }
            else {
                return {
                    detected: true,
                    suggestion: `Missing Node.js module: ${packageName}. Installing automatically...`,
                    autoFix: {
                        tool: 'bash',
                        args: { command: `npm install ${packageName}` }
                    }
                };
            }
        }
        // Generic case - install all dependencies
        if (error.includes('python') || error.includes('.py')) {
            return {
                detected: true,
                suggestion: 'Python dependencies missing. Installing from requirements.txt...',
                autoFix: {
                    tool: 'bash',
                    args: { command: 'python -m pip install -r requirements.txt' }
                }
            };
        }
        else {
            return {
                detected: true,
                suggestion: 'Node.js dependencies missing. Running npm install...',
                autoFix: {
                    tool: 'bash',
                    args: { command: 'npm install' }
                }
            };
        }
    }
    static handlePortInUse(error) {
        // Extract port number
        const portMatch = error.match(/port (\d+)/i) ||
            error.match(/:(\d+)/);
        const port = portMatch ? portMatch[1] : 'unknown';
        return {
            detected: true,
            suggestion: `Port ${port} is already in use. Options:\n` +
                `  1. Kill the process using: netstat -ano | findstr :${port}\n` +
                `  2. Use a different port\n` +
                `  3. Stop the conflicting application`
        };
    }
    static handlePythonNotRecognized(error, args) {
        const command = args.command || '';
        // Try alternative Python commands
        if (command.startsWith('python ')) {
            return {
                detected: true,
                suggestion: 'Python command not found. Trying alternative: python3...',
                autoFix: {
                    tool: 'bash',
                    args: { command: command.replace('python ', 'python3 ') }
                }
            };
        }
        else if (command.startsWith('pip ')) {
            return {
                detected: true,
                suggestion: 'pip command not found. Trying alternative: python -m pip...',
                autoFix: {
                    tool: 'bash',
                    args: { command: command.replace('pip ', 'python -m pip ') }
                }
            };
        }
        return {
            detected: true,
            suggestion: 'Python is not installed or not in PATH. Install Python from python.org'
        };
    }
    static handleNpmNotRecognized(error) {
        return {
            detected: true,
            suggestion: 'npm is not installed or not in PATH. Install Node.js from nodejs.org'
        };
    }
    static handlePermissionDenied(error, args) {
        const command = args.command || '';
        if (command.includes('npm install') && !command.includes('--force')) {
            return {
                detected: true,
                suggestion: 'Permission denied. Trying with --force flag...',
                autoFix: {
                    tool: 'bash',
                    args: { command: command + ' --force' }
                }
            };
        }
        return {
            detected: true,
            suggestion: 'Permission denied. Options:\n' +
                '  1. Run as administrator/sudo\n' +
                '  2. Check file permissions\n' +
                '  3. Close applications using the files'
        };
    }
    static handlePythonSyntaxError(error) {
        // Extract file and line number
        const fileMatch = error.match(/file "([^"]+)", line (\d+)/i);
        if (fileMatch) {
            const file = fileMatch[1];
            const line = fileMatch[2];
            return {
                detected: true,
                suggestion: `Syntax error in ${file}:${line}. Common fixes:\n` +
                    '  1. Check indentation (use spaces, not tabs)\n' +
                    '  2. Check for missing colons (:) after def/if/for/while\n' +
                    '  3. Check for unclosed brackets/parentheses\n' +
                    '  4. Check string quotes (matching \'/\")'
            };
        }
        return {
            detected: true,
            suggestion: 'Python syntax error detected. Please review the code for syntax issues.'
        };
    }
    static handleJavaScriptError(error) {
        if (error.includes('unexpected token')) {
            return {
                detected: true,
                suggestion: 'JavaScript syntax error. Common fixes:\n' +
                    '  1. Check for missing semicolons\n' +
                    '  2. Check for unclosed brackets/braces\n' +
                    '  3. Check for incorrect JSX syntax\n' +
                    '  4. Check for async/await usage'
            };
        }
        return {
            detected: true,
            suggestion: 'JavaScript error detected. Review the error message and fix the code accordingly.'
        };
    }
    static handleGitError(error) {
        if (error.includes('not a git repository')) {
            return {
                detected: true,
                suggestion: 'Not a git repository. Initialize with: git init',
                autoFix: {
                    tool: 'bash',
                    args: { command: 'git init' }
                }
            };
        }
        if (error.includes('merge conflict')) {
            return {
                detected: true,
                suggestion: 'Merge conflict detected. Options:\n' +
                    '  1. Resolve conflicts manually in the files\n' +
                    '  2. Use git status to see conflicting files\n' +
                    '  3. After resolving, run: git add . && git commit'
            };
        }
        return {
            detected: true,
            suggestion: 'Git error detected. Review the error message.'
        };
    }
}
exports.ErrorRecovery = ErrorRecovery;
//# sourceMappingURL=ErrorRecovery.js.map