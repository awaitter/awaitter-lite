"use strict";
/**
 * Interactive confirmation prompt for dangerous operations.
 * Used by Agent and WorkerAgent before executing destructive commands.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.askConfirmation = askConfirmation;
const readline = __importStar(require("readline"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Ask the user to confirm a dangerous command.
 * Stops any active spinner before prompting, then resumes after.
 * Returns true if user approved, false if rejected.
 */
async function askConfirmation(command, danger) {
    const icon = danger.severity === 'critical' ? '🔴' : '🟡';
    const border = chalk_1.default.yellow('─'.repeat(60));
    process.stdout.write('\n');
    console.log(border);
    console.log(chalk_1.default.yellow.bold(`${icon}  PELIGRO / DANGEROUS COMMAND`));
    console.log(border);
    console.log(chalk_1.default.dim('  Command: ') + chalk_1.default.white.bold(command));
    console.log(chalk_1.default.dim('  Reason:  ') + chalk_1.default.yellow(danger.reason));
    console.log(border);
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            terminal: true
        });
        let answered = false;
        const answer_fn = (answer) => {
            if (answered)
                return;
            answered = true;
            rl.close();
            const approved = ['y', 'yes', 's', 'si', 'sí'].includes(answer.toLowerCase().trim());
            if (approved) {
                console.log(chalk_1.default.green('  ✓ Aprobado por el usuario — ejecutando...'));
            }
            else {
                console.log(chalk_1.default.yellow('  ✗ Rechazado por el usuario — comando cancelado'));
            }
            console.log();
            resolve(approved);
        };
        // If stdin closes (EOF / piped mode) before user answers, default to rejected
        rl.on('close', () => {
            if (!answered) {
                answered = true;
                console.log(chalk_1.default.yellow('  ✗ Sin respuesta (stdin cerrado) — comando cancelado'));
                console.log();
                resolve(false);
            }
        });
        rl.question(chalk_1.default.yellow.bold('  ¿Ejecutar? / Execute? (y/N): '), answer_fn);
    });
}
//# sourceMappingURL=ConfirmHelper.js.map