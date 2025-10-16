import chalk from 'chalk';

export class Logo {
  static print() {
    const logo = `
   █████╗ ██╗    ██╗ █████╗ ██╗████████╗████████╗███████╗██████╗
  ██╔══██╗██║    ██║██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
  ███████║██║ █╗ ██║███████║██║   ██║      ██║   █████╗  ██████╔╝
  ██╔══██║██║███╗██║██╔══██║██║   ██║      ██║   ██╔══╝  ██╔══██╗
  ██║  ██║╚███╔███╔╝██║  ██║██║   ██║      ██║   ███████╗██║  ██║
  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

  ██╗     ██╗████████╗███████╗
  ██║     ██║╚══██╔══╝██╔════╝
  ██║     ██║   ██║   █████╗
  ██║     ██║   ██║   ██╔══╝
  ███████╗██║   ██║   ███████╗
  ╚══════╝╚═╝   ╚═╝   ╚══════╝
`;

    // Print with orange/amber color
    console.log(chalk.hex('#FF9500')(logo));
    console.log(chalk.hex('#FF9500')('  ═'.repeat(40)));
    console.log();
    console.log(chalk.dim('  AI Coding Assistant - Multi-model LLM interface'));
    console.log();
  }

  static printCompact() {
    console.log();
    console.log(chalk.hex('#FF9500').bold('  ◆ AWAITTER LITE'));
    console.log(chalk.dim('  ───────────────'));
    console.log();
  }
}
