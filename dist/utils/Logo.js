"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = void 0;
const chalk_1 = __importDefault(require("chalk"));
class Logo {
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
        console.log(chalk_1.default.hex('#FF9500')(logo));
        console.log(chalk_1.default.hex('#FF9500')('  ═'.repeat(40)));
        console.log();
        console.log(chalk_1.default.dim('  AI Coding Assistant - Multi-model LLM interface'));
        console.log();
    }
    static printCompact() {
        console.log();
        console.log(chalk_1.default.hex('#FF9500').bold('  ◆ AWAITTER LITE'));
        console.log(chalk_1.default.dim('  ───────────────'));
        console.log();
    }
}
exports.Logo = Logo;
//# sourceMappingURL=Logo.js.map