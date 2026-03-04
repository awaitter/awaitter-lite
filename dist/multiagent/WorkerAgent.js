"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerAgent = void 0;
const ToolManager_1 = require("../tools/ToolManager");
const SnapshotManager_1 = require("../snapshot/SnapshotManager");
const AgentRoles_1 = require("./AgentRoles");
const ToolCallParser_1 = require("../utils/ToolCallParser");
const LangStrings_1 = require("../utils/LangStrings");
const ConfirmHelper_1 = require("../utils/ConfirmHelper");
const BashTool_1 = require("../tools/BashTool");
const CharlKnowledge_1 = require("../knowledge/CharlKnowledge");
class WorkerAgent {
    role;
    config;
    modelManager;
    workingDir;
    bus;
    lang;
    messages = [];
    toolManager;
    renderer;
    constructor(role, config, modelManager, workingDir, bus, renderer, lang = 'en') {
        this.role = role;
        this.config = config;
        this.modelManager = modelManager;
        this.workingDir = workingDir;
        this.bus = bus;
        this.lang = lang;
        const snapshotManager = new SnapshotManager_1.SnapshotManager(50);
        this.toolManager = new ToolManager_1.ToolManager(config, workingDir, snapshotManager);
        this.renderer = renderer;
    }
    /**
     * Detect if this task is purely analytical — read-only, no file creation/deletion.
     * Analysis tasks must never modify or delete files.
     */
    isAnalysisTask(description) {
        const lower = description.toLowerCase();
        const analysisKeywords = [
            'analiz', 'analyze', 'analysis', 'review', 'revisa', 'revisar',
            'status', 'estado', 'assess', 'evalúa', 'evalua', 'evaluate',
            'inspect', 'inspecciona', 'check', 'verifica', 'audit', 'audita',
            'document', 'documenta', 'report', 'reporte', 'informe',
            'identify issue', 'identif', 'find bug', 'encuentra',
            'dame un', 'give me a', 'what is', 'qué es', 'how is', 'cómo está',
            'describe', 'describe', 'summarize', 'resume',
        ];
        return analysisKeywords.some(kw => lower.includes(kw));
    }
    async execute(task, sharedContext) {
        const roleConfig = (0, AgentRoles_1.getRoleConfig)(this.role);
        const isReadOnly = this.isAnalysisTask(task.description);
        this.renderer.printAgentStart(this.role, task.description);
        this.bus.publish(this.role, 'all', 'status', `Starting task: ${task.description}`);
        // Read-only constraint appended when task is analytical
        const readOnlyWarning = isReadOnly ? `

# ⚠️ READ-ONLY MODE — THIS IS AN ANALYSIS TASK
You MUST NOT modify, create, or delete ANY files.
FORBIDDEN actions:
- rm, rmdir, git rm, git clean, git reset --hard
- write, edit, create files
- npm install, pip install (unless explicitly asked)
- Any destructive bash commands
ALLOWED actions:
- read, glob, grep (read files)
- bash: ls, cat, find, git status, git log, git diff (read-only commands)
- Produce a written analysis/report as your output` : '';
        // Charl language injection — PREPENDED to system prompt for maximum priority
        const charlBin = (0, CharlKnowledge_1.getCharlBinPath)();
        const charlSection = (0, CharlKnowledge_1.isCharlProject)(this.workingDir)
            ? `[CHARL PROJECT — MANDATORY RULES]
1. ALL Charl files MUST use .ch extension (e.g. network.ch, train.ch). NOT .py, NOT .charl.
2. NO import statements. NO charl.X syntax. Builtins are global: nn_linear(), optim_sgd_step(), etc.
3. Create .ch files with write tool, run with: bash(command="${charlBin ?? 'charl'} run <file.ch>")
4. NEVER use numpy, torch, keras or any external library — Charl has everything built in.

` + (0, CharlKnowledge_1.getCharlKnowledgePack)(true) + '\n\n---\n'
            : '';
        // Build system prompt for this role — charlSection prepended for max priority
        const systemPrompt = `${charlSection}${LangStrings_1.PROMPTS.languageInstruction[this.lang]}

${roleConfig.systemPrompt}

# CURRENT SESSION
Working Directory: ${this.workingDir}
Your Role: ${roleConfig.name} (${roleConfig.description})
CLI Process PID: ${process.pid}

# ⚠️ PROCESS MANAGEMENT RULES
NEVER run commands that kill processes by name or pattern:
- FORBIDDEN: pkill, killall, kill -9 (broad patterns)
- FORBIDDEN: pkill -f node, pkill node, killall node (would kill the CLI itself)
To free a port, use: fuser -k <port>/tcp OR lsof -ti:<port> | xargs kill -9

# SHARED CONTEXT FROM OTHER AGENTS
${sharedContext || 'No previous context yet — you are the first agent.'}

# YOUR TASK
${task.description}
${task.context ? `\nAdditional context:\n${task.context}` : ''}
${readOnlyWarning}

${LangStrings_1.PROMPTS.workerSystemFooter[this.lang]}`;
        this.messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: LangStrings_1.PROMPTS.workerInitialTask[this.lang](task.description) }
        ];
        const maxIterations = 20;
        for (let i = 0; i < maxIterations; i++) {
            try {
                const tools = this.toolManager.getToolSchemas();
                const response = await this.modelManager.chat(this.messages, tools);
                const message = response.choices[0].message;
                this.messages.push(message);
                // Strip special tokens that some models leak (qwen, deepseek, etc.)
                if (message.content) {
                    message.content = message.content
                        .replace(/<\|im_start\|>\s*/g, '')
                        .replace(/<\|im_end\|>\s*/g, '')
                        .replace(/<\|endoftext\|>\s*/g, '')
                        .replace(/<\|EOT\|>\s*/g, '')
                        .trim();
                }
                // Filter: qwen/deepseek sometimes echo back a tool result as JSON {name, content}
                // instead of responding in natural language. Suppress this raw JSON output.
                if (message.content && message.content.trim().startsWith('{')) {
                    try {
                        const parsed = JSON.parse(message.content.trim());
                        if (parsed && typeof parsed.name === 'string' && typeof parsed.content === 'string') {
                            message.content = undefined;
                        }
                    }
                    catch { /* not valid JSON, keep as-is */ }
                }
                // Fallback: parse tool calls from content if model didn't use native tool_calls.
                // Handles: ```json { ... } ``` blocks and bare JSON objects in free text.
                if ((!message.tool_calls || message.tool_calls.length === 0) && message.content) {
                    const { calls, cleanedContent } = (0, ToolCallParser_1.parseToolCallsFromContent)(message.content);
                    if (calls.length > 0) {
                        message.tool_calls = calls;
                        message.content = cleanedContent;
                    }
                }
                // Show thinking/response
                if (message.content && message.content.trim()) {
                    this.bus.publish(this.role, 'all', 'thinking', message.content);
                    this.renderer.printMessage({
                        id: `${Date.now()}`,
                        fromAgent: this.role,
                        toAgent: 'all',
                        type: 'thinking',
                        content: message.content,
                        timestamp: new Date()
                    });
                }
                // No tool calls — check if agent is looping or done
                if (!message.tool_calls || message.tool_calls.length === 0) {
                    const content = message.content || '';
                    if (this.isLooping(content)) {
                        break;
                    }
                    if (this.shouldForceContinue(content, i)) {
                        this.consecutiveDescriptions++;
                        this.messages.push({
                            role: 'user',
                            content: LangStrings_1.PROMPTS.workerStopDescribing[this.lang](task.description)
                        });
                        continue;
                    }
                    break;
                }
                // Reset description counter when model actually uses tools
                this.consecutiveDescriptions = 0;
                // Execute tools
                await this.executeTools(message.tool_calls);
                // Bail out if the model is stuck calling a non-existent or broken tool
                if (this.consecutiveToolErrors >= 3) {
                    this.renderer.printError(this.role, 'Too many consecutive tool errors — stopping to prevent infinite loop');
                    break;
                }
            }
            catch (error) {
                const errMsg = error instanceof Error ? error.message : String(error);
                this.renderer.printError(this.role, errMsg);
                this.bus.publish(this.role, 'orchestrator', 'error', errMsg);
                break;
            }
        }
        // Build result summary from last assistant messages
        const assistantMessages = this.messages
            .filter(m => m.role === 'assistant' && m.content)
            .map(m => m.content)
            .join('\n\n');
        const result = assistantMessages.slice(-2000) || 'Task executed (no text output)';
        this.bus.publish(this.role, 'orchestrator', 'task_result', result);
        this.renderer.printAgentComplete(this.role);
        return result;
    }
    lastContents = [];
    consecutiveToolErrors = 0;
    consecutiveDescriptions = 0;
    isLooping(content) {
        const key = content.trim().slice(0, 150);
        const repeated = this.lastContents.filter(c => c === key).length >= 2;
        this.lastContents.push(key);
        if (this.lastContents.length > 5)
            this.lastContents.shift();
        return repeated;
    }
    shouldForceContinue(content, iteration) {
        if (iteration >= 18)
            return false;
        // After 3 consecutive descriptions, give up — model is stuck
        if (this.consecutiveDescriptions >= 3)
            return false;
        const lower = content.toLowerCase();
        // First response with no tools is always a description — force continue
        if (iteration === 0)
            return true;
        // Code blocks without execution
        const hasCodeBlock = content.includes('```');
        const mentionsAction = [
            'create', 'write', 'run', 'install', 'execute', 'implement',
            'mkdir', 'npm', 'let me', "i'll", 'i will', 'we will', 'step',
            // Spanish
            'crear', 'escribir', 'ejecutar', 'instalar', 'implementar', 'voy a', 'vamos a',
            'procederemos', 'procedo', 'comenzamos', 'primero', 'siguiente paso'
        ].some(w => lower.includes(w));
        if (hasCodeBlock && mentionsAction)
            return true;
        // Markdown structure = description (###, numbered lists, bullet plans)
        const hasMarkdownStructure = /^#{1,3}\s+\w/m.test(content) || /^\d+\.\s+\*\*/m.test(content);
        if (hasMarkdownStructure && content.length > 100)
            return true;
        // Promise phrases without code blocks
        const promisePhrases = [
            "let's", "i'll", 'i will', 'we will', 'we can', 'we need to', 'next step', 'first step',
            'voy a', 'vamos a', 'necesitamos', 'debemos', 'hay que', 'para esto'
        ];
        if (promisePhrases.some(p => lower.includes(p)) && !hasCodeBlock)
            return true;
        return false;
    }
    async executeTools(toolCalls) {
        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            let args;
            try {
                args = JSON.parse(toolCall.function.arguments);
            }
            catch {
                args = {};
            }
            this.renderer.printToolUse(this.role, toolName, args);
            this.bus.publish(this.role, 'all', 'tool_use', `${toolName}(${JSON.stringify(args).slice(0, 100)})`);
            // Destructive bash commands require user confirmation before executing
            if (toolName === 'bash' && args.command) {
                const danger = BashTool_1.BashTool.getDangerInfo(args.command);
                if (danger) {
                    const approved = await (0, ConfirmHelper_1.askConfirmation)(args.command, danger);
                    if (!approved) {
                        const rejected = this.lang === 'es'
                            ? `El usuario rechazó el comando: "${args.command}". No ejecutes comandos destructivos sin aprobación.`
                            : `User rejected the command: "${args.command}". Do not execute destructive commands without approval.`;
                        this.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: rejected });
                        continue;
                    }
                }
            }
            let result;
            try {
                result = await this.toolManager.executeTool(toolName, args);
                this.renderer.printToolResult(this.role, toolName, result);
                this.consecutiveToolErrors = 0; // Reset on success
            }
            catch (error) {
                result = `Error: ${error instanceof Error ? error.message : String(error)}`;
                this.renderer.printError(this.role, result);
                this.consecutiveToolErrors++;
            }
            this.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result
            });
        }
    }
}
exports.WorkerAgent = WorkerAgent;
//# sourceMappingURL=WorkerAgent.js.map