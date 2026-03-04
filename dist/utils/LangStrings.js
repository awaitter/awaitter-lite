"use strict";
/**
 * Language detection and bilingual internal prompts.
 * Used by Agent, WorkerAgent and Orchestrator to keep all feedback
 * in the language the user is writing in.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMPTS = void 0;
exports.detectLanguage = detectLanguage;
/**
 * Detect language from a text snippet.
 * Returns 'es' if Spanish indicators are found, 'en' otherwise.
 */
function detectLanguage(text) {
    const spanishPattern = /[áéíóúñü¿¡]|\b(que|el|la|los|las|una?|para|con|por|como|este|esta|pero|mas|tambien|hola|gracias|si|necesito|quiero|hacer|crear|analizar|revisar|puedo|tengo|voy|vamos|haz|dame|dime|crea|implementa|muéstrame|revisa|arregla|mejora|cambia|agrega|borra|ejecuta|construye|cuando|donde|quien|eso|esa|esto|aqui|alli|pares|parar|hasta|lograrlo|lograr|logra|terminar|termina|detener|detengas|detenerte|sinparar|seguir|sigue|continua|continúa|hazlo|hagas|haré|hará|haremos|poder|puede|pueden|podemos|trabajo|trabajar|archivo|archivos|proyecto|proyectos|codigo|carpeta|servidor|instala|instalar|ejecutar|correr|probar|prueba|pruebas|arreglar|solucionar)\b/i;
    return spanishPattern.test(text) ? 'es' : 'en';
}
/**
 * All internal prompt strings used when injecting messages into the model context.
 * Keep these in sync whenever new injection points are added.
 */
exports.PROMPTS = {
    // ── Refusal override ──────────────────────────────────────────────────────
    refusalCorrectionWithContext: {
        en: (ctx) => `You said you can't access files, but you CAN — you have real filesystem tools.\n\nHere is the actual project content I fetched for you:\n\n${ctx}\n\nNow please answer the original question properly.`,
        es: (ctx) => `Dijiste que no puedes acceder a los archivos, pero SÍ PUEDES — tienes herramientas reales del sistema de archivos.\n\nAquí está el contenido real del proyecto que obtuve para ti:\n\n${ctx}\n\nAhora responde la pregunta original correctamente.`,
    },
    refusalCorrectionNoContext: {
        en: (dir) => `You said you can't access files, but you CAN. The working directory is: ${dir}. Use the glob tool to list files: call glob with pattern="**/*".`,
        es: (dir) => `Dijiste que no puedes acceder a los archivos, pero SÍ PUEDES. El directorio de trabajo es: ${dir}. Usa la herramienta glob para listar archivos: llama glob con pattern="**/*".`,
    },
    // ── Repeated tool calls ───────────────────────────────────────────────────
    repeatedToolCall: {
        en: `You already called those tools and received the results. Stop repeating the same calls. Use the information you already have to respond to the user or take the next action.`,
        es: `Ya llamaste esas herramientas y recibiste los resultados. Deja de repetir las mismas llamadas. Usa la información que ya tienes para responder al usuario o tomar la siguiente acción.`,
    },
    // ── Continuation prompts (roadmap task active) ────────────────────────────
    stopTalkingExecuteRoadmap: {
        en: (taskId, taskDesc) => `STOP TALKING. EXECUTE NOW.

You are announcing but NOT executing. USE TOOL CALLS to do the actual work.

Current task: [${taskId}] ${taskDesc}

IMMEDIATE ACTION REQUIRED:
1. If this is a setup task (npm create, git init, etc.) - USE bash tool NOW
2. If this is a coding task - USE write/edit tools NOW
3. If you need to read files first - USE read/glob tools NOW

DO NOT respond with text. ONLY tool calls. Execute the current task RIGHT NOW.`,
        es: (taskId, taskDesc) => `DEJA DE HABLAR. EJECUTA AHORA.

Estás anunciando pero NO ejecutando. USA LLAMADAS DE HERRAMIENTA para hacer el trabajo real.

Tarea actual: [${taskId}] ${taskDesc}

ACCIÓN INMEDIATA REQUERIDA:
1. Si es una tarea de setup (npm create, git init, etc.) - USA la herramienta bash AHORA
2. Si es una tarea de código - USA las herramientas write/edit AHORA
3. Si necesitas leer archivos primero - USA las herramientas read/glob AHORA

NO respondas con texto. SOLO llamadas de herramienta. Ejecuta la tarea actual AHORA MISMO.`,
    },
    // ── Continuation prompts (unstoppable, no roadmap) ────────────────────────
    executeImmediately: {
        en: (originalRequest) => `EXECUTE IMMEDIATELY. DO NOT ANNOUNCE.

You said you would do something but made no tool calls. The user wants you to keep going WITHOUT stopping.

RULES:
- USE tool calls to execute right now
- Do NOT say "I will...", "I'll...", "Now I will..."
- Execute bash/read/write/edit tools IMMEDIATELY
- Original request: "${originalRequest}"

Make tool calls NOW. Not text. Tool calls.`,
        es: (originalRequest) => `EJECUTA INMEDIATAMENTE. NO ANUNCIES.

Dijiste que harías algo pero no hiciste llamadas de herramienta. El usuario quiere que sigas SIN DETENERTE.

REGLAS:
- USA llamadas de herramienta para ejecutar ahora mismo
- NO digas "Voy a...", "Haré...", "Ahora voy a..."
- Ejecuta las herramientas bash/read/write/edit INMEDIATAMENTE
- Solicitud original: "${originalRequest}"

Haz llamadas de herramienta AHORA. No texto. Llamadas de herramienta.`,
    },
    // ── Continuation prompts (pending TODOs) ─────────────────────────────────
    pendingTodos: {
        en: (count, originalRequest) => `You have ${count} pending TODO steps. Continue IMMEDIATELY with the next step. Execute tool calls NOW without announcing. Remember the original request: "${originalRequest}"`,
        es: (count, originalRequest) => `Tienes ${count} pasos TODO pendientes. Continúa INMEDIATAMENTE con el siguiente paso. Ejecuta llamadas de herramienta AHORA sin anunciar. Recuerda la solicitud original: "${originalRequest}"`,
    },
    // ── Continuation prompts (generic incomplete) ─────────────────────────────
    continueWithToolCalls: {
        en: `Continue immediately with the tool calls you mentioned. Execute them NOW without announcing. DO NOT show code in markdown blocks — use write/edit tools to create actual files.`,
        es: `Continúa inmediatamente con las llamadas de herramienta que mencionaste. Ejecútalas AHORA sin anunciar. NO muestres código en bloques markdown — usa las herramientas write/edit para crear archivos reales.`,
    },
    // ── Continuation prompts (roadmap complete / conversational) ──────────────
    conversationalContinue: {
        en: `Continue with tool calls if needed, or provide a conversational response.`,
        es: `Continúa con llamadas de herramienta si es necesario, o proporciona una respuesta conversacional.`,
    },
    // ── WorkerAgent: stop describing, use tools ───────────────────────────────
    workerStopDescribing: {
        en: (taskDesc) => `WRONG. You described instead of executing.

If you showed commands in \`\`\`code blocks\`\`\` → run them NOW with bash tool.
If you listed files to create → create them NOW with write tool.
If you planned steps → execute step 1 NOW with the appropriate tool.

NO MORE TEXT. ONLY TOOL CALLS. Task: ${taskDesc}`,
        es: (taskDesc) => `MAL. Describiste en lugar de ejecutar.

Si mostraste comandos en \`\`\`bloques de código\`\`\` → ejecútalos AHORA con la herramienta bash.
Si listaste archivos a crear → créalos AHORA con la herramienta write.
Si planeaste pasos → ejecuta el paso 1 AHORA con la herramienta apropiada.

SIN MÁS TEXTO. SOLO LLAMADAS DE HERRAMIENTA. Tarea: ${taskDesc}`,
    },
    // ── WorkerAgent: system prompt footer ────────────────────────────────────
    workerSystemFooter: {
        en: `IMPORTANT: Execute your task using the available tools. Create real files — do not just describe what to do.

CRITICAL RULES FOR THIS SESSION:
- Create projects in CURRENT directory: bash(command="npx create-react-app .", timeout=180)
- BEFORE running create-react-app: check if project already exists: bash(command="ls package.json 2>/dev/null && echo EXISTS || echo NOT_FOUND")
  - If package.json EXISTS → the project is already created. Do NOT run create-react-app again.
- The cd command does NOT exist as a tool — chain commands: bash(command="cd subdir && npm install")
- npm/npx commands are SLOW — always add timeout=120 or timeout=180
- Start dev servers in BACKGROUND: bash(command="npm start &") — NEVER run blocking processes
- Verify server: bash(command="sleep 3 && lsof -i :3000 | head -3")
- ALWAYS read a file before editing it: use read tool first, then edit with exact old_string from the file
- NEVER guess old_string content — copy it exactly from the read output`,
        es: `IMPORTANTE: Ejecuta tu tarea usando las herramientas disponibles. Crea archivos reales — no solo describas qué hacer.

REGLAS CRÍTICAS PARA ESTA SESIÓN:
- Crea proyectos en el directorio ACTUAL: bash(command="npx create-react-app .", timeout=180)
- ANTES de ejecutar create-react-app: verifica si el proyecto ya existe: bash(command="ls package.json 2>/dev/null && echo EXISTS || echo NOT_FOUND")
  - Si package.json EXISTE → el proyecto ya fue creado. NO ejecutes create-react-app de nuevo.
- El comando cd NO existe como herramienta — encadena comandos: bash(command="cd subdir && npm install")
- npm/npx son LENTOS — siempre agrega timeout=120 o timeout=180
- Inicia servidores en BACKGROUND: bash(command="npm start &") — NUNCA ejecutes procesos bloqueantes
- Verifica que inició: bash(command="sleep 3 && lsof -i :3000 | head -3")
- SIEMPRE lee un archivo antes de editarlo: usa la herramienta read primero, luego edita con el old_string exacto del archivo
- NUNCA adivines el contenido de old_string — cópialo exactamente del output del read`,
    },
    // ── WorkerAgent: language instruction ─────────────────────────────────────
    languageInstruction: {
        en: `LANGUAGE RULE: You MUST respond in English. All your responses, thoughts, and explanations must be in English.`,
        es: `REGLA DE IDIOMA: DEBES responder en español. Todas tus respuestas, pensamientos y explicaciones deben ser en español.`,
    },
    // ── Orchestrator: plan request ────────────────────────────────────────────
    orchestratorPlanRequest: {
        en: (req) => `Create a plan to fulfill this request: "${req}"

Output ONLY a plan in this exact format:
PLAN:
- [architect] <task description>
- [backend] <task description>
- [frontend] <task description>
- [qa] <task description>

Only include agents that are needed. Use 2-5 agents max. Be specific about each task.`,
        es: (req) => `Crea un plan para cumplir esta solicitud: "${req}"

Responde SOLO con un plan en este formato exacto:
PLAN:
- [architect] <descripción de la tarea>
- [backend] <descripción de la tarea>
- [frontend] <descripción de la tarea>
- [qa] <descripción de la tarea>

Incluye solo los agentes necesarios. Usa 2-5 agentes como máximo. Sé específico en cada tarea.`,
    },
    // ── WorkerAgent: initial task message ─────────────────────────────────────
    workerInitialTask: {
        en: (taskDesc) => `Execute immediately with tool calls: ${taskDesc}

⚡ FIRST ACTION = TOOL CALL. Do NOT respond with text, plans, or markdown first.`,
        es: (taskDesc) => `Ejecuta inmediatamente con llamadas de herramienta: ${taskDesc}

⚡ PRIMERA ACCIÓN = LLAMADA DE HERRAMIENTA. NO respondas con texto, planes o markdown primero.`,
    },
    // ── Orchestrator: QA recommendation extraction prompt ─────────────────────
    qaExtractRecommendations: {
        en: (qaOutput) => `The QA agent produced this analysis:\n\n${qaOutput}\n\nExtract ONLY actionable recommendations (code changes, files to create/modify, commands to run, configs to fix). Respond with a simple numbered list, max 8 items, one recommendation per line. If there are no actionable recommendations, respond with only "NONE".`,
        es: (qaOutput) => `El agente QA produjo este análisis:\n\n${qaOutput}\n\nExtrae SOLO las recomendaciones accionables (cambios de código, archivos a crear/modificar, comandos a ejecutar, configuraciones a corregir). Responde con una lista numerada simple, máximo 8 items, una recomendación por línea. Si no hay recomendaciones accionables, responde solo con "NONE".`,
    },
    // ── Orchestrator: QA approval prompt shown to user ────────────────────────
    qaApprovalHeader: {
        en: (count) => `  📋 QA FOUND ${count} RECOMMENDATION${count > 1 ? 'S' : ''}:`,
        es: (count) => `  📋 QA ENCONTRÓ ${count} RECOMENDACIÓN${count > 1 ? 'ES' : ''}:`,
    },
    qaApprovalPrompt: {
        en: `  Which ones do you want to apply? (e.g.: 1,2 / all / none): `,
        es: `  ¿Cuáles deseas aplicar? (ej: 1,2 / all / none): `,
    },
    qaApplyingRecommendation: {
        en: (i, total, rec) => `  Applying recommendation ${i}/${total}: ${rec}`,
        es: (i, total, rec) => `  Aplicando recomendación ${i}/${total}: ${rec}`,
    },
    qaNoChanges: {
        en: `  No changes applied.`,
        es: `  Sin cambios aplicados.`,
    },
};
//# sourceMappingURL=LangStrings.js.map