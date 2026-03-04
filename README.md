# Awaitter Lite

<div align="center">

[![npm version](https://img.shields.io/npm/v/awaitter-lite.svg)](https://www.npmjs.com/package/awaitter-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/awaitter-lite.svg)](https://www.npmjs.com/package/awaitter-lite)
[![GitHub](https://img.shields.io/github/stars/awaitter/awaitter-lite?style=social)](https://github.com/awaitter/awaitter-lite)

**An open-source AI coding assistant CLI that executes tasks — not just suggests them.**

Supports local models (Ollama) and cloud APIs. Single-agent and multi-agent modes. Persistent sessions, undo system, and structured project planning built in.

[Quick Start](#quick-start) · [Models](#supported-models) · [Commands](#commands) · [Multi-Agent](#multi-agent-mode) · [Local Setup](#local-models-ollama)

</div>

---

## Overview

Awaitter Lite is a terminal-based AI coding assistant that integrates directly with your filesystem. It reads, writes, and edits files, runs shell commands, and tracks project progress across sessions — without losing context.

It supports over 20 models across 7 providers, and can run entirely offline using local models via Ollama.

---

## Quick Start

```bash
npm install -g awaitter-lite

# Launch
awaitter-lite
# or
aw

# First time: run the configuration wizard
> /setup
```

---

## Core Capabilities

### Direct Code Execution

Awaitter doesn't output suggestions for you to copy — it acts on your codebase:

- **Read** files and entire project trees
- **Write** new files with generated content
- **Edit** existing files in place
- **Run** shell commands (npm, pip, cargo, git, etc.)
- **Search** using glob patterns and grep

### Structured Project Planning

For complex tasks, Awaitter automatically generates a sprint-based roadmap before executing:

```
> Create a REST API with authentication, rate limiting, and PostgreSQL

  Roadmap: 4 sprints, 18 tasks

  Sprint 1 — Database & Models
    1.1  Initialize PostgreSQL schema
    1.2  Create SQLAlchemy models
    1.3  Set up Alembic migrations

  Sprint 2 — Authentication
    2.1  Implement JWT token logic
    2.2  Password hashing with bcrypt
    2.3  Login / register endpoints
  ...
```

Progress is tracked per task and persists across sessions and model switches.

### Execution Modes

Control how much autonomy Awaitter has:

| Mode | Behavior |
|------|----------|
| **Unstoppable** | Executes the full roadmap without pausing |
| **Sprint** *(default)* | Completes one sprint, then waits for confirmation |
| **Step-by-step** | Pauses after every individual task |

Switch at any time: `/mode sprint`, `/mode unstoppable`, `/mode step-by-step`

### Session Persistence & Undo

- Sessions are auto-saved every 5 messages, scoped to the working directory
- Resume previous work with `/sessions load <id>`
- Undo any number of file operations with `/undo [n]`
- View full snapshot history with `/snapshots`

### Model Hot-Swapping

Switch between models mid-project without losing context. The roadmap, conversation history, and progress all carry over:

```bash
> /models
  # Select a different provider or model
  # Roadmap and session state preserved
```

---

## Multi-Agent Mode

`/multi` spawns a team of specialized agents that divide and execute complex tasks in parallel:

| Agent | Role |
|-------|------|
| **Architect** | Analyzes the codebase, designs structure, plans implementation |
| **Backend** | Implements server-side logic, APIs, databases |
| **Frontend** | Builds UI components, styles, client-side logic |
| **QA** | Writes and runs tests, validates correctness |

Each agent has its own system prompt, tool access, and message history. A shared context bus lets agents communicate results to each other.

```bash
> /multi build a task management API with React frontend and Jest tests
```

Dangerous commands (file deletion, `npm audit fix --force`, process termination) require explicit confirmation before any agent executes them.

---

## Charl Language Support

Awaitter has built-in expert knowledge of [Charl](https://github.com/charlcoding-stack/charlcode), a statically-typed language for ML/AI research.

When `.ch` files are detected in the working directory, the full Charl reference is automatically injected into every agent's context — including built-in functions, tensor operations, neural network primitives, optimizer APIs, and common mistakes to avoid.

No configuration required. Run `aw` from a Charl project directory and agents will work in Charl natively.

```bash
cd ~/Projects/my-charl-project   # contains .ch files
aw

> create a two-layer neural network that learns XOR with backprop
```

---

## Supported Models

### Local Models — via Ollama

Run entirely on your machine. No API keys, no usage limits, no data sent externally.

| Model | Params | Context | Min RAM | Command |
|-------|--------|---------|---------|---------|
| Qwen 2.5 Coder 1.5B | 1.5B | 4K | 4 GB | `aw --model qwen-1.5b` |
| Qwen 2.5 Coder 7B | 7B | 8K | 8 GB | `aw --model qwen-7b` |
| Qwen 2.5 Coder 14B | 14B | 8K | 16 GB | `aw --model qwen-14b` |
| Qwen 2.5 Coder 32B | 32B | 16K | 32 GB | `aw --model qwen-32b` |
| DeepSeek Coder v2 | 16B | 16K | 16 GB | `aw --model deepseek` |
| Codestral 22B | 22B | 32K | 24 GB | `aw --model codestral` |

Awaitter handles model detection and download automatically:

```bash
aw --model qwen-7b

  Checking model: qwen2.5-coder:7b
  Not found locally. Download now? (4.7 GB) [y/n]: y
  Downloading...
  Ready.
```

### Cloud APIs

#### Free Tier

| Provider | Model | Context |
|----------|-------|---------|
| Google | Gemini 2.0 Flash | 1M tokens |
| Google | Gemini 1.5 Pro | 2M tokens |
| Groq | Llama 3.3 70B | 128K tokens |
| Groq | Qwen 2.5 32B | 32K tokens |

#### Paid APIs

| Provider | Model | Context |
|----------|-------|---------|
| OpenAI | GPT-4 Turbo | 128K |
| OpenAI | O1 Preview | 128K |
| Anthropic | Claude 3.5 Sonnet | 200K |
| Anthropic | Claude 3 Opus | 200K |
| xAI | Grok 2 | 128K |
| DeepSeek | DeepSeek Coder | 16K |

---

## Setup

### API Keys

**In-CLI wizard:**
```bash
> /setup
```

**Direct configuration:**
```bash
> /apikey google AIza...
> /apikey openai sk-...
> /apikey anthropic sk-ant-...
```

**Environment variables:**
```bash
export GOOGLE_API_KEY="AIza..."
export GROQ_API_KEY="gsk_..."
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export XAI_API_KEY="xai-..."
export DEEPSEEK_API_KEY="..."
```

### Local Models (Ollama)

```bash
# Linux
curl -fsSL https://ollama.ai/install.sh | sh

# macOS / Windows: download from https://ollama.com/download

# Then launch Awaitter — it handles the rest
aw --model qwen-7b
```

---

## Commands

### Session & History
```
/sessions              List saved sessions
/sessions load <id>    Resume a previous session
/undo [n]              Undo last n file operations (default: 1)
/snapshots             View full snapshot history
/clear                 Clear current conversation
```

### Project & Planning
```
/roadmap               Show current roadmap and task progress
/mode <mode>           Set execution mode: unstoppable | sprint | step-by-step
/multi <task>          Launch multi-agent team for a task
```

### Models & Config
```
/models                List and switch models (context preserved)
/apikey <provider> <key>  Set an API key
/setup                 Interactive configuration wizard
/hardware              Analyze system hardware and model compatibility
```

### Utilities
```
/context               Show conversation token usage and stats
/tools                 List available tools
/help                  Show all commands
/exit                  Exit the CLI
```

---

## Git Integration

Awaitter has native git tool support. You can use natural language for git operations:

```
> commit everything with message "add authentication middleware"
> show me what changed in the last 3 commits
> create a branch called feature/payment-api
```

Available git tools: `git_status`, `git_diff`, `git_log`, `git_branch`, `git_add`, `git_commit`.

---

## Safety

Awaitter requires explicit confirmation before executing commands classified as destructive:

- `rm -rf`, `git clean -fd`, `git reset --hard`
- `npm audit fix --force`, `pip install --upgrade` (broad)
- `fuser -k`, `pkill`, `killall`
- `DROP TABLE`, `DELETE FROM` without WHERE

In multi-agent mode, this confirmation gate applies to all agents.

---

## Hardware Recommendations

Run `/hardware` to get model recommendations based on your system specs:

```
> /hardware

  CPU: AMD Ryzen 9 7950X — 32 cores
  RAM: 64 GB
  GPU: NVIDIA RTX 4090 — 24 GB VRAM

  Recommended models:
    Local:  qwen-32b  (fits in VRAM — fast inference)
    Cloud:  Claude 3.5 Sonnet  (best reasoning for complex tasks)
```

---

## Configuration

Settings are stored at `~/.config/awaitter-lite` and include:

- Default model
- Execution mode
- Agent loop iteration limit
- Language preference (EN / ES)

---

## Requirements

- Node.js >= 18.0.0
- For local models: [Ollama](https://ollama.com) installed and running

---

## License

MIT — free to use in personal and commercial projects.

---

## Links

- **npm:** https://www.npmjs.com/package/awaitter-lite
- **GitHub:** https://github.com/awaitter/awaitter-lite
- **Issues:** https://github.com/awaitter/awaitter-lite/issues
- **Email:** support@awaitter.com

---

<div align="center">

Built by [NovoLabs](https://awaitter.com)

</div>
