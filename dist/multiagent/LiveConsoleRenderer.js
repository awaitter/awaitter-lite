"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveConsoleRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const AgentRoles_1 = require("./AgentRoles");
const ROLE_COLORS = {
    orchestrator: (t) => chalk_1.default.magenta(t),
    architect: (t) => chalk_1.default.blue(t),
    backend: (t) => chalk_1.default.yellow(t),
    frontend: (t) => chalk_1.default.cyan(t),
    qa: (t) => chalk_1.default.green(t)
};
const MESSAGE_TYPE_ICONS = {
    task_assignment: '📋',
    task_result: '✅',
    question: '❓',
    answer: '💡',
    status: '📊',
    thinking: '💭',
    tool_use: '🔧',
    error: '❌',
    complete: '🎉'
};
class LiveConsoleRenderer {
    dividerWidth = 70;
    printHeader(userRequest) {
        console.log('\n' + chalk_1.default.bold.white('═'.repeat(this.dividerWidth)));
        console.log(chalk_1.default.bold.white('  🤖 MULTI-AGENT MODE'));
        console.log(chalk_1.default.dim(`  Task: "${userRequest}"`));
        console.log(chalk_1.default.bold.white('═'.repeat(this.dividerWidth)) + '\n');
    }
    printMessage(message) {
        const role = (0, AgentRoles_1.getRoleConfig)(message.fromAgent);
        const colorFn = ROLE_COLORS[message.fromAgent];
        const icon = MESSAGE_TYPE_ICONS[message.type] || '•';
        const time = message.timestamp.toLocaleTimeString('en', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const prefix = colorFn(`${role.emoji} [${role.name.toUpperCase()}]`);
        const typeBadge = chalk_1.default.dim(`${icon} ${message.type}`);
        const timestamp = chalk_1.default.dim(`[${time}]`);
        // Header line
        console.log(`\n${prefix} ${typeBadge} ${timestamp}`);
        if (message.toAgent !== 'all') {
            const toRole = (0, AgentRoles_1.getRoleConfig)(message.toAgent);
            console.log(chalk_1.default.dim(`  → to: ${toRole.emoji} ${toRole.name}`));
        }
        // Content — indent each line
        const lines = message.content.split('\n');
        lines.forEach(line => {
            if (line.trim()) {
                console.log(colorFn('  │ ') + chalk_1.default.white(line));
            }
            else {
                console.log(colorFn('  │'));
            }
        });
    }
    printToolUse(agent, toolName, args) {
        const role = (0, AgentRoles_1.getRoleConfig)(agent);
        const colorFn = ROLE_COLORS[agent];
        const argStr = Object.entries(args)
            .map(([k, v]) => `${k}=${JSON.stringify(String(v).slice(0, 50))}`)
            .join(', ');
        console.log(colorFn(`  ${role.emoji} 🔧 ${toolName}`) + chalk_1.default.dim(`(${argStr})`));
    }
    printToolResult(agent, toolName, result) {
        const colorFn = ROLE_COLORS[agent];
        const preview = result.slice(0, 100).replace(/\n/g, ' ');
        console.log(colorFn('     ✓ ') + chalk_1.default.dim(`${toolName}: ${preview}${result.length > 100 ? '...' : ''}`));
    }
    printAgentStart(agent, task) {
        const role = (0, AgentRoles_1.getRoleConfig)(agent);
        const colorFn = ROLE_COLORS[agent];
        console.log('\n' + chalk_1.default.bold.white('─'.repeat(this.dividerWidth)));
        console.log(colorFn(`  ${role.emoji} ${role.name.toUpperCase()} starting...`));
        console.log(chalk_1.default.dim(`  Task: ${task}`));
        console.log(chalk_1.default.bold.white('─'.repeat(this.dividerWidth)));
    }
    printAgentComplete(agent) {
        const role = (0, AgentRoles_1.getRoleConfig)(agent);
        const colorFn = ROLE_COLORS[agent];
        console.log(colorFn(`  ${role.emoji} ${role.name.toUpperCase()} `) + chalk_1.default.green('DONE ✓'));
    }
    printPlan(plan) {
        console.log('\n' + chalk_1.default.bold.white('  📋 EXECUTION PLAN:'));
        plan.forEach((item, i) => {
            const role = (0, AgentRoles_1.getRoleConfig)(item.role);
            const colorFn = ROLE_COLORS[item.role];
            console.log(colorFn(`  ${i + 1}. ${role.emoji} [${role.name}]`) + chalk_1.default.white(` ${item.task}`));
        });
        console.log();
    }
    printSummary(completedTasks, totalTasks, duration) {
        const seconds = Math.round(duration / 1000);
        console.log('\n' + chalk_1.default.bold.white('═'.repeat(this.dividerWidth)));
        console.log(chalk_1.default.bold.green(`  🎉 MULTI-AGENT SESSION COMPLETE`));
        console.log(chalk_1.default.white(`  Tasks completed: ${completedTasks}/${totalTasks}`));
        console.log(chalk_1.default.white(`  Total time: ${seconds}s`));
        console.log(chalk_1.default.bold.white('═'.repeat(this.dividerWidth)) + '\n');
    }
    printError(agent, error) {
        const role = (0, AgentRoles_1.getRoleConfig)(agent);
        console.log(chalk_1.default.red(`  ${role.emoji} [${role.name}] ERROR: ${error}`));
    }
    printStatus(text) {
        console.log(chalk_1.default.dim(`  ⟳ ${text}`));
    }
}
exports.LiveConsoleRenderer = LiveConsoleRenderer;
//# sourceMappingURL=LiveConsoleRenderer.js.map