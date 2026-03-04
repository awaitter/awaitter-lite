"use strict";
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
exports.Orchestrator = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline = __importStar(require("readline"));
const ModelManager_1 = require("../models/ModelManager");
const MessageBus_1 = require("./MessageBus");
const WorkerAgent_1 = require("./WorkerAgent");
const LiveConsoleRenderer_1 = require("./LiveConsoleRenderer");
const AgentRoles_1 = require("./AgentRoles");
const LangStrings_1 = require("../utils/LangStrings");
class Orchestrator {
    config;
    workingDir;
    bus;
    renderer;
    orchestratorModel;
    lang = 'en';
    constructor(config, workingDir) {
        this.config = config;
        this.workingDir = workingDir;
        this.bus = new MessageBus_1.MessageBus();
        this.renderer = new LiveConsoleRenderer_1.LiveConsoleRenderer();
        this.orchestratorModel = new ModelManager_1.ModelManager(config);
    }
    async run(userRequest, modelName, lang = 'en') {
        this.lang = lang;
        const startTime = Date.now();
        this.renderer.printHeader(userRequest);
        // Set up orchestrator model
        await this.orchestratorModel.setModel(modelName);
        // Step 1: Orchestrator plans the work
        this.renderer.printStatus('Orchestrator analyzing task...');
        this.bus.publish('orchestrator', 'all', 'thinking', `Analyzing: "${userRequest}"`);
        const plan = await this.createPlan(userRequest);
        if (plan.length === 0) {
            console.log(chalk_1.default.red('  ✗ Orchestrator could not create a plan.'));
            return;
        }
        this.renderer.printPlan(plan);
        // Step 2: Execute tasks sequentially, passing context forward
        const results = new Map();
        let completedTasks = 0;
        for (const item of plan) {
            const task = {
                id: `task-${Date.now()}`,
                assignedTo: item.role,
                description: item.task,
                status: 'in_progress'
            };
            // Build shared context from previous agents
            const sharedContext = this.buildSharedContext(results);
            // Create worker model (uses the same model or a role-specific one)
            const workerModel = new ModelManager_1.ModelManager(this.config);
            await workerModel.setModel(modelName);
            // Create and run worker agent (pass detected language so all feedback matches)
            const worker = new WorkerAgent_1.WorkerAgent(item.role, this.config, workerModel, this.workingDir, this.bus, this.renderer, this.lang);
            try {
                const result = await worker.execute(task, sharedContext);
                results.set(item.role, result);
                task.status = 'completed';
                task.result = result;
                completedTasks++;
            }
            catch (error) {
                task.status = 'failed';
                const errMsg = error instanceof Error ? error.message : String(error);
                this.renderer.printError(item.role, errMsg);
                results.set(item.role, `FAILED: ${errMsg}`);
            }
        }
        // Step 3: Orchestrator final review
        this.renderer.printStatus('Orchestrator reviewing results...');
        await this.finalReview(userRequest, results);
        // Step 4: QA recommendation approval loop
        await this.applyQARecommendations(results, modelName);
        const duration = Date.now() - startTime;
        this.renderer.printSummary(completedTasks, plan.length, duration);
    }
    async createPlan(userRequest) {
        const orchestratorRole = (0, AgentRoles_1.getRoleConfig)('orchestrator');
        const messages = [
            {
                role: 'system',
                content: orchestratorRole.systemPrompt + `\n\nWorking Directory: ${this.workingDir}`
            },
            {
                role: 'user',
                content: LangStrings_1.PROMPTS.orchestratorPlanRequest[this.lang](userRequest)
            }
        ];
        try {
            const response = await this.orchestratorModel.chat(messages);
            const content = response.choices[0].message.content || '';
            this.bus.publish('orchestrator', 'all', 'task_assignment', content);
            this.renderer.printMessage({
                id: `plan-${Date.now()}`,
                fromAgent: 'orchestrator',
                toAgent: 'all',
                type: 'task_assignment',
                content,
                timestamp: new Date()
            });
            return this.parsePlan(content);
        }
        catch (error) {
            console.log(chalk_1.default.red(`  ✗ Planning failed: ${error}`));
            return [];
        }
    }
    parsePlan(content) {
        const plan = [];
        const validRoles = ['architect', 'backend', 'frontend', 'qa'];
        const lines = content.split('\n');
        for (const line of lines) {
            const match = line.match(/[-*]\s*\[(architect|backend|frontend|qa|orchestrator)\]\s*(.+)/i);
            if (match) {
                const role = match[1].toLowerCase();
                const task = match[2].trim();
                if (validRoles.includes(role)) {
                    plan.push({ role, task });
                }
            }
        }
        // Fallback: if no plan parsed, create a simple default
        if (plan.length === 0) {
            plan.push({ role: 'architect', task: 'Set up project structure and base files' });
            plan.push({ role: 'backend', task: 'Implement core logic and functionality' });
            plan.push({ role: 'qa', task: 'Review and validate the implementation' });
        }
        return plan;
    }
    buildSharedContext(results) {
        if (results.size === 0)
            return '';
        const parts = ['## Work done by previous agents:\n'];
        for (const [role, result] of results.entries()) {
            const roleConfig = (0, AgentRoles_1.getRoleConfig)(role);
            parts.push(`### ${roleConfig.emoji} ${roleConfig.name}\n${result.slice(0, 1500)}\n`);
        }
        return parts.join('\n');
    }
    async finalReview(userRequest, results) {
        const summary = this.buildSharedContext(results);
        const messages = [
            {
                role: 'system',
                content: (0, AgentRoles_1.getRoleConfig)('orchestrator').systemPrompt
            },
            {
                role: 'user',
                content: `The team has completed the request: "${userRequest}"

Here's what each agent did:
${summary}

Provide a brief final summary (3-5 bullet points) of what was accomplished and any next steps for the user.`
            }
        ];
        try {
            const response = await this.orchestratorModel.chat(messages);
            const content = response.choices[0].message.content || '';
            this.bus.publish('orchestrator', 'all', 'complete', content);
            this.renderer.printMessage({
                id: `final-${Date.now()}`,
                fromAgent: 'orchestrator',
                toAgent: 'all',
                type: 'complete',
                content,
                timestamp: new Date()
            });
        }
        catch (error) {
            // Non-critical — skip if review fails
        }
    }
    /**
     * After QA finishes, extract its actionable recommendations, present them
     * to the user as a numbered list, and execute only the approved ones.
     */
    async applyQARecommendations(results, modelName) {
        const qaResult = results.get('qa');
        if (!qaResult || qaResult.startsWith('FAILED:'))
            return;
        // Ask the orchestrator model to extract a clean numbered list
        const extractMessages = [
            { role: 'system', content: (0, AgentRoles_1.getRoleConfig)('orchestrator').systemPrompt },
            { role: 'user', content: LangStrings_1.PROMPTS.qaExtractRecommendations[this.lang](qaResult.slice(0, 3000)) }
        ];
        let recommendations = [];
        try {
            const response = await this.orchestratorModel.chat(extractMessages);
            const content = (response.choices[0].message.content || '').trim();
            if (!content || content.toUpperCase().startsWith('NONE'))
                return;
            for (const line of content.split('\n')) {
                const match = line.match(/^\s*\d+[.)]\s*(.+)/);
                if (match)
                    recommendations.push(match[1].trim());
            }
        }
        catch {
            return;
        }
        if (recommendations.length === 0)
            return;
        // Display the recommendations
        const border = chalk_1.default.green('═'.repeat(70));
        console.log('\n' + border);
        console.log(chalk_1.default.bold.green(LangStrings_1.PROMPTS.qaApprovalHeader[this.lang](recommendations.length)));
        console.log(border);
        recommendations.forEach((rec, i) => {
            console.log(chalk_1.default.white(`  ${i + 1}. ${rec}`));
        });
        console.log(border);
        // Ask user which ones to apply
        const selectedIndices = await this.askUserSelection(chalk_1.default.yellow.bold(`\n${LangStrings_1.PROMPTS.qaApprovalPrompt[this.lang]}`), recommendations.length);
        if (selectedIndices.length === 0) {
            console.log(chalk_1.default.dim(LangStrings_1.PROMPTS.qaNoChanges[this.lang]));
            return;
        }
        console.log();
        // Execute each approved recommendation as a backend worker task
        let applied = 0;
        for (const idx of selectedIndices) {
            const rec = recommendations[idx];
            applied++;
            console.log(chalk_1.default.cyan(LangStrings_1.PROMPTS.qaApplyingRecommendation[this.lang](applied, selectedIndices.length, rec)));
            const task = {
                id: `qa-fix-${Date.now()}-${idx}`,
                assignedTo: 'backend',
                description: rec,
                status: 'in_progress',
                context: this.lang === 'es'
                    ? `Usa glob y read para encontrar los archivos relevantes antes de hacer cambios. No asumas rutas de archivo — explora el directorio de trabajo primero.`
                    : `Use glob and read tools to find relevant files before making any changes. Do not assume file paths — explore the working directory first.`
            };
            const sharedContext = this.buildSharedContext(results);
            const workerModel = new ModelManager_1.ModelManager(this.config);
            await workerModel.setModel(modelName);
            const worker = new WorkerAgent_1.WorkerAgent('backend', this.config, workerModel, this.workingDir, this.bus, this.renderer, this.lang);
            try {
                const result = await worker.execute(task, sharedContext);
                // Update context so subsequent recommendations have the latest state
                results.set('backend', result);
            }
            catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.renderer.printError('backend', errMsg);
            }
        }
    }
    /**
     * Prompt the user to pick recommendation indices.
     * Accepts: "1,2", "all", "todos", "none", or empty → none.
     */
    askUserSelection(prompt, count) {
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
                terminal: true
            });
            rl.question(prompt, (answer) => {
                rl.close();
                const trimmed = answer.toLowerCase().trim();
                if (!trimmed || trimmed === 'none' || trimmed === 'no' || trimmed === 'n') {
                    resolve([]);
                    return;
                }
                if (trimmed === 'all' || trimmed === 'todos' || trimmed === 'a') {
                    resolve(Array.from({ length: count }, (_, i) => i));
                    return;
                }
                // Parse comma-separated numbers like "1,3,4"
                const indices = [];
                for (const part of trimmed.split(/[,\s]+/)) {
                    const num = parseInt(part, 10);
                    if (!isNaN(num) && num >= 1 && num <= count) {
                        indices.push(num - 1); // convertir a 0-based
                    }
                }
                resolve(indices);
            });
        });
    }
    getBus() {
        return this.bus;
    }
}
exports.Orchestrator = Orchestrator;
//# sourceMappingURL=Orchestrator.js.map