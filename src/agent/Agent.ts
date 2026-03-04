import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { Config } from '../config/Config';
import { ModelManager } from '../models/ModelManager';
import { ToolManager } from '../tools/ToolManager';
import { MarkdownRenderer } from '../utils/MarkdownRenderer';
import { UIHelper } from '../utils/UIHelper';
import { KeyboardHandler } from '../utils/KeyboardHandler';
import { getSystemPrompt } from '../prompts/system-prompt';
import { isCharlProject, getCharlKnowledgePack, getCharlBinPath } from '../knowledge/CharlKnowledge';
import { getSystemPromptV2 } from '../prompts/system-prompt-v2';
import { getSystemPromptV3 } from '../prompts/system-prompt-v3';
import { getSystemPromptV4 } from '../prompts/system-prompt-v4';
import { getSystemPromptV5 } from '../prompts/system-prompt-v5';
import { getSystemPromptV6Compact } from '../prompts/system-prompt-v6-compact';
import { SessionManager } from '../session/SessionManager';
import { SnapshotManager } from '../snapshot/SnapshotManager';
import { ErrorRecovery } from '../utils/ErrorRecovery';
import { RoadmapPlanner } from '../planning/RoadmapPlanner';
import { Roadmap, ExecutionMode } from '../planning/types';
import { RoadmapParser } from '../planning/RoadmapParser';
import { parseToolCallsFromContent } from '../utils/ToolCallParser';
import { detectLanguage, Lang, PROMPTS } from '../utils/LangStrings';
import { askConfirmation } from '../utils/ConfirmHelper';
import { BashTool } from '../tools/BashTool';

interface Message {
  role: string;
  content?: string;
  tool_calls?: any[];
  tool_call_id?: string;
}

export class Agent {
  private config: Config;
  private modelManager: ModelManager;
  private toolManager: ToolManager;
  private workingDir: string;
  private messages: Message[] = [];
  private systemPromptInitialized: boolean = false;
  private sessionManager: SessionManager;
  private snapshotManager: SnapshotManager;
  private currentSessionId?: string;
  private currentTaskTodos: string[] = []; // Track pending TODOs (legacy V4)
  private originalUserRequest?: string; // Remember the original request
  private currentRoadmap?: Roadmap; // Current roadmap for V5 mode
  private isWaitingForContinuation: boolean = false; // Flag for sprint/step modes
  private sessionExecutionMode?: string; // Overrides config executionMode for this session
  private sessionLanguage: Lang = 'en'; // Detected from user input, persists for the session
  private consecutiveAnnouncementsWithoutTools: number = 0; // Loop detection for announce-only responses

  constructor(config: Config, modelManager: ModelManager, workingDir: string, sessionManager?: SessionManager, snapshotManager?: SnapshotManager) {
    this.config = config;
    this.modelManager = modelManager;
    this.workingDir = workingDir;
    this.sessionManager = sessionManager || new SessionManager(true, 5);
    this.snapshotManager = snapshotManager || new SnapshotManager(50);
    // Initialize ToolManager AFTER SnapshotManager so it can be passed to tools
    this.toolManager = new ToolManager(config, workingDir, this.snapshotManager);
  }

  /** Expose detected session language to callers (e.g. CodeCLI → Orchestrator) */
  getSessionLanguage(): Lang {
    return this.sessionLanguage;
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

  private initializeSystemPrompt() {
    if (this.systemPromptInitialized) return;

    // Detect if current model has small context window (< 20K tokens)
    // Use compact prompt for Groq models and GPT-3.5
    const currentModel = this.modelManager.getCurrentModelName();
    const useCompactPrompt = currentModel.includes('groq') ||
                            currentModel.includes('llama') ||
                            currentModel.includes('qwen') ||
                            currentModel.includes('gpt-3.5') ||
                            currentModel.includes('3.5-turbo');

    // Use V6 compact for small models, V5 for large models
    const basePrompt = useCompactPrompt ? getSystemPromptV6Compact() : getSystemPromptV5();

    // Get execution mode from config (with fallback for old configs)
    const executionMode = this.config.get('agent').executionMode || 'sprint';

    // Add context-specific information
    const tools = this.toolManager.getToolList();
    const toolsList = tools.map(t => `- ${t.name}`).join('\n'); // Compact: just names

    let contextualPrompt;

    if (useCompactPrompt) {
      // COMPACT VERSION - Minimal context for small models
      contextualPrompt = `${basePrompt}

# YOUR ENVIRONMENT
You are running IN: ${this.workingDir}
You have REAL filesystem access to ALL files in this directory.
Model: ${this.modelManager.getCurrentModelName()} | Mode: ${executionMode}

Available tools (USE THEM — they work):
${toolsList}

Max iterations: ${this.config.get('agent').maxIterations}`;
    } else {
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

    // Charl language injection — PREPEND before base prompt when .ch/.charl files detected.
    // Placed at the TOP so the model sees it first, overriding Python/JS defaults.
    if (isCharlProject(this.workingDir)) {
      const charlPack = getCharlKnowledgePack(useCompactPrompt);
      const charlBin = getCharlBinPath();
      const runCmd = charlBin ? `${charlBin} run` : 'charl run';
      const charlHeader = `[CHARL PROJECT — MANDATORY RULES]
1. ALL Charl files MUST use .ch extension (e.g. network.ch, train.ch). NOT .py, NOT .charl.
2. NO import statements. NO charl.X syntax. Builtins are global: nn_linear(), optim_sgd_step(), etc.
3. Create .ch files with write tool, then run: bash(command="${runCmd} <file.ch>")
4. NEVER use numpy, torch, keras or any external library — Charl has everything built in.

${charlPack}

---
`;
      contextualPrompt = charlHeader + contextualPrompt;
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
  private detectAndTrackTodos(content: string): { hasTodos: boolean; pendingCount: number } {
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
  private shouldAutoContinue(content: string, hadToolCalls: boolean, iteration: number, maxIterations: number): boolean {
    // Don't auto-continue if near max iterations
    if (iteration >= maxIterations - 2) {
      return false;
    }

    const contentLower = content.toLowerCase();

    // Effective execution mode: session override takes priority over config
    const executionMode = this.sessionExecutionMode || this.config.get('agent').executionMode || 'sprint';

    // 🚫 Never auto-continue in step-by-step mode — always wait for user
    if (executionMode === 'step-by-step') {
      return false;
    }

    // 🚫 If model is asking for confirmation, stop and wait for user
    const confirmationPhrases = [
      'please confirm', 'do you want to proceed', 'shall i proceed',
      'waiting for user', 'waiting for confirmation', 'your confirmation',
      'continue?', 'shall i continue', 'would you like me to continue',
      'confirmar', 'deseas continuar', '¿continuar?', 'continuar?',
    ];
    if (confirmationPhrases.some(p => contentLower.includes(p))) {
      return false;
    }

    // 🚫 Detect response loops — exact match OR high similarity, AND cap on pure announcements
    if (this.messages.length >= 2) {
      const lastAssistantMessages = this.messages
        .filter(m => m.role === 'assistant' && m.content)
        .slice(-4);

      if (lastAssistantMessages.length >= 2) {
        const currentContent = content.trim().substring(0, 200);
        const previousContent = lastAssistantMessages[lastAssistantMessages.length - 2].content?.trim().substring(0, 200);

        // Exact match
        if (currentContent === previousContent) {
          console.log(chalk.yellow('  ⚠️  Response loop detected (exact) - stopping'));
          return false;
        }

        // High similarity: same first 80 chars (model generating slight variations of same response)
        if (currentContent.substring(0, 80) === previousContent?.substring(0, 80)) {
          console.log(chalk.yellow('  ⚠️  Response loop detected (similar) - stopping'));
          return false;
        }
      }
    }

    // 🚫 Cap consecutive announce-only responses to avoid infinite loops
    if (!hadToolCalls && this.consecutiveAnnouncementsWithoutTools >= 3) {
      console.log(chalk.yellow('  ⚠️  Model keeps announcing without acting - stopping to avoid loop'));
      this.consecutiveAnnouncementsWithoutTools = 0;
      return false;
    }

    // 🎯 If roadmap is 100% complete, DON'T auto-continue
    if (this.currentRoadmap) {
      const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
      const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);

      if (progress.percentComplete === 100) {
        return false;
      }
    }

    // Check for pending TODOs
    const todoStatus = this.detectAndTrackTodos(content);
    if (todoStatus.hasTodos && todoStatus.pendingCount > 0) {
      return true;
    }

    // Common "I will do X" announcement phrases in Spanish AND English
    const incompletePhrases = [
      // Spanish — announce without executing
      'voy a', 'vamos a', 'ahora voy', 'ahora vamos',
      'continuaré', 'seguiré', 'continuando', 'iniciando',
      'procederé', 'procederemos', 'realizaré', 'realizaremos',
      'implementaré', 'implementaremos', 'analizaré', 'analizaremos',
      'leeré', 'leeremos', 'crearé', 'crearemos',
      'ejecutaré', 'ejecutaremos', 'instalaré', 'instalaremos',
      'configuraré', 'configuraremos', 'mostraré', 'mostraremos',
      'revisaré', 'revisaremos', 'empezaré', 'comenzaré',
      'a continuación', 'luego haré', 'ahora leeré',
      'entendido. continuaré', 'entendido continuaré',
      'paso 1', 'paso 2', 'paso 3',
      // English — announce without executing
      "i'll", "i will", 'next i', 'now i', "let's", "let me",
      "i'm going to", 'first i', 'then i', 'finally i',
      "i'll start", "i'll create", "i'll read", "i'll check",
    ];

    // Check if response indicates it will do something but didn't use tools.
    // Trigger for ALL modes (sprint, unstoppable) — not just when roadmap is active.
    if (!hadToolCalls) {
      if (incompletePhrases.some(phrase => contentLower.includes(phrase))) {
        return true;
      }

      // Also continue if we have an active roadmap task (regardless of mode)
      if (this.currentRoadmap) {
        const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
        const currentTask = RoadmapPlanner.getCurrentTask(this.currentRoadmap);
        const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);
        if (currentTask && progress.percentComplete < 100) {
          return true;
        }
      }
    }

    // Check if showing roadmap SPRINT execution markers without tool calls
    const hasRoadmapExecution = content.includes('⏳ [SPRINT') || content.includes('EXECUTING:');
    if (hasRoadmapExecution && !hadToolCalls) {
      return true;
    }

    return false;
  }

  /**
   * Detect if user is asking about the current project/codebase
   */
  private isProjectQuery(input: string): boolean {
    const lower = input.toLowerCase();
    return [
      'el proyecto', 'the project', 'este proyecto', 'this project',
      'el código', 'the code', 'este código', 'this code',
      'la app', 'the app', 'esta app', 'this app',
      'ves el', 'puedes ver', 'puedes revisar', 'puedes revisarlo',
      'can you see', 'can you review', 'can you check',
      'analiza', 'analyze', 'review the', 'revisar el',
      'cómo está el', 'how does it look', 'how is the',
      'está listo', 'is it ready', 'puede levantarse',
      'qué archivos', 'qué tiene', 'what files', 'muéstrame', 'show me the',
      'mira el', 'look at the', 'check the project',
      'estructura', 'structure', 'arquitectura', 'architecture',
      'dependencias', 'dependencies',
    ].some(t => lower.includes(t));
  }

  /**
   * Detect if model responded with a refusal to access files
   */
  private isRefusalResponse(content: string): boolean {
    const lower = content.toLowerCase();
    return [
      'no tengo acceso directo',
      'no puedo ver',
      'no puedo acceder',
      'no puedo revisar',
      'no tengo la capacidad de revisar',
      'no tengo visibilidad',
      "i don't have access",
      'i cannot access',
      "i can't access",
      "don't have direct access",
      'cannot directly access',
      'no tengo acceso a',
      'sin acceso',
      'no puedo leer',
      'no puedo abrir',
    ].some(phrase => lower.includes(phrase));
  }

  /**
   * Get a snapshot of the current project for context injection.
   * Runs glob + reads key config files automatically.
   */
  private async getProjectContext(): Promise<string> {
    try {
      const filesRaw = await this.toolManager.executeTool('glob', { pattern: '**/*', path: this.workingDir });
      const files = filesRaw
        .split('\n')
        .map((f: string) => f.trim())
        .filter((f: string) => f && !f.startsWith('Error'));

      if (files.length === 0) {
        return `Working directory "${this.workingDir}" is empty — no files found.`;
      }

      let context = `PROJECT LOCATION: ${this.workingDir}\nFILES (${files.length}):\n${files.slice(0, 50).join('\n')}`;
      if (files.length > 50) context += `\n... and ${files.length - 50} more`;

      // Read the first key config file found
      const keyFiles = ['package.json', 'pyproject.toml', 'Cargo.toml', 'go.mod', 'composer.json', 'README.md'];
      for (const kf of keyFiles) {
        if (files.some((f: string) => f.endsWith(kf))) {
          try {
            const fileContent = await this.toolManager.executeTool('read', {
              file_path: path.join(this.workingDir, kf)
            });
            if (fileContent && !fileContent.startsWith('Error')) {
              context += `\n\n${kf}:\n${fileContent.slice(0, 800)}${fileContent.length > 800 ? '\n...(truncated)' : ''}`;
              break;
            }
          } catch { /* ignore */ }
        }
      }

      return context;
    } catch {
      return '';
    }
  }

  async process(userInput: string) {
    const inputLower = userInput.toLowerCase().trim();

    // Update session language from every non-command user message
    if (!userInput.startsWith('/') && userInput.trim().length > 3) {
      this.sessionLanguage = detectLanguage(userInput);
    }

    // Detect if this is a continuation request
    const isContinuation = [
      'continua', 'continue', 'sigue', 'keep going', 'go on',
      'se detuvo', 'it stopped', 'avanza', 'proceed'
    ].some(phrase => inputLower.includes(phrase));

    // Detect "no pares" / persistence phrases → activate unstoppable mode for this session
    const noParesPhrases = [
      'no pares', 'no te pares', 'no te detengas', 'sin parar', 'hazlo sin parar',
      'continúa hasta terminar', 'hasta que termines', 'hasta lograrlo',
      'hasta terminarlo', 'no te detengas hasta', 'sigue sin parar',
      'ejecuta todo', 'hazlo todo', 'complétalo todo', 'termínalo todo',
      'modo unstoppable', 'unstoppable', 'no stops', 'keep going',
      'no pares hasta', 'sin detenerte', 'sin detenerse',
    ];
    if (noParesPhrases.some(phrase => inputLower.includes(phrase))) {
      if (this.sessionExecutionMode !== 'unstoppable') {
        this.sessionExecutionMode = 'unstoppable';
        console.log(chalk.yellow('\n  ⚡ Unstoppable mode activated — executing without stops\n'));
      }
    }

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

    // Auto-inject project context for project-related queries.
    // This bypasses the model needing to "decide" to use tools — we fetch the info upfront.
    if (this.isProjectQuery(effectiveInput)) {
      const ctx = await this.getProjectContext();
      if (ctx) {
        effectiveInput = `${effectiveInput}\n\n[Auto-gathered project context:]\n${ctx}`;
      }
    }

    // Add user message
    this.messages.push({
      role: 'user',
      content: effectiveInput
    });

    const maxIterations = this.config.get('agent').maxIterations;

    // Set up abort handler for ESC key
    let isAborted = false;
    KeyboardHandler.startListening(() => {
      isAborted = true;
      UIHelper.stopSpinner();
      console.log(chalk.yellow('\n  ⚠️  Operation cancelled by user (ESC pressed)\n'));
    });

    // Track repeated tool calls to detect infinite loops
    let lastToolSignature: string | null = null;
    let repeatedToolCount = 0;

    // Agent loop
    for (let i = 0; i < maxIterations; i++) {
      // Check if user pressed ESC
      if (isAborted) {
        KeyboardHandler.stopListening();
        break;
      }

      try {
        const tools = this.toolManager.getToolSchemas();

        // Prune messages if context window is approaching limit
        this.pruneMessagesIfNeeded();

        // Determine action type and show appropriate message
        const actionMessage = this.getActionMessage(userInput);
        UIHelper.startSpinner(actionMessage);

        // Get response from model
        const response = await this.modelManager.chat(this.messages, tools);

        const message = response.choices[0].message;

        // Stop spinner
        UIHelper.stopSpinner();

        // Strip special tokens that local models (qwen, deepseek, codestral) sometimes
        // leak into their response content: <|im_start|>, <|im_end|>, <tool_response>, etc.
        if (message.content) {
          message.content = message.content
            .replace(/<\|im_start\|>\w*\n?/g, '')
            .replace(/<\|im_end\|>/g, '')
            .replace(/<\|endoftext\|>/g, '')
            .replace(/<tool_response>/g, '')
            .replace(/<\/tool_response>/g, '')
            .trim();
          if (!message.content) message.content = undefined as any;
        }

        // Filter: qwen/deepseek sometimes echo back a tool result as JSON {name, content}
        // instead of responding with natural language. Suppress this to avoid raw JSON output.
        if (message.content && message.content.trim().startsWith('{')) {
          try {
            const parsed = JSON.parse(message.content.trim());
            if (parsed && typeof parsed.name === 'string' && typeof parsed.content === 'string') {
              message.content = undefined as any; // Suppress tool-result echo
            }
          } catch { /* not valid JSON, keep as-is */ }
        }

        // Fallback: parse tool calls from content if model didn't use native tool_calls.
        // Local models (qwen, deepseek, etc.) sometimes emit tool calls as JSON in content
        // instead of the proper OpenAI tool_calls API format.
        if ((!message.tool_calls || message.tool_calls.length === 0) && message.content) {
          const { calls, cleanedContent } = parseToolCallsFromContent(message.content);
          if (calls.length > 0) {
            message.tool_calls = calls;
            message.content = cleanedContent; // Strip JSON from displayed output
          }
        }

        // Print assistant response (after stripping any embedded tool call JSON)
        if (message.content) {
          UIHelper.showAssistantHeader();

          // Render markdown with proper indentation
          MarkdownRenderer.render(message.content);

          console.log();
        }

        // Add message to history
        this.messages.push(message);

        // 🔍 CRITICAL: Detect and parse new roadmap from model's response
        if (message.content) {
          const hasRoadmapText = RoadmapParser.hasRoadmap(message.content);

          if (hasRoadmapText) {
            console.log(chalk.blue('\n  🔍 Roadmap detected in response, parsing...'));
            const detectedRoadmap = RoadmapParser.parseRoadmap(message.content, this.originalUserRequest || '');

            if (detectedRoadmap) {
              // New roadmap detected - replace the old one
              console.log(chalk.yellow(`  📋 New roadmap detected: ${detectedRoadmap.projectName}`));

              // Check if this is a different project than the current one
              const isDifferentProject = !!(this.currentRoadmap &&
                                        this.currentRoadmap.projectName !== detectedRoadmap.projectName);

              if (isDifferentProject && this.currentRoadmap) {
                console.log(chalk.yellow(`  ⚠️  Replacing old roadmap: ${this.currentRoadmap.projectName}`));
              }

              // 🔧 CRITICAL FIX: Always update originalUserRequest when we get a new roadmap
              // This prevents confusion between old and new projects from previous sessions
              if (detectedRoadmap.originalRequest) {
                // Only update if it's different or if we had a previous roadmap
                if (isDifferentProject || this.currentRoadmap || !this.originalUserRequest) {
                  this.originalUserRequest = detectedRoadmap.originalRequest;
                  console.log(chalk.blue(`  🔄 Updated context to new project: "${this.originalUserRequest}"`));
                }
              }

              this.currentRoadmap = detectedRoadmap;
              console.log(chalk.green(`  ✅ Roadmap loaded: ${detectedRoadmap.totalTasks} tasks across ${detectedRoadmap.sprints.length} sprints`));

              // 📄 Save roadmap to ROADMAP.md file
              await this.saveRoadmapToFile();
            } else {
              console.log(chalk.red('  ✗ Failed to parse roadmap from text'));
            }
          } else if (this.currentRoadmap) {
            // Update existing roadmap status from text
            this.currentRoadmap = RoadmapParser.updateRoadmapFromText(this.currentRoadmap, message.content);
          }
        }

        // Auto-save session if needed
        await this.autoSaveSession();

        // Refusal override: if the model claims it can't access files, auto-fetch context
        // and inject it so the model can answer properly on the next iteration.
        if (message.content && this.isRefusalResponse(message.content) &&
            (!message.tool_calls || message.tool_calls.length === 0)) {
          const ctx = await this.getProjectContext();
          const lang = this.sessionLanguage;
          const correction = ctx
            ? PROMPTS.refusalCorrectionWithContext[lang](ctx)
            : PROMPTS.refusalCorrectionNoContext[lang](this.workingDir);
          this.messages.push({ role: 'user', content: correction });
          continue;
        }

        // Check for tool calls
        if (!message.tool_calls || message.tool_calls.length === 0) {
          const content = message.content || '';

          // Use new comprehensive auto-continue logic
          if (this.shouldAutoContinue(content, false, i, maxIterations)) {
            this.consecutiveAnnouncementsWithoutTools++;

            // Detect TODO status for better continuation message
            const todoStatus = this.detectAndTrackTodos(content);

            let continuationPrompt = '';
            const effectiveMode = this.sessionExecutionMode || this.config.get('agent').executionMode || 'sprint';
            const lang = this.sessionLanguage;

            // If there's an active roadmap, be specific based on completion status
            if (this.currentRoadmap) {
              const { RoadmapPlanner } = require('../planning/RoadmapPlanner');
              const currentTask = RoadmapPlanner.getCurrentTask(this.currentRoadmap);
              const progress = RoadmapPlanner.calculateProgress(this.currentRoadmap);

              if (currentTask && progress.percentComplete < 100) {
                continuationPrompt = PROMPTS.stopTalkingExecuteRoadmap[lang](currentTask.id, currentTask.description);
              } else {
                continuationPrompt = PROMPTS.conversationalContinue[lang];
              }
            } else if (todoStatus.hasTodos && todoStatus.pendingCount > 0) {
              continuationPrompt = PROMPTS.pendingTodos[lang](todoStatus.pendingCount, this.originalUserRequest || '');
            } else {
              // Always use executeImmediately when model announces without acting
              continuationPrompt = PROMPTS.executeImmediately[lang](this.originalUserRequest || '');
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

        // Detect repeated tool calls — if model calls same tool+args twice in a row, inject a nudge
        const toolSig = message.tool_calls
          .map((tc: any) => `${tc.function.name}:${tc.function.arguments}`)
          .join('|');

        if (toolSig === lastToolSignature) {
          repeatedToolCount++;
          if (repeatedToolCount >= 2) {
            this.messages.push({
              role: 'user',
              content: PROMPTS.repeatedToolCall[this.sessionLanguage]
            });
            repeatedToolCount = 0;
            lastToolSignature = null;
            continue;
          }
        } else {
          lastToolSignature = toolSig;
          repeatedToolCount = 0;
        }

        // Reset announcement counter — model is actually using tools
        this.consecutiveAnnouncementsWithoutTools = 0;

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
            console.log(chalk.green(`\n  🎉 Roadmap completed! All ${progress.totalTasks} tasks done.`));
            break; // Exit agent loop immediately
          }
        }

      } catch (error) {
        UIHelper.clearStatus();
        UIHelper.showError(error instanceof Error ? error.message : String(error));

        // If it's a connection error, give helpful message
        if (error instanceof Error && (error.message.includes('ECONNREFUSED') || error.message.includes('fetch'))) {
          console.log(chalk.yellow('  ⚠  Local LLM server is not running.'));
          console.log(chalk.dim('     Start it with: ') + chalk.white('python api/server.py'));
          console.log(chalk.dim('     Or switch models: ') + chalk.white('/models gpt4'));
          console.log();
        }
        break;
      }
    }

    // Cleanup: Stop listening for ESC key
    KeyboardHandler.stopListening();
  }

  /**
   * Determine appropriate action message based on user input
   */
  private getActionMessage(userInput: string): string {
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

  /**
   * Prune messages to stay within the model's context window.
   * Strategy: keep system prompt + first user message (original request) + last N messages.
   * Tool result messages are especially large and get trimmed first.
   */
  private pruneMessagesIfNeeded() {
    const { getModelConfig } = require('../config/model-configs');
    const modelName = this.modelManager.getCurrentModelName();
    const config = getModelConfig(modelName);
    const contextWindow: number = config.contextWindow || 8192;

    // Rough token estimate: 1 token ≈ 4 chars
    const charBudget = contextWindow * 4 * 0.75; // Stay under 75% of window

    const totalChars = this.messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);

    if (totalChars <= charBudget) return;

    // Identify what to keep
    const systemMsg = this.messages[0]?.role === 'system' ? this.messages[0] : null;
    const nonSystemMessages = systemMsg ? this.messages.slice(1) : this.messages;

    // Always keep the last 6 messages (3 pairs of user/assistant) to preserve recent context
    const keepTail = 6;
    const tail = nonSystemMessages.slice(-keepTail);
    const head = nonSystemMessages.slice(0, 1); // First user message = original request

    // Rebuild: system + first user message + tail
    const pruned = [
      ...(systemMsg ? [systemMsg] : []),
      ...head,
      { role: 'system', content: '[Earlier conversation truncated to fit context window]' },
      ...tail,
    ];

    const prunedChars = pruned.reduce((sum, m) => sum + (m.content?.length || 0), 0);
    console.log(chalk.dim(`  ✂  Context pruned: ${Math.round(totalChars / 1000)}k → ${Math.round(prunedChars / 1000)}k chars`));

    this.messages = pruned;
  }

  private async executeToolCalls(toolCalls: any[]) {
    for (const toolCall of toolCalls) {
      const toolName = toolCall.function.name;
      let args: any;
      try {
        args = typeof toolCall.function.arguments === 'string'
          ? JSON.parse(toolCall.function.arguments)
          : toolCall.function.arguments;
      } catch {
        args = {};
      }

      // Show tool call
      if (this.config.get('ui').showToolCalls) {
        UIHelper.showToolExecution(toolName, args);
      }

      // Check if confirmation needed for destructive bash commands
      if (toolName === 'bash' && args.command) {
        const danger = BashTool.getDangerInfo(args.command);
        if (danger) {
          UIHelper.stopSpinner();
          const approved = await askConfirmation(args.command, danger);
          if (!approved) {
            // User rejected — tell model so it can propose an alternative
            const rejected = this.sessionLanguage === 'es'
              ? `El usuario rechazó el comando: "${args.command}". Propón una alternativa más segura o pregunta al usuario cómo proceder.`
              : `User rejected the command: "${args.command}". Propose a safer alternative or ask the user how to proceed.`;
            this.messages.push({ role: 'tool', tool_call_id: toolCall.id, content: rejected });
            continue;
          }
        }
      }

      // Get contextual message for tool
      const toolMessage = this.getToolMessage(toolName, args);
      UIHelper.startSpinner(toolMessage);

      // Execute tool with automatic error recovery
      let result: string;
      let maxRetries = 3;
      let retryCount = 0;
      let currentToolName = toolName;
      let currentArgs = args;

      while (retryCount < maxRetries) {
        try {
          result = await this.toolManager.executeTool(currentToolName, currentArgs);
          const preview = result.slice(0, 150).replace(/\n/g, ' ');

          UIHelper.stopSpinner();
          UIHelper.showToolSuccess(preview + (result.length > 150 ? '...' : ''));
          break; // Success - exit retry loop
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          result = `Error: ${errorMessage}`;

          // Analyze error for automatic recovery
          const recovery = ErrorRecovery.analyzeError(errorMessage, currentToolName, currentArgs);

          if (recovery.detected && recovery.autoFix && retryCount < maxRetries - 1) {
            UIHelper.stopSpinner();
            UIHelper.showToolError(result);
            console.log(chalk.yellow(`  ↻ ${recovery.suggestion}`));

            // Try automatic fix
            currentToolName = recovery.autoFix.tool;
            currentArgs = recovery.autoFix.args;
            retryCount++;

            // Restart spinner for retry
            const retryMessage = this.getToolMessage(currentToolName, currentArgs);
            UIHelper.startSpinner(retryMessage);
          } else {
            // No automatic recovery or max retries reached
            UIHelper.stopSpinner();
            UIHelper.showToolError(result);

            if (recovery.detected && !recovery.autoFix) {
              // Show suggestion even if no auto-fix
              console.log(chalk.yellow(`\n  💡 Suggestion:\n${recovery.suggestion}`));
            }
            break; // Exit retry loop
          }
        }
      }

      // Add tool result
      this.messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: result!
      });
    }
  }

  /**
   * Get contextual message for tool execution
   */
  private getToolMessage(toolName: string, args: any): string {
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
  private async autoCompleteTasksByFiles(): Promise<void> {
    if (!this.currentRoadmap) return;

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

            // Check if file is mentioned in task description.
            // NOTE: fileLower.replace(/\.\w+$/, '') strips extension. For dotfiles like
            // ".env" or ".browserslistrc" this produces "" — and taskDesc.includes("") is
            // ALWAYS true, which would incorrectly mark every task as complete. Guard with
            // a minimum length of 3 characters to avoid this.
            const fileBasename = fileLower.replace(/\.\w+$/, '');
            if (taskDesc.includes(fileLower) || (fileBasename.length >= 3 && taskDesc.includes(fileBasename))) {
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

                console.log(chalk.green(`  ✓ Task ${task.id} auto-completed (file ${file} verified)`));

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

    } catch (error) {
      // Silent fail - don't interrupt execution if file check fails
      console.log(chalk.dim(`  [AutoComplete] Could not check files: ${error}`));
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
  getRoadmap(): Roadmap | undefined {
    return this.currentRoadmap;
  }

  /**
   * Set execution mode
   */
  setExecutionMode(mode: ExecutionMode): void {
    this.config.set('agent', {
      ...this.config.get('agent'),
      executionMode: mode
    });
  }

  /**
   * Notify mode switch and update system prompt immediately
   */
  notifyModeSwitch(newMode: ExecutionMode) {
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
      } else if (newMode === 'sprint') {
        transitionMessage += `🏃 SPRINT MODE: Execute one sprint at a time, pause between sprints.\n`;
      } else if (newMode === 'step-by-step') {
        transitionMessage += `👣 STEP-BY-STEP MODE: Execute one task at a time, pause after each.\n`;
      }

      if (currentTask) {
        transitionMessage += `\nCurrent task: [${currentTask.id}] ${currentTask.description}\n`;
        transitionMessage += `Continue from this task following the new execution mode.`;
      } else {
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
  getExecutionMode(): ExecutionMode {
    return this.config.get('agent').executionMode || 'sprint';
  }

  /**
   * Notify model switch and preserve context
   */
  notifyModelSwitch(newModelName: string) {
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
      } else {
        transitionMessage += `\nAll tasks completed. Roadmap is finished.`;
      }

      // Add as system-like message for context
      this.messages.push({
        role: 'user',
        content: transitionMessage
      });
    } else if (this.originalUserRequest) {
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

  async saveConversation(filename?: string): Promise<string> {
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

  async loadConversation(filename: string) {
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
  private async autoSaveSession(): Promise<void> {
    // Count user messages (excluding system messages)
    const userMessages = this.messages.filter(m => m.role === 'user');

    if (this.sessionManager.shouldAutosave(userMessages.length)) {
      try {
        this.currentSessionId = await this.sessionManager.saveSession(
          this.messages,
          this.modelManager.getCurrentModelName(),
          this.workingDir,
          this.currentSessionId,
          this.currentRoadmap,  // 📋 Save roadmap to preserve sprint progress
          this.originalUserRequest  // Save original request for context
        );
      } catch (error) {
        // Silent fail on auto-save - don't interrupt the user
        console.error('Auto-save failed:', error);
      }
    }
  }

  /**
   * Manually save current session
   */
  async saveSession(): Promise<string> {
    this.currentSessionId = await this.sessionManager.saveSession(
      this.messages,
      this.modelManager.getCurrentModelName(),
      this.workingDir,
      this.currentSessionId,
      this.currentRoadmap,  // 📋 Save roadmap
      this.originalUserRequest  // Save original request
    );
    return this.currentSessionId;
  }

  /**
   * Load a session by ID
   */
  async loadSession(sessionId: string): Promise<boolean> {
    const session = await this.sessionManager.loadSession(sessionId);

    if (!session) {
      return false;
    }

    this.messages = session.messages;
    this.currentSessionId = sessionId;
    this.currentRoadmap = session.roadmap;  // 📋 Restore roadmap
    this.originalUserRequest = session.originalUserRequest;  // Restore original request
    this.systemPromptInitialized = false; // Will be re-initialized on next message
    return true;
  }

  /**
   * Load the last session automatically
   */
  async loadLastSession(): Promise<boolean> {
    const session = await this.sessionManager.getLastSession(this.workingDir);

    if (!session) {
      return false;
    }

    // Remove old system message — it will be regenerated fresh on next process()
    // This ensures the system prompt reflects the current working directory,
    // model, and any new knowledge (e.g. Charl language pack) that wasn't
    // present when the session was saved.
    const withoutSystem = session.messages.filter((m: any) => m.role !== 'system');
    this.messages = withoutSystem;
    this.currentSessionId = session.id;
    // Do NOT restore currentRoadmap on auto-load — prevents the model from
    // automatically re-executing old roadmap tasks (e.g. git clone) when the
    // user simply says "hola". The roadmap is still visible in message history
    // for context; the user can explicitly ask to resume it.
    this.currentRoadmap = undefined;
    this.originalUserRequest = session.originalUserRequest;
    this.systemPromptInitialized = false; // Force fresh re-initialization with current context
    return true;
  }

  /**
   * Get session manager for external use
   */
  getSessionManager(): SessionManager {
    return this.sessionManager;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | undefined {
    return this.currentSessionId;
  }

  /**
   * Get snapshot manager for external use
   */
  getSnapshotManager(): SnapshotManager {
    return this.snapshotManager;
  }

  /**
   * Undo last N operations
   */
  async undoOperations(count: number = 1): Promise<{
    success: boolean;
    message: string;
    filesRestored: string[];
  }> {
    return this.snapshotManager.undo(count, this.workingDir);
  }

  /**
   * Create a snapshot before destructive operation
   */
  async createSnapshot(operation: string, description: string, filePaths: string[]): Promise<string> {
    return this.snapshotManager.createSnapshot(operation, description, filePaths, this.workingDir);
  }

  /**
   * Save current roadmap to ROADMAP.md file in project directory
   */
  private async saveRoadmapToFile(): Promise<void> {
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
      const completedTasks = this.currentRoadmap.sprints.reduce(
        (sum, sprint) => sum + sprint.tasks.filter(t => t.status === 'completed').length,
        0
      );
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

      console.log(chalk.dim(`  💾 Roadmap saved to: ${roadmapPath}`));
    } catch (error) {
      console.error(chalk.red(`  ✗ Failed to save roadmap file: ${error}`));
    }
  }
}
