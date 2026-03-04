/**
 * Interactive confirmation prompt for dangerous operations.
 * Used by Agent and WorkerAgent before executing destructive commands.
 */

import * as readline from 'readline';
import chalk from 'chalk';

export interface DangerInfo {
  reason: string;
  severity: 'high' | 'critical';
}

/**
 * Ask the user to confirm a dangerous command.
 * Stops any active spinner before prompting, then resumes after.
 * Returns true if user approved, false if rejected.
 */
export async function askConfirmation(command: string, danger: DangerInfo): Promise<boolean> {
  const icon   = danger.severity === 'critical' ? '🔴' : '🟡';
  const border = chalk.yellow('─'.repeat(60));

  process.stdout.write('\n');
  console.log(border);
  console.log(chalk.yellow.bold(`${icon}  PELIGRO / DANGEROUS COMMAND`));
  console.log(border);
  console.log(chalk.dim('  Command: ') + chalk.white.bold(command));
  console.log(chalk.dim('  Reason:  ') + chalk.yellow(danger.reason));
  console.log(border);

  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    let answered = false;

    const answer_fn = (answer: string) => {
      if (answered) return;
      answered = true;
      rl.close();
      const approved = ['y', 'yes', 's', 'si', 'sí'].includes(answer.toLowerCase().trim());
      if (approved) {
        console.log(chalk.green('  ✓ Aprobado por el usuario — ejecutando...'));
      } else {
        console.log(chalk.yellow('  ✗ Rechazado por el usuario — comando cancelado'));
      }
      console.log();
      resolve(approved);
    };

    // If stdin closes (EOF / piped mode) before user answers, default to rejected
    rl.on('close', () => {
      if (!answered) {
        answered = true;
        console.log(chalk.yellow('  ✗ Sin respuesta (stdin cerrado) — comando cancelado'));
        console.log();
        resolve(false);
      }
    });

    rl.question(chalk.yellow.bold('  ¿Ejecutar? / Execute? (y/N): '), answer_fn);
  });
}
