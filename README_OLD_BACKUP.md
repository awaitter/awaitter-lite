# Awaitter Lite

<div align="center">

**Multi-model AI coding assistant that ACTUALLY codes for you**

[![npm version](https://img.shields.io/npm/v/awaitter-lite.svg)](https://www.npmjs.com/package/awaitter-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[Installation](#-installation) • [Features](#-features) • [Quick Start](#-quick-start) • [Commands](#-commands) • [Examples](#-examples)

</div>

---

## 🎯 What is Awaitter Lite?

Awaitter Lite is a **powerful CLI that actually writes code for you**, not just gives you suggestions. It supports 17 different AI models from local (Ollama) to cloud (GPT-4, Claude, Gemini, Groq, and more).

### CLI Preview

```bash
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   █████╗ ██╗    ██╗ █████╗ ██╗████████╗████████╗███████╗██████╗            │
│  ██╔══██╗██║    ██║██╔══██╗██║╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗           │
│  ███████║██║ █╗ ██║███████║██║   ██║      ██║   █████╗  ██████╔╝           │
│  ██╔══██║██║███╗██║██╔══██║██║   ██║      ██║   ██╔══╝  ██╔══██╗           │
│  ██║  ██║╚███╔███╔╝██║  ██║██║   ██║      ██║   ███████╗██║  ██║           │
│  ╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═╝╚═╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝           │
│                                                                              │
│  ██╗     ██╗████████╗███████╗                                               │
│  ██║     ██║╚══██╔══╝██╔════╝      AI Coding Assistant                      │
│  ██║     ██║   ██║   █████╗        Multi-model LLM interface                │
│  ██║     ██║   ██║   ██╔══╝                                                 │
│  ███████╗██║   ██║   ███████╗                                               │
│  ╚══════╝╚═╝   ╚═╝   ╚══════╝                                               │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  Available commands:                                                         │
│                                                                              │
│  /help       Show help                    /undo [n]     Undo last changes   │
│  /models     List and switch models       /sessions     Manage sessions     │
│  /hardware   Analyze system hardware      /snapshots    View undo history   │
│  /setup      Run configuration wizard     /tools        List available tools│
│  /exit       Exit                                                            │
│                                                                              │
│  Type a message to start...                                                 │
│                                                                              │
│  ════════════════════════════════════════════════════════════════════════   │
│                                                                              │
│  > Create a FastAPI server with authentication and PostgreSQL               │
│                                                                              │
│  🤖 Assistant                                                                │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │ ⚙️  write → backend/main.py                                        │    │
│  │ ⚙️  write → backend/models.py                                      │    │
│  │ ⚙️  write → backend/auth.py                                        │    │
│  │ ⚙️  write → backend/database.py                                    │    │
│  │ ⚙️  write → requirements.txt                                       │    │
│  │ ⚙️  bash → python -m pip install -r requirements.txt              │    │
│  │ ⚙️  bash → uvicorn main:app --reload                              │    │
│  └────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  FastAPI server created and running at http://localhost:8000                │
│  ✅ 5 files created                                                          │
│  ✅ All dependencies installed                                               │
│  ✅ Server running with hot-reload                                           │
│                                                                              │
│  📝 Working: C:\projects\my-app  |  Model: gemini-2.0-flash  |  Msgs: 2    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Installation

```bash
# Install globally
npm install -g awaitter-lite

# Or use with npx (no install needed)
npx awaitter-lite
```

## 💻 Quick Start

```bash
# Start in current directory
awaitter-lite
# or short alias
aw

# With specific model
awaitter-lite --model gpt4
awaitter-lite --model claude
awaitter-lite --model gemini
awaitter-lite --model local    # Ollama

# In specific directory
awaitter-lite --directory /path/to/project
```

## 🛠️ Features

### Core Capabilities
- ✅ **Read files** - Analyze and understand code
- ✅ **Write files** - Create new files and projects
- ✅ **Edit files** - Refactor and modify existing code
- ✅ **Execute commands** - Run bash/shell commands
- ✅ **Search files** - Find files with glob patterns
- ✅ **Search content** - Grep through file contents

### 🔧 Git Integration
Full git support built into the CLI - work with repositories naturally:
- ✅ **git_status** - Check repository status
- ✅ **git_diff** - View changes and diffs
- ✅ **git_commit** - Create commits with messages
- ✅ **git_branch** - Manage branches (create, switch, delete)
- ✅ **git_log** - View commit history

Just ask: *"Show git status"* or *"Create a commit with all changes"*

### ⏮️ Undo/Rollback System
Never fear making mistakes - instant safety net:
- ✅ **Automatic snapshots** - Created before every file change
- ✅ **Instant rollback** - `/undo` or `/undo 3` to revert changes
- ✅ **History tracking** - Up to 50 snapshots retained
- ✅ **View history** - `/snapshots` shows all available undo points

### 💾 Session Persistence
Never lose your work again:
- ✅ **Auto-save** - Conversations saved every 5 messages
- ✅ **Resume anytime** - `/sessions load <id>` to continue where you left off
- ✅ **Session history** - `/sessions` lists all saved conversations
- ✅ **Cross-session** - Work on multiple projects seamlessly

### 🔄 Smart Error Recovery
Automatically fixes common errors - no manual intervention needed:
- ✅ **Module not found?** → Auto runs `npm install` or `pip install`
- ✅ **Python not found?** → Tries `python3`, `python -m pip` alternatives
- ✅ **Port in use?** → Suggests solutions to free the port
- ✅ **Syntax errors?** → Provides actionable fix suggestions
- ✅ **10+ error patterns** - Continuously learning and improving

### ✅ Automatic Test Generation
Quality assurance built-in:
- ✅ **Tests for every function** - Automatically generated with code
- ✅ **Auto-execution** - Tests run immediately after creation
- ✅ **Coverage** - Includes edge cases and error conditions
- ✅ **Multiple frameworks** - pytest, Jest, and more

### Model Support
- ✅ **17 models** across 7 providers
- ✅ **Local models** - Run Ollama models offline (Qwen, DeepSeek, Codestral)
- ✅ **Cloud APIs** - GPT-4, Claude, Gemini, Groq, xAI Grok, DeepSeek
- ✅ **Hardware detection** - Checks which models work on your system
- ✅ **Interactive benchmark** - Compare speed, quality, cost

### Developer Experience
- ✅ **Streaming responses** - Real-time output
- ✅ **Context management** - Full conversation history
- ✅ **Setup wizard** - Guided configuration
- ✅ **In-CLI API key management** - No config file editing

## 🔧 Commands

### Essential Commands
```bash
/help              # Show all commands
/models            # Interactive model selector with benchmark
/hardware          # Analyze system specs and compatibility
/setup             # Run configuration wizard
/apikey <p> <key>  # Configure API keys
```

### NEW: Session Management
```bash
/sessions          # List all saved sessions
/sessions load <id># Resume a previous conversation
/sessions clear    # Delete all sessions
```

### NEW: Undo/Rollback
```bash
/undo              # Undo last operation
/undo 3            # Undo last 3 operations
/snapshots         # View undo history
```

### NEW: Git Integration
Just ask in natural language:
```bash
> Show git status
> Create a commit with message "Add authentication"
> Show me the diff of the last commit
> Create a new branch feature/login
> Show last 5 commits
```

### Context Management
```bash
/context           # Show conversation info
/clear             # Clear conversation
/save [file]       # Save conversation
/load <file>       # Load conversation
/tools             # List available tools
/exit              # Exit CLI
```

## 📝 Examples

### 1. Create a Complete Project

```bash
> Create a FastAPI server with:
  - User authentication (JWT)
  - PostgreSQL database
  - CRUD endpoints for tasks
  - Tests with pytest
  - README with setup instructions
```

**What happens:**
- ✅ Creates all backend files
- ✅ Writes comprehensive tests
- ✅ Installs dependencies automatically
- ✅ Runs the server
- ✅ Creates snapshots for undo

### 2. Fix Errors Automatically

```bash
> Run npm test
```

**If error "Module 'jest' not found":**
```
❌ Error: Cannot find module 'jest'
↻ Missing Node.js module: jest. Installing automatically...
✅ npm install jest successful
✅ Tests now passing (15/15)
```

### 3. Work with Git

```bash
> Show me what files changed

🤖 git_status executed:
  Modified:   src/auth.ts
  Modified:   src/database.ts
  Untracked:  src/middleware.ts

> Create a commit with these changes

🤖 git_commit executed:
✅ Commit created: "Add authentication middleware"
  3 files changed, 145 insertions(+)
```

### 4. Undo Mistakes

```bash
> Refactor all components to use hooks

🤖 15 files modified...

> Wait, undo that

/undo 15

✅ Successfully undone 15 operations
Files restored: 15
  - src/components/Header.tsx
  - src/components/Login.tsx
  ...
```

### 5. Resume Previous Work

```bash
# Later, in a new session
awaitter-lite

> /sessions

📚 Saved Sessions

  ID                          Date                 Model           Messages
  ────────────────────────────────────────────────────────────────────────
  session_2025-01-15_10-30   1/15/25, 10:30 AM    gemini-flash    25
  session_2025-01-14_15-20   1/14/25, 3:20 PM     gpt4            12

> /sessions load session_2025-01-15_10-30

✅ Session loaded
  Conversation history restored. Continue from where you left off.
```

## 📊 Model Benchmark (/models)

```bash
> /models
```

Shows interactive comparison:

```
📊 Model Benchmark & Selection

  Model                  Speed        Quality      Context  Cost
  ──────────────────────────────────────────────────────────────────

🏠 Local Models (Ollama)
  Qwen 1.5B              Varies       ⭐⭐⭐        4K       Free
  Qwen 7B                Varies       ⭐⭐⭐⭐       8K       Free
  Qwen 32B               Varies       ⭐⭐⭐⭐⭐     16K      Free

🤖 OpenAI
  GPT-4 Turbo            💨 Fast      ⭐⭐⭐⭐⭐     128K     $10-30/1M  ✓
  GPT-3.5 Turbo          🚀 V.Fast    ⭐⭐⭐        16K      $0.5-1.5/1M ✓

🧠 Anthropic (Claude)
  Claude 3.5 Sonnet      💨 Fast      ⭐⭐⭐⭐⭐     200K     $3-15/1M   ✓

🔍 Google (Gemini)
  Gemini 2.0 Flash       ⚡ Instant    ⭐⭐⭐⭐       1M       Free       ✓
  Gemini 1.5 Pro         💨 Fast      ⭐⭐⭐⭐⭐     2M       $1.25-5/1M ✓

🚀 Groq (Free & Fast!)
  Llama 3.3 70B          ⚡ Instant    ⭐⭐⭐⭐       8K       Free       ✓
  Llama 3.1 8B           ⚡ Instant    ⭐⭐⭐        8K       Free       ✓

💎 DeepSeek (Cheapest!)
  DeepSeek Coder         💨 Fast      ⭐⭐⭐⭐       16K      $0.14/1M   ✓
```

**Legend:** ✓ = API key configured, ✗ = API key missing

Use arrow keys to select, press Enter. The CLI will:
1. Show detailed specs
2. Prompt for API key if needed
3. Switch to that model
4. Set as default

## 🔑 API Keys

### Quick Setup (In-CLI)

```bash
# Inside the CLI
/setup              # Guided wizard

# Or configure directly
/apikey openai sk-...
/apikey anthropic sk-ant-...
/apikey google AIza...
/apikey groq gsk_...
```

### Environment Variables

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
export GOOGLE_API_KEY="AIza..."
export GROQ_API_KEY="gsk_..."
export XAI_API_KEY="xai-..."
export DEEPSEEK_API_KEY="sk-..."
```

## 🏠 Local LLM (Ollama)

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull qwen2.5-coder:7b

# Start Ollama
ollama serve

# Use with Awaitter
awaitter-lite --model qwen-7b
```

## 🖥️ Hardware Analysis

```bash
> /hardware
```

```
🖥️  Hardware Analysis

System Specifications:
──────────────────────────────
OS:        Windows 11
CPU:       Intel Core i7-12700K
Cores:     12 cores
RAM:       32 GB (28 GB free)
GPU:       NVIDIA RTX 3080
VRAM:      10 GB

Model Compatibility:
──────────────────────────────────────────────────
Model              Status        Performance
──────────────────────────────────────────────────
qwen2.5-coder:1.5b ✓ Excellent   ⚡ Fast
qwen2.5-coder:7b   ✓ Excellent   🚀 Fast
qwen2.5-coder:32b  ⚠ Acceptable  🐢 Slow
gpt-4-turbo        ✓ Excellent   ⚡ Instant
```

## 🎓 Tips & Tricks

### 1. Always Have an Undo Plan
```bash
# Before major changes
/snapshots          # Check current snapshots
# Make changes
# If something goes wrong:
/undo               # Or /undo 5
```

### 2. Use Sessions for Long Tasks
```bash
# Sessions auto-save every 5 messages
# But you can manually save anytime:
/save important-refactor
# Resume later:
/load important-refactor
```

### 3. Leverage Git Integration
```bash
# Natural language git commands:
> Show what I changed today
> Commit these changes with a good message
> Create a feature branch for the new login
```

### 4. Let Error Recovery Work
```bash
# Don't panic on errors - the CLI auto-fixes:
> Run the tests
# If module missing → auto installs
# If port busy → suggests fix
# If python not found → tries alternatives
```

### 5. Compare Models Before Choosing
```bash
# Use /models to see:
# - Which is fastest for your needs
# - Which is cheapest
# - Which has the largest context window
# Switch anytime with /models
```

## ☕ Support This Project

If Awaitter Lite saves you time and makes your development workflow easier, consider supporting its development!

<div align="center">

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Development-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/novolabs)

</div>

**Why support?**
- 🚀 Helps maintain and improve this free tool
- ✨ Enables new features and model integrations
- 🐛 Faster bug fixes and updates
- 📚 Better documentation and examples

Your support, no matter how small, makes a huge difference. Thank you! 🙏

## 📖 Documentation

For detailed documentation, visit [awaitter.com](https://awaitter.com)

## 🐛 Found a Bug or Have Feedback?

Awaitter Lite is actively maintained by **NovoLabs**. If you encounter issues or have suggestions:

**Report via GitHub Issues**: [github.com/novolabs/awaitter-lite/issues](https://github.com/novolabs/awaitter-lite/issues)

Please include:
- Clear description of the problem
- Steps to reproduce
- Your environment (OS, Node version, model used)

Your feedback helps make this tool better for everyone! 🙏

## 📄 License

MIT

---

<div align="center">

**Made with ❤️ by [NovoLabs](https://github.com/novolabs)**

[🐛 Report Bug](https://github.com/novolabs/awaitter-lite/issues) • [💡 Request Feature](https://github.com/novolabs/awaitter-lite/issues) • [☕ Support on Ko-fi](https://ko-fi.com/novolabs)

</div>
