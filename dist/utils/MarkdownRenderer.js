"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const cli_highlight_1 = require("cli-highlight");
class MarkdownRenderer {
    static render(text) {
        const lines = text.split('\n');
        let inCodeBlock = false;
        let codeLanguage = '';
        let codeBuffer = [];
        for (const line of lines) {
            // Code block start/end
            if (line.trim().startsWith('```')) {
                if (inCodeBlock) {
                    // End of code block - render it
                    const code = codeBuffer.join('\n');
                    this.renderCodeBlock(code, codeLanguage);
                    codeBuffer = [];
                    inCodeBlock = false;
                    codeLanguage = '';
                }
                else {
                    // Start of code block
                    inCodeBlock = true;
                    codeLanguage = line.trim().slice(3).trim();
                }
                continue;
            }
            if (inCodeBlock) {
                codeBuffer.push(line);
                continue;
            }
            // Headers
            if (line.startsWith('# ')) {
                console.log(chalk_1.default.hex('#FF9500').bold(line.slice(2)));
                continue;
            }
            if (line.startsWith('## ')) {
                console.log(chalk_1.default.hex('#FF9500')(line.slice(3)));
                continue;
            }
            if (line.startsWith('### ')) {
                console.log(chalk_1.default.white(line.slice(4)));
                continue;
            }
            // Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const indent = line.search(/\S/);
                const content = line.trim().slice(2);
                console.log(' '.repeat(indent) + chalk_1.default.hex('#FF9500')('•') + ' ' + chalk_1.default.white(content));
                continue;
            }
            // Numbered lists
            if (/^\s*\d+\.\s/.test(line)) {
                const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
                if (match) {
                    const [, indent, num, content] = match;
                    console.log(' '.repeat(indent.length) + chalk_1.default.hex('#FF9500')(num + '.') + ' ' + chalk_1.default.white(content));
                    continue;
                }
            }
            // Regular text (process inline code and bold)
            if (line.trim()) {
                let formatted = line;
                // Process inline code
                if (formatted.includes('`')) {
                    formatted = this.formatInlineCode(formatted);
                }
                // Process bold text
                if (formatted.includes('**')) {
                    formatted = this.formatBold(formatted);
                }
                console.log('  ' + chalk_1.default.white(formatted));
            }
            else {
                console.log();
            }
        }
        // Flush any remaining code block
        if (codeBuffer.length > 0) {
            const code = codeBuffer.join('\n');
            this.renderCodeBlock(code, codeLanguage);
        }
    }
    static renderCodeBlock(code, language) {
        console.log();
        console.log(chalk_1.default.dim('┌' + '─'.repeat(78) + '┐'));
        try {
            const highlighted = (0, cli_highlight_1.highlight)(code, { language: language || 'text', ignoreIllegals: true });
            highlighted.split('\n').forEach((line) => {
                console.log(chalk_1.default.dim('│') + ' ' + line);
            });
        }
        catch {
            // Fallback if highlighting fails
            code.split('\n').forEach((line) => {
                console.log(chalk_1.default.dim('│') + ' ' + chalk_1.default.white(line));
            });
        }
        console.log(chalk_1.default.dim('└' + '─'.repeat(78) + '┘'));
        console.log();
    }
    static formatInlineCode(text) {
        return text.replace(/`([^`]+)`/g, (_, code) => {
            return chalk_1.default.bgHex('#2D2D2D').hex('#FF9500')(` ${code} `);
        });
    }
    static formatBold(text) {
        return text.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
            return chalk_1.default.bold(content);
        });
    }
}
exports.MarkdownRenderer = MarkdownRenderer;
//# sourceMappingURL=MarkdownRenderer.js.map