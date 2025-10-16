import chalk from 'chalk';
import { highlight } from 'cli-highlight';

export class MarkdownRenderer {
  static render(text: string): void {
    const lines = text.split('\n');
    let inCodeBlock = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];

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
        } else {
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
        console.log(chalk.hex('#FF9500').bold(line.slice(2)));
        continue;
      }
      if (line.startsWith('## ')) {
        console.log(chalk.hex('#FF9500')(line.slice(3)));
        continue;
      }
      if (line.startsWith('### ')) {
        console.log(chalk.white(line.slice(4)));
        continue;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const indent = line.search(/\S/);
        const content = line.trim().slice(2);
        console.log(' '.repeat(indent) + chalk.hex('#FF9500')('•') + ' ' + chalk.white(content));
        continue;
      }

      // Numbered lists
      if (/^\s*\d+\.\s/.test(line)) {
        const match = line.match(/^(\s*)(\d+)\.\s(.*)$/);
        if (match) {
          const [, indent, num, content] = match;
          console.log(' '.repeat(indent.length) + chalk.hex('#FF9500')(num + '.') + ' ' + chalk.white(content));
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

        console.log('  ' + chalk.white(formatted));
      } else {
        console.log();
      }
    }

    // Flush any remaining code block
    if (codeBuffer.length > 0) {
      const code = codeBuffer.join('\n');
      this.renderCodeBlock(code, codeLanguage);
    }
  }

  private static renderCodeBlock(code: string, language: string): void {
    console.log();
    console.log(chalk.dim('┌' + '─'.repeat(78) + '┐'));

    try {
      const highlighted = highlight(code, { language: language || 'text', ignoreIllegals: true });
      highlighted.split('\n').forEach((line: string) => {
        console.log(chalk.dim('│') + ' ' + line);
      });
    } catch {
      // Fallback if highlighting fails
      code.split('\n').forEach((line: string) => {
        console.log(chalk.dim('│') + ' ' + chalk.white(line));
      });
    }

    console.log(chalk.dim('└' + '─'.repeat(78) + '┘'));
    console.log();
  }

  private static formatInlineCode(text: string): string {
    return text.replace(/`([^`]+)`/g, (_, code) => {
      return chalk.bgHex('#2D2D2D').hex('#FF9500')(` ${code} `);
    });
  }

  private static formatBold(text: string): string {
    return text.replace(/\*\*([^*]+)\*\*/g, (_, content) => {
      return chalk.bold(content);
    });
  }
}
