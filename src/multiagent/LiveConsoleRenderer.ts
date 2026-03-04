import chalk from 'chalk';
import { AgentMessage, AgentRoleType, MessageType } from './types';
import { getRoleConfig } from './AgentRoles';

const ROLE_COLORS: Record<AgentRoleType, (text: string) => string> = {
  orchestrator: (t) => chalk.magenta(t),
  architect:    (t) => chalk.blue(t),
  backend:      (t) => chalk.yellow(t),
  frontend:     (t) => chalk.cyan(t),
  qa:           (t) => chalk.green(t)
};

const MESSAGE_TYPE_ICONS: Record<MessageType, string> = {
  task_assignment: '📋',
  task_result:     '✅',
  question:        '❓',
  answer:          '💡',
  status:          '📊',
  thinking:        '💭',
  tool_use:        '🔧',
  error:           '❌',
  complete:        '🎉'
};

export class LiveConsoleRenderer {
  private dividerWidth = 70;

  printHeader(userRequest: string): void {
    console.log('\n' + chalk.bold.white('═'.repeat(this.dividerWidth)));
    console.log(chalk.bold.white('  🤖 MULTI-AGENT MODE'));
    console.log(chalk.dim(`  Task: "${userRequest}"`));
    console.log(chalk.bold.white('═'.repeat(this.dividerWidth)) + '\n');
  }

  printMessage(message: AgentMessage): void {
    const role = getRoleConfig(message.fromAgent);
    const colorFn = ROLE_COLORS[message.fromAgent];
    const icon = MESSAGE_TYPE_ICONS[message.type] || '•';
    const time = message.timestamp.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const prefix = colorFn(`${role.emoji} [${role.name.toUpperCase()}]`);
    const typeBadge = chalk.dim(`${icon} ${message.type}`);
    const timestamp = chalk.dim(`[${time}]`);

    // Header line
    console.log(`\n${prefix} ${typeBadge} ${timestamp}`);

    if (message.toAgent !== 'all') {
      const toRole = getRoleConfig(message.toAgent);
      console.log(chalk.dim(`  → to: ${toRole.emoji} ${toRole.name}`));
    }

    // Content — indent each line
    const lines = message.content.split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(colorFn('  │ ') + chalk.white(line));
      } else {
        console.log(colorFn('  │'));
      }
    });
  }

  printToolUse(agent: AgentRoleType, toolName: string, args: Record<string, any>): void {
    const role = getRoleConfig(agent);
    const colorFn = ROLE_COLORS[agent];
    const argStr = Object.entries(args)
      .map(([k, v]) => `${k}=${JSON.stringify(String(v).slice(0, 50))}`)
      .join(', ');

    console.log(colorFn(`  ${role.emoji} 🔧 ${toolName}`) + chalk.dim(`(${argStr})`));
  }

  printToolResult(agent: AgentRoleType, toolName: string, result: string): void {
    const colorFn = ROLE_COLORS[agent];
    const preview = result.slice(0, 100).replace(/\n/g, ' ');
    console.log(colorFn('     ✓ ') + chalk.dim(`${toolName}: ${preview}${result.length > 100 ? '...' : ''}`));
  }

  printAgentStart(agent: AgentRoleType, task: string): void {
    const role = getRoleConfig(agent);
    const colorFn = ROLE_COLORS[agent];
    console.log('\n' + chalk.bold.white('─'.repeat(this.dividerWidth)));
    console.log(colorFn(`  ${role.emoji} ${role.name.toUpperCase()} starting...`));
    console.log(chalk.dim(`  Task: ${task}`));
    console.log(chalk.bold.white('─'.repeat(this.dividerWidth)));
  }

  printAgentComplete(agent: AgentRoleType): void {
    const role = getRoleConfig(agent);
    const colorFn = ROLE_COLORS[agent];
    console.log(colorFn(`  ${role.emoji} ${role.name.toUpperCase()} `) + chalk.green('DONE ✓'));
  }

  printPlan(plan: Array<{ role: AgentRoleType; task: string }>): void {
    console.log('\n' + chalk.bold.white('  📋 EXECUTION PLAN:'));
    plan.forEach((item, i) => {
      const role = getRoleConfig(item.role);
      const colorFn = ROLE_COLORS[item.role];
      console.log(colorFn(`  ${i + 1}. ${role.emoji} [${role.name}]`) + chalk.white(` ${item.task}`));
    });
    console.log();
  }

  printSummary(completedTasks: number, totalTasks: number, duration: number): void {
    const seconds = Math.round(duration / 1000);
    console.log('\n' + chalk.bold.white('═'.repeat(this.dividerWidth)));
    console.log(chalk.bold.green(`  🎉 MULTI-AGENT SESSION COMPLETE`));
    console.log(chalk.white(`  Tasks completed: ${completedTasks}/${totalTasks}`));
    console.log(chalk.white(`  Total time: ${seconds}s`));
    console.log(chalk.bold.white('═'.repeat(this.dividerWidth)) + '\n');
  }

  printError(agent: AgentRoleType, error: string): void {
    const role = getRoleConfig(agent);
    console.log(chalk.red(`  ${role.emoji} [${role.name}] ERROR: ${error}`));
  }

  printStatus(text: string): void {
    console.log(chalk.dim(`  ⟳ ${text}`));
  }
}
