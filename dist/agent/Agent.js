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
exports.Agent = void 0;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ToolManager_1 = require("../tools/ToolManager");
const MarkdownRenderer_1 = require("../utils/MarkdownRenderer");
const UIHelper_1 = require("../utils/UIHelper");
const KeyboardHandler_1 = require("../utils/KeyboardHandler");
const system_prompt_v5_1 = require("../prompts/system-prompt-v5");
const system_prompt_v6_compact_1 = require("../prompts/system-prompt-v6-compact");
const SessionManager_1 = require("../session/SessionManager");
const SnapshotManager_1 = require("../snapshot/SnapshotManager");
const ErrorRecovery_1 = require("../utils/ErrorRecovery");
const RoadmapParser_1 = require("../planning/RoadmapParser");
class Agent {
    config;
    modelManager;
    toolManager;
    workingDir;
    messages = [];
    systemPromptInitialized = false;
    sessionManager;
    snapshotManager;
    currentSessionId;
    currentTaskTodos = []; // Track pending TODOs (legacy V4)
    originalUserRequest; // Remember the original request
    currentRoadmap; // Current roadmap for V5 mode
    isWaitingForContinuation = false; // Flag for sprint/step modes
    constructor(config, modelManager, workingDir, sessionManager, snapshotManager) {
        this.config = config;
        this.modelManager = modelManager;
        this.workingDir = workingDir;
        this.sessionManager = sessionManager || new SessionManager_1.SessionManager(true, 5);
        this.snapshotManager = snapshotManager || new SnapshotManager_1.SnapshotManager(50);
        // Initialize ToolManager AFTER SnapshotManager so it can be passed to tools
        this.toolManager = new ToolManager_1.ToolManager(config, workingDir, this.snapshotManager);
    }
    /**
     * Reinitialize system prompt (used when switching models mid-conversation)
     */
    reinitializeSystemPrompt() {
        // Remove old system prompt if exists
        if (this.messages.length > 0 && this.messages[0].role === 'system') {
            this.messages.shift(); // Remove old system message
        }
        // Mark as not initialized so it gets recreated
        this.systemPromptInitialized = false;
        // Reinitialize with current context
        this.initializeSystemPrompt();
    }
    initializeSystemPrompt() {
        if (this.systemPromptInitialized)
            return;
        // Detect if current model has small context window (< 20K tokens)
        // Use compact prompt for Groq models and GPT-3.5
        const currentModel = this.modelManager.getCurrentModelName();
        const useCompactPrompt = currentModel.includes('groq') ||
            currentModel.includes('llama') ||
            currentModel.includes('qwen') ||
            currentModel.includes('gpt-3.5') ||
            currentModel.includes('3.5-turbo');
        // Use V6 compact for small models, V5 for large models
        const basePrompt = useCompactPrompt ? (0, system_prompt_v6_compact_1.getSystemPromptV6Compact)() : (0, system_prompt_v5_1.getSystemPromptV5)();
        // Get execution mode from config (with fallback for old configs)
        const executionMode = this.config.get('agent').executionMode || 'sprint';
        // Add context-specific information
        const tools = this.toolManager.getToolList();
        const toolsList = tools.map(t => `- ${t.name}`).join('\n'); // Compact: just names
        let contextualPrompt;
        if (useCompactPrompt) {
            // COMPACT VERSION - Minimal context for small models
            contextualPrompt = `${basePrompt}

# SESSION
Working Dir: ${this.workingDir}
Model: ${this.modelManager.getCurrentModelName()}
Mode: ${executionMode}

Tools: ${toolsList}

Max iterations: ${this.config.get('agent').maxIterations}`;
        }
        else {
            // FULL VERSION - Complete context for large models
            contextualPrompt = `${basePrompt}

# YOUR CURRENT SESSION

**Working Directory**: ${this.workingDir}
**Active Model**: ${this.modelManager.getCurrentModelName()}
**EXECUTION_MODE**: ${executionMode}

**Available Tools**:
${toolsList}

# EXECUTION MODE INSTRUCTIONS

Your current execution mode is: **${executionMode.toUpperCase()}**

${executionMode === 'unstoppable' ? `
✅ UNSTOPPABLE MODE:
- Generate roadmap for complex tasks
- Execute ALL sprints and tasks automatically
- NEVER stop between tasks or sprints
- Only stop for critical unrecoverable errors
- Show progress continuously
- Complete 100% before reporting
` : ''}

${executionMode === 'sprint' ? `
🏃 SPRINT-BY-SPRINT MODE (CURRENT):
- Generate roadmap for complex tasks
- Execute ONE full sprint at a time
- After sprint completes, show summary
- STOP and wait for user confirmation
- Say: "SPRINT X completed. Ready for SPRINT Y? (waiting for user confirmation)"
- When user says continue/yes, execute next sprint
` : ''}

${executionMode === 'step-by-step' ? `
👣 STEP-BY-STEP MODE:
- Generate roadmap for complex tasks
- Execute ONE task at a time
- After task completes, STOP
- Say: "Task X.Y completed. Next: Task X.Z - [description]. Continue? (waiting for user)"
- When user says continue/yes, execute next task
` : ''}

# CRITICAL CAPABILITIES

✅ **YOU CAN EXECUTE BASH COMMANDS** - npm install, pip install, npm run dev, etc.
✅ **YOU CAN READ AND WRITE FILES** - read, write, edit tools
✅ **YOU CAN SEARCH CODE** - grep, glob tools
✅ **BE PROACTIVE** - EXECUTE, don't just describe

# REMEMBER FOR THIS SESSION

1. **EXECUTE commands proactively** - Don't say "you need to run", just run it
2. **Generate roadmaps for complex tasks** - Create structured sprint plans
3. **Follow execution mode rules** - Stop at appropriate checkpoints
4. **Never lose context** - Roadmap persists throughout session
5. Reference files as: file_path:line_number
6. Be concise, factual, and specific

Agent loop: ${this.config.get('agent').maxIterations} iterations max.
Use them ALL if needed to complete tasks.`;
        }
        // Add system message
        this.messages.unshift({
            role: 'system',
            content: contextualPrompt
        });
        this.systemPromptInitialized = true;
    }
    /**
     * Detect TODOs in assistant response and track them
     */
    detectAndTrackTodos(content) {
        // Look for TODO declarations like "☐ Step 1: ..." or "□ 1. ..."
        const todoLines = content.match(/[☐□✓✅]\s*(?:Step\s*)?\d+[:.]/gi);
        if (!todoLines || todoLines.length === 0) {
            return { hasTodos: false, pendingCount: 0 };
        }
        // Count completed vs pending
        const completed = content.match(/[✓✅]\s*(?:Step\s*)?\d+[:.]/gi);
        const pending = content.match(/[☐□]\s*(?:Step\s*)?\d+[:.]/gi);
        const completedCount = completed ? completed.length : 0;
        const pendingCount = pending ? pending.length : 0;
        return {
            hasTodos: true,
            pendingCount: pendingCount
        };
    }
    /**
     * Determine if agent should auto-continue based on response
     */
    shouldAutoContinue(content, hadToolCalls, iteration, maxIterations) {
        // Don't auto-continue if near max iterations
        if (iteration >= maxIterations - 2) {
            return false;
        }
        const contentLower = content.toLowerCase();
        // 🚫 CRITICAL: Detect response loops - if same message repeated, STOP
        if (this.messages.length >= 2) {
            const lastAssistantMessages = this.messages
                .filter(m => m.role === 'assistant' && m.content)
                .slice(-3); // Last 3 assistant messages
            if (lastAssistantMessages.length >= 2) {
                const currentContent = content.trim().substring(0, 200); // First 200 chars
                const previousContent = lastAssistantMessages[lastAssistantMessages.length - 2].content?.trim().substring(0, 200);
                // If responding with same content as previous message, it's a loop
                if (currentContent === previousContent) {
                    console.log(chalk_1.default.yellow('  ⚠️  Response loop detected - stopping auto-continue'));
                    return false;
                }
            }
        }
        // 🎯 CRITICAL: If roadmap is 100% complete, DON'T auto-continue
        // Allow natural conversation about the completed project
        if (this.currentRoadmap) {
            const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
            const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
            if (progress.percentComplete === 100) {
                // Roadmap is 100% done - allow conversation, don't force execution
                // UNLESS user explicitly says "continua" or asks for more work
                const isExplicitContinuation = contentLower.includes('continua') ||
                    contentLower.includes('continue') ||
                    contentLower.includes('sigue') ||
                    contentLower.includes('next');
                if (!isExplicitContinuation) {
                    return false; // Don't auto-continue on completed roadmap
                }
            }
        }
        // Check for pending TODOs
        const todoStatus = this.detectAndTrackTodos(content);
        if (todoStatus.hasTodos && todoStatus.pendingCount > 0) {
            return true; // Has pending TODOs, must continue
        }
        // Check if response indicates it will continue but didn't use tools
        const incompletePhrases = [
            'voy a', 'vamos a', 'ahora voy', 'ahora vamos',
            'i will', "i'll", 'let me', "let's",
            'continuaré', 'continuare', 'seguiré', 'seguire',
            'next i', 'now i', 'going to', 'continuando',
            'proceeding', 'starting', 'beginning', 'iniciando',
            'shall we proceed', 'would you like me to',
            'vou fazer', 'vou tentar', // Portuguese
        ];
        const soundsIncomplete = incompletePhrases.some(phrase => contentLower.includes(phrase));
        if (soundsIncomplete && !hadToolCalls) {
            return true; // Said it will do something but didn't
        }
        // Check if showing roadmap progress indicators without tool calls
        const hasRoadmapProgress = content.includes('⏳ [SPRINT') || content.includes('☐ [SPRINT') ||
            content.includes('EXECUTING:') || content.includes('SPRINT') && content.includes('[');
        if (hasRoadmapProgress && !hadToolCalls) {
            return true; // Showing roadmap status but not executing
        }
        // Check if showing code in markdown instead of writing it
        const hasCodeBlock = content.includes('```') || content.includes('┌─') || content.includes('│');
        const mentionsWriting = contentLower.includes('agregar') || contentLower.includes('código') ||
            contentLower.includes('add') || contentLower.includes('code') ||
            contentLower.includes('implement') || contentLower.includes('create');
        if (hasCodeBlock && mentionsWriting && !hadToolCalls) {
            return true; // Showed code instead of writing it
        }
        return false; // Looks complete
    }
    async process(userInput) {
        const inputLower = userInput.toLowerCase().trim();
        // Detect if this is a continuation request
        const isContinuation = [
            'continua', 'continue', 'sigue', 'keep going', 'go on',
            'se detuvo', 'it stopped', 'avanza', 'proceed'
        ].some(phrase => inputLower.includes(phrase));
        // Store original request for context (only if not a continuation)
        if (!isContinuation) {
            if (!this.originalUserRequest && userInput && !userInput.startsWith('/')) {
                this.originalUserRequest = userInput;
            }
        }
        // Initialize system prompt on first message
        this.initializeSystemPrompt();
        // For continuation requests, remind the agent of the original task
        let effectiveInput = userInput;
        if (isContinuation && this.originalUserRequest) {
            effectiveInput = `Continue with the original task: "${this.originalUserRequest}". ${userInput}`;
        }
        // Add user message
        this.messages.push({
            role: 'user',
            content: effectiveInput
        });
        const maxIterations = this.config.get('agent').maxIterations;
        // Set up abort handler for ESC key
        let isAborted = false;
        KeyboardHandler_1.KeyboardHandler.startListening(() => {
            isAborted = true;
            UIHelper_1.UIHelper.stopSpinner();
            console.log(chalk_1.default.yellow('\n  ⚠️  Operation cancelled by user (ESC pressed)\n'));
        });
        // Agent loop
        for (let i = 0; i < maxIterations; i++) {
            // Check if user pressed ESC
            if (isAborted) {
                KeyboardHandler_1.KeyboardHandler.stopListening();
                break;
            }
            try {
                const tools = this.toolManager.getToolSchemas();
                // Determine action type and show appropriate message
                const actionMessage = this.getActionMessage(userInput);
                UIHelper_1.UIHelper.startSpinner(actionMessage);
                // Get response from model
                const response = await this.modelManager.chat(this.messages, tools);
                const message = response.choices[0].message;
                // Stop spinner
                UIHelper_1.UIHelper.stopSpinner();
                // Print assistant response
                if (message.content) {
                    UIHelper_1.UIHelper.showAssistantHeader();
                    // Render markdown with proper indentation
                    MarkdownRenderer_1.MarkdownRenderer.render(message.content);
                    console.log();
                }
                // Add message to history
                this.messages.push(message);
                // 🔍 CRITICAL: Detect and parse new roadmap from model's response
                if (message.content) {
                    const hasRoadmapText = RoadmapParser_1.RoadmapParser.hasRoadmap(message.content);
                    if (hasRoadmapText) {
                        console.log(chalk_1.default.blue('\n  🔍 Roadmap detected in response, parsing...'));
                        const detectedRoadmap = RoadmapParser_1.RoadmapParser.parseRoadmap(message.content, this.originalUserRequest || '');
                        if (detectedRoadmap) {
                            // New roadmap detected - replace the old one
                            console.log(chalk_1.default.yellow(`  📋 New roadmap detected: ${detectedRoadmap.projectName}`));
                            // Check if this is a different project than the current one
                            const isDifferentProject = !!(this.currentRoadmap &&
                                this.currentRoadmap.projectName !== detectedRoadmap.projectName);
                            if (isDifferentProject && this.currentRoadmap) {
                                console.log(chalk_1.default.yellow(`  ⚠️  Replacing old roadmap: ${this.currentRoadmap.projectName}`));
                            }
                            // 🔧 CRITICAL FIX: Always update originalUserRequest when we get a new roadmap
                            // This prevents confusion between old and new projects from previous sessions
                            if (detectedRoadmap.originalRequest) {
                                // Only update if it's different or if we had a previous roadmap
                                if (isDifferentProject || this.currentRoadmap || !this.originalUserRequest) {
                                    this.originalUserRequest = detectedRoadmap.originalRequest;
                                    console.log(chalk_1.default.blue(`  🔄 Updated context to new project: "${this.originalUserRequest}"`));
                                }
                            }
                            this.currentRoadmap = detectedRoadmap;
                            console.log(chalk_1.default.green(`  ✅ Roadmap loaded: ${detectedRoadmap.totalTasks} tasks across ${detectedRoadmap.sprints.length} sprints`));
                            // 📄 Save roadmap to ROADMAP.md file
                            await this.saveRoadmapToFile();
                        }
                        else {
                            console.log(chalk_1.default.red('  ✗ Failed to parse roadmap from text'));
                        }
                    }
                    else if (this.currentRoadmap) {
                        // Update existing roadmap status from text
                        this.currentRoadmap = RoadmapParser_1.RoadmapParser.updateRoadmapFromText(this.currentRoadmap, message.content);
                    }
                }
                // Auto-save session if needed
                await this.autoSaveSession();
                // Check for tool calls
                if (!message.tool_calls || message.tool_calls.length === 0) {
                    const content = message.content || '';
                    // Use new comprehensive auto-continue logic
                    if (this.shouldAutoContinue(content, false, i, maxIterations)) {
                        // Detect TODO status for better continuation message
                        const todoStatus = this.detectAndTrackTodos(content);
                        let continuationPrompt = '';
                        // If there's an active roadmap, be specific based on completion status
                        if (this.currentRoadmap) {
                            const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
                            const currentTask = RoadmapPlanner.getCurrentTask(this.currentRoadmap);
                            const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
                            // Only be aggressive if roadmap is NOT complete
                            if (currentTask && progress.percentComplete < 100) {
                                continuationPrompt = `STOP TALKING. EXECUTE NOW.

You are announcing but NOT executing. USE TOOL CALLS to do the actual work.

Current task: [${currentTask.id}] ${currentTask.description}

IMMEDIATE ACTION REQUIRED:
1. If this is a setup task (npm create, git init, etc.) - USE bash tool NOW
2. If this is a coding task - USE write/edit tools NOW
3. If you need to read files first - USE read/glob tools NOW

DO NOT respond with text. ONLY tool calls. Execute the current task RIGHT NOW.`;
                            }
                            else {
                                // Roadmap complete or no current task - allow normal conversation
                                continuationPrompt = 'Continue with tool calls if needed, or provide a conversational response.';
                            }
                        }
                        else if (todoStatus.hasTodos && todoStatus.pendingCount > 0) {
                            // Has pending TODOs
                            continuationPrompt = `You have ${todoStatus.pendingCount} pending TODO steps. Continue IMMEDIATELY with the next step. Execute tool calls NOW without announcing. Remember the original request: "${this.originalUserRequest}"`;
                        }
                        else {
                            // Other incomplete indicators
                            continuationPrompt = 'Continue immediately with the tool calls you mentioned. Execute them NOW without announcing. DO NOT show code in markdown blocks - use write/edit tools to create actual files.';
                        }
                        this.messages.push({
                            role: 'user',
                            content: continuationPrompt
                        });
                        continue; // Go back to model with continuation prompt
                    }
                    // No auto-continue needed, task appears complete
                    break;
                }
                // Execute tools
                await this.executeToolCalls(message.tool_calls);
                // Auto-complete tasks if files were created
                if (this.currentRoadmap) {
                    await this.autoCompleteTasksByFiles();
                    await this.saveRoadmapToFile(); // Update ROADMAP.md after auto-completing
                    // 🎯 CRITICAL: Check if roadmap is 100% complete and stop immediately
                    const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
                    const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
                    if (progress.percentComplete === 100) {
                        console.log(chalk_1.default.green(`\n  🎉 Roadmap completed! All ${progress.totalTasks} tasks done.`));
                        break; // Exit agent loop immediately
                    }
                }
            }
            catch (error) {
                UIHelper_1.UIHelper.clearStatus();
                UIHelper_1.UIHelper.showError(error instanceof Error ? error.message : String(error));
                // If it's a connection error, give helpful message
                if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch'))) {
                    console.log(chalk_1.default.yellow('  ⚠  Local LLM server is not running.'));
                    console.log(chalk_1.default.dim('     Start it with: ') + chalk_1.default.white('python api/server.py'));
                    console.log(chalk_1.default.dim('     Or switch models: ') + chalk_1.default.white('/models gpt4'));
                    console.log();
                }
                break;
            }
        }
        // Cleanup: Stop listening for ESC key
        KeyboardHandler_1.KeyboardHandler.stopListening();
    }
    /**
     * Determine appropriate action message based on user input
     */
    getActionMessage(userInput) {
        const input = userInput.toLowerCase();
        // Programming/Implementation
        if (input.includes('create') || input.includes('implement') || input.includes('add') ||
            input.includes('build') || input.includes('write') || input.includes('code')) {
            return 'Programming...';
        }
        // Analysis
        if (input.includes('analyze') || input.includes('review') || input.includes('check') ||
            input.includes('examine') || input.includes('inspect')) {
            return 'Analyzing...';
        }
        // Reading/Understanding
        if (input.includes('read') || input.includes('explain') || input.includes('what') ||
            input.includes('how') || input.includes('show') || input.includes('display')) {
            return 'Reading...';
        }
        // Debugging
        if (input.includes('debug') || input.includes('fix') || input.includes('error') ||
            input.includes('bug') || input.includes('problem') || input.includes('issue')) {
            return 'Debugging...';
        }
        // Refactoring
        if (input.includes('refactor') || input.includes('improve') || input.includes('optimize') ||
            input.includes('clean')) {
            return 'Refactoring...';
        }
        // Testing
        if (input.includes('test') || input.includes('verify')) {
            return 'Testing...';
        }
        // Searching
        if (input.includes('find') || input.includes('search') || input.includes('locate')) {
            return 'Searching...';
        }
        // Default
        return 'Thinking...';
    }
    async executeToolCalls(toolCalls) {
        for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments);
            // Show tool call
            if (this.config.get('ui').showToolCalls) {
                UIHelper_1.UIHelper.showToolExecution(toolName, args);
            }
            // Check if confirmation needed
            const tool = this.toolManager.getTool(toolName);
            if (tool && tool.needsConfirmation(this.config)) {
                // TODO: Implement confirmation prompt
            }
            // Get contextual message for tool
            const toolMessage = this.getToolMessage(toolName, args);
            UIHelper_1.UIHelper.startSpinner(toolMessage);
            // Execute tool with automatic error recovery
            let result;
            let maxRetries = 3;
            let retryCount = 0;
            let currentToolName = toolName;
            let currentArgs = args;
            while (retryCount < maxRetries) {
                try {
                    result = await this.toolManager.executeTool(currentToolName, currentArgs);
                    const preview = result.slice(0, 150).replace(/\n/g, ' ');
                    UIHelper_1.UIHelper.stopSpinner();
                    UIHelper_1.UIHelper.showToolSuccess(preview + (result.length > 150 ? '...' : ''));
                    break; // Success - exit retry loop
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    result = `Error: ${errorMessage}`;
                    // Analyze error for automatic recovery
                    const recovery = ErrorRecovery_1.ErrorRecovery.analyzeError(errorMessage, currentToolName, currentArgs);
                    if (recovery.detected && recovery.autoFix && retryCount < maxRetries - 1) {
                        UIHelper_1.UIHelper.stopSpinner();
                        UIHelper_1.UIHelper.showToolError(result);
                        console.log(chalk_1.default.yellow(`  ↻ ${recovery.suggestion}`));
                        // Try automatic fix
                        currentToolName = recovery.autoFix.tool;
                        currentArgs = recovery.autoFix.args;
                        retryCount++;
                        // Restart spinner for retry
                        const retryMessage = this.getToolMessage(currentToolName, currentArgs);
                        UIHelper_1.UIHelper.startSpinner(retryMessage);
                    }
                    else {
                        // No automatic recovery or max retries reached
                        UIHelper_1.UIHelper.stopSpinner();
                        UIHelper_1.UIHelper.showToolError(result);
                        if (recovery.detected && !recovery.autoFix) {
                            // Show suggestion even if no auto-fix
                            console.log(chalk_1.default.yellow(`\n  💡 Suggestion:\n${recovery.suggestion}`));
                        }
                        break; // Exit retry loop
                    }
                }
            }
            // Add tool result
            this.messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: result
            });
        }
    }
    /**
     * Get contextual message for tool execution
     */
    getToolMessage(toolName, args) {
        switch (toolName) {
            case 'read':
                return `Reading ${args.file_path}...`;
            case 'write':
                return `Writing to ${args.file_path}...`;
            case 'edit':
                return `Editing ${args.file_path}...`;
            case 'bash':
                return `Running command...`;
            case 'grep':
                return `Searching for "${args.pattern}"...`;
            case 'glob':
                return `Finding files matching "${args.pattern}"...`;
            default:
                return `Running ${toolName}...`;
        }
    }
    /**
     * Auto-complete tasks based on recently created/modified files
     * Checks if files exist in working directory and match task descriptions
     * IMPORTANT: Checks ALL pending tasks, not just the current one
     */
    async autoCompleteTasksByFiles() {
        if (!this.currentRoadmap)
            return;
        // Get list of files in working directory
        try {
            const files = fs.readdirSync(this.workingDir);
            // Check ALL pending/in-progress tasks across ALL sprints
            for (const sprint of this.currentRoadmap.sprints) {
                for (const task of sprint.tasks) {
                    // Skip already completed tasks
                    if (task.status === 'completed') {
                        continue;
                    }
                    const taskDesc = task.description.toLowerCase();
                    // Check if any file matches this task's description
                    for (const file of files) {
                        const fileLower = file.toLowerCase();
                        // Skip ROADMAP.md and test files
                        if (fileLower === 'roadmap.md' || fileLower.includes('test-runner') || fileLower.includes('automated-test')) {
                            continue;
                        }
                        // Check if file is mentioned in task description
                        if (taskDesc.includes(fileLower) || taskDesc.includes(fileLower.replace(/\.\w+$/, ''))) {
                            const filePath = path.join(this.workingDir, file);
                            const stats = fs.statSync(filePath);
                            // Only mark as completed if file is not empty
                            if (stats.isFile() && stats.size > 0) {
                                task.status = 'completed';
                                task.completedAt = new Date();
                                if (!task.filesCreated) {
                                    task.filesCreated = [];
                                }
                                if (!task.filesCreated.includes(file)) {
                                    task.filesCreated.push(file);
                                }
                                console.log(chalk_1.default.green(`  ✓ Task ${task.id} auto-completed (file ${file} verified)`));
                                // Don't break - continue checking other files
                                // (a task might create multiple files)
                            }
                        }
                    }
                }
            }
            // After checking all tasks, update currentTaskId to the first non-completed task
            const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
            for (const sprint of this.currentRoadmap.sprints) {
                for (const task of sprint.tasks) {
                    if (task.status !== 'completed') {
                        this.currentRoadmap.currentTaskId = task.id;
                        return; // Found first pending task
                    }
                }
            }
            // If we get here, all tasks are completed
            this.currentRoadmap.currentTaskId = undefined;
        }
        catch (error) {
            // Silent fail - don't interrupt execution if file check fails
            console.log(chalk_1.default.dim(`  [AutoComplete] Could not check files: ${error}`));
        }
    }
    getAvailableTools() {
        return this.toolManager.getToolList();
    }
    getContextInfo() {
        const totalChars = this.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
        return {
            'Messages': this.messages.length,
            'Total characters': totalChars,
            'Working directory': this.workingDir,
            'Model': this.modelManager.getCurrentModelName()
        };
    }
    clearContext() {
        this.messages = [];
        this.systemPromptInitialized = false;
        this.currentTaskTodos = [];
        this.originalUserRequest = undefined;
        this.currentRoadmap = undefined;
        this.isWaitingForContinuation = false;
    }
    /**
     * Get current roadmap (if any)
     */
    getRoadmap() {
        return this.currentRoadmap;
    }
    /**
     * Set execution mode
     */
    setExecutionMode(mode) {
        this.config.set('agent', {
            ...this.config.get('agent'),
            executionMode: mode
        });
    }
    /**
     * Notify mode switch and update system prompt immediately
     */
    notifyModeSwitch(newMode) {
        // Update the mode first
        this.setExecutionMode(newMode);
        // Reinitialize system prompt with new mode
        this.reinitializeSystemPrompt();
        // If there's an active roadmap, add a transition message
        if (this.currentRoadmap) {
            const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
            const currentTask = RoadmapPlanner.getCurrentTask(this.currentRoadmap);
            const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
            const modeIcons = {
                'unstoppable': '⚡',
                'sprint': '🏃',
                'step-by-step': '👣'
            };
            let transitionMessage = `[EXECUTION MODE CHANGED TO: ${modeIcons[newMode]} ${newMode.toUpperCase()}]\n\n`;
            transitionMessage += `📋 ROADMAP CONTEXT PRESERVED:\n`;
            transitionMessage += `- Project: ${this.currentRoadmap.projectName}\n`;
            transitionMessage += `- Progress: ${progress.completedTasks}/${progress.totalTasks} tasks (${progress.percentComplete}%)\n`;
            transitionMessage += `- Sprints: ${progress.completedSprints}/${progress.totalSprints} completed\n\n`;
            if (newMode === 'unstoppable') {
                transitionMessage += `⚡ UNSTOPPABLE MODE: Execute all remaining tasks automatically without stopping.\n`;
            }
            else if (newMode === 'sprint') {
                transitionMessage += `🏃 SPRINT MODE: Execute one sprint at a time, pause between sprints.\n`;
            }
            else if (newMode === 'step-by-step') {
                transitionMessage += `👣 STEP-BY-STEP MODE: Execute one task at a time, pause after each.\n`;
            }
            if (currentTask) {
                transitionMessage += `\nCurrent task: [${currentTask.id}] ${currentTask.description}\n`;
                transitionMessage += `Continue from this task following the new execution mode.`;
            }
            else {
                transitionMessage += `\nAll tasks completed. Roadmap is finished.`;
            }
            // Add as user message for context
            this.messages.push({
                role: 'user',
                content: transitionMessage
            });
        }
    }
    /**
     * Get current execution mode
     */
    getExecutionMode() {
        return this.config.get('agent').executionMode || 'sprint';
    }
    /**
     * Notify model switch and preserve context
     */
    notifyModelSwitch(newModelName) {
        // Reinitialize system prompt with new model name
        this.reinitializeSystemPrompt();
        // If there's an active roadmap, add a transition message
        if (this.currentRoadmap) {
            const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
            const currentTask = RoadmapPlanner.getCurrentTask(this.currentRoadmap);
            const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
            let transitionMessage = `[MODEL SWITCHED TO: ${newModelName}]\n\n`;
            transitionMessage += `📋 CONTEXT PRESERVED:\n`;
            transitionMessage += `- Project: ${this.currentRoadmap.projectName}\n`;
            transitionMessage += `- Progress: ${progress.completedTasks}/${progress.totalTasks} tasks (${progress.percentComplete}%)\n`;
            transitionMessage += `- Sprints: ${progress.completedSprints}/${progress.totalSprints} completed\n`;
            if (currentTask) {
                transitionMessage += `- Current Task: [${currentTask.id}] ${currentTask.description}\n`;
                transitionMessage += `\nContinue from task [${currentTask.id}] in Sprint ${currentTask.sprintId}.`;
            }
            else {
                transitionMessage += `\nAll tasks completed. Roadmap is finished.`;
            }
            // Add as system-like message for context
            this.messages.push({
                role: 'user',
                content: transitionMessage
            });
        }
        else if (this.originalUserRequest) {
            // No roadmap but there's an original request
            let transitionMessage = `[MODEL SWITCHED TO: ${newModelName}]\n\n`;
            transitionMessage += `Original task: "${this.originalUserRequest}"\n`;
            transitionMessage += `Please continue from where the previous model left off.`;
            this.messages.push({
                role: 'user',
                content: transitionMessage
            });
        }
    }
    async saveConversation(filename) {
        if (!filename) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            filename = `conversation_${timestamp}.json`;
        }
        const convDir = path.join(process.cwd(), 'conversations');
        if (!fs.existsSync(convDir)) {
            fs.mkdirSync(convDir, { recursive: true });
        }
        const filepath = path.join(convDir, filename);
        const data = {
            timestamp: new Date().toISOString(),
            model: this.modelManager.getCurrentModelName(),
            workingDir: this.workingDir,
            messages: this.messages
        };
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        return filepath;
    }
    async loadConversation(filename) {
        const convDir = path.join(process.cwd(), 'conversations');
        const filepath = path.join(convDir, filename);
        if (!fs.existsSync(filepath)) {
            throw new Error(`Conversation not found: ${filename}`);
        }
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        this.messages = data.messages;
    }
    /**
     * Auto-save session based on message count
     */
    async autoSaveSession() {
        // Count user messages (excluding system messages)
        const userMessages = this.messages.filter(m => m.role === 'user');
        if (this.sessionManager.shouldAutosave(userMessages.length)) {
            try {
                this.currentSessionId = await this.sessionManager.saveSession(this.messages, this.modelManager.getCurrentModelName(), this.workingDir, this.currentSessionId, this.currentRoadmap, // 📋 Save roadmap to preserve sprint progress
                this.originalUserRequest // Save original request for context
                );
            }
            catch (error) {
                // Silent fail on auto-save - don't interrupt the user
                console.error('Auto-save failed:', error);
            }
        }
    }
    /**
     * Manually save current session
     */
    async saveSession() {
        this.currentSessionId = await this.sessionManager.saveSession(this.messages, this.modelManager.getCurrentModelName(), this.workingDir, this.currentSessionId, this.currentRoadmap, // 📋 Save roadmap
        this.originalUserRequest // Save original request
        );
        return this.currentSessionId;
    }
    /**
     * Load a session by ID
     */
    async loadSession(sessionId) {
        const session = await this.sessionManager.loadSession(sessionId);
        if (!session) {
            return false;
        }
        this.messages = session.messages;
        this.currentSessionId = sessionId;
        this.currentRoadmap = session.roadmap; // 📋 Restore roadmap
        this.originalUserRequest = session.originalUserRequest; // Restore original request
        this.systemPromptInitialized = false; // Will be re-initialized on next message
        return true;
    }
    /**
     * Load the last session automatically
     */
    async loadLastSession() {
        const session = await this.sessionManager.getLastSession();
        if (!session) {
            return false;
        }
        this.messages = session.messages;
        this.currentSessionId = session.id;
        this.currentRoadmap = session.roadmap; // 📋 Restore roadmap to continue sprints
        this.originalUserRequest = session.originalUserRequest; // Restore original request
        this.systemPromptInitialized = true; // Session already has system prompt
        return true;
    }
    /**
     * Get session manager for external use
     */
    getSessionManager() {
        return this.sessionManager;
    }
    /**
     * Get current session ID
     */
    getCurrentSessionId() {
        return this.currentSessionId;
    }
    /**
     * Get snapshot manager for external use
     */
    getSnapshotManager() {
        return this.snapshotManager;
    }
    /**
     * Undo last N operations
     */
    async undoOperations(count = 1) {
        return this.snapshotManager.undo(count, this.workingDir);
    }
    /**
     * Create a snapshot before destructive operation
     */
    async createSnapshot(operation, description, filePaths) {
        return this.snapshotManager.createSnapshot(operation, description, filePaths, this.workingDir);
    }
    /**
     * Save current roadmap to ROADMAP.md file in project directory
     */
    async saveRoadmapToFile() {
        if (!this.currentRoadmap) {
            return;
        }
        try {
            const roadmapPath = path.join(this.workingDir, 'ROADMAP.md');
            // Generate markdown content
            let content = `# ${this.currentRoadmap.projectName}\n\n`;
            content += `**Project Type**: ${this.currentRoadmap.projectType}\n`;
            content += `**Total Tasks**: ${this.currentRoadmap.totalTasks}\n`;
            content += `**Estimated Time**: ~${this.currentRoadmap.totalEstimatedMinutes} minutes\n`;
            content += `**Status**: ${this.currentRoadmap.status}\n`;
            content += `**Created**: ${this.currentRoadmap.createdAt.toLocaleString()}\n\n`;
            if (this.originalUserRequest) {
                content += `## Original Request\n\n`;
                content += `> ${this.originalUserRequest}\n\n`;
            }
            content += `## Sprints\n\n`;
            // Add each sprint
            for (const sprint of this.currentRoadmap.sprints) {
                const sprintStatus = sprint.status === 'completed' ? '✅' : sprint.status === 'in-progress' ? '⏳' : '☐';
                content += `### ${sprint.emoji} Sprint ${sprint.id}: ${sprint.name} ${sprintStatus}\n\n`;
                content += `**Estimated**: ~${sprint.estimatedMinutes} minutes\n\n`;
                // Add tasks
                for (const task of sprint.tasks) {
                    const taskStatus = task.status === 'completed' ? '✅' : task.status === 'in-progress' ? '⏳' : '☐';
                    content += `- ${taskStatus} **${task.id}** ${task.description}\n`;
                    if (task.filesCreated && task.filesCreated.length > 0) {
                        content += `  - Created: ${task.filesCreated.join(', ')}\n`;
                    }
                    if (task.filesModified && task.filesModified.length > 0) {
                        content += `  - Modified: ${task.filesModified.join(', ')}\n`;
                    }
                }
                content += `\n`;
            }
            // Calculate progress
            const completedTasks = this.currentRoadmap.sprints.reduce((sum, sprint) => sum + sprint.tasks.filter(t => t.status === 'completed').length, 0);
            const progress = Math.round((completedTasks / this.currentRoadmap.totalTasks) * 100);
            content += `## Progress\n\n`;
            content += `- **Completed Tasks**: ${completedTasks}/${this.currentRoadmap.totalTasks} (${progress}%)\n`;
            content += `- **Current Sprint**: ${this.currentRoadmap.currentSprintId}\n`;
            if (this.currentRoadmap.currentTaskId) {
                content += `- **Current Task**: ${this.currentRoadmap.currentTaskId}\n`;
            }
            content += `\n---\n`;
            content += `*Last updated: ${new Date().toLocaleString()}*\n`;
            // Write to file
            fs.writeFileSync(roadmapPath, content, 'utf-8');
            console.log(chalk_1.default.dim(`  💾 Roadmap saved to: ${roadmapPath}`));
        }
        catch (error) {
            console.error(chalk_1.default.red(`  ✗ Failed to save roadmap file: ${error}`));
        }
    }
}
exports.Agent = Agent;
//# sourceMappingURL=Agent.js.map