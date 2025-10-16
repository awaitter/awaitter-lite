# Awaitter Lite

<div align="center">

**The AI coding assistant that NEVER loses track of your project**

[![npm version](https://img.shields.io/npm/v/awaitter-lite.svg)](https://www.npmjs.com/package/awaitter-lite)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/awaitter-lite.svg)](https://www.npmjs.com/package/awaitter-lite)

Multi-model AI assistant with **automatic project planning**, **smart execution modes**, and **zero context loss**

[Quick Start](#-quick-start) • [Features](#-features) • [Roadmap System](#-roadmap-system-new) • [Commands](#-commands) • [Models](#-supported-models)

</div>

---

## ⚡ What's New in v1.0.22

<table>
<tr>
<td width="50%">

### 🗺️ **Smart Roadmap System**
Automatically breaks down complex projects into sprints and tasks. **Never loses track**, even on 100+ file projects.

</td>
<td width="50%">

### 🎮 **3 Execution Modes**
Choose your style: Full auto, sprint-by-sprint, or step-by-step control.

</td>
</tr>
<tr>
<td width="50%">

### 🔄 **Model Hot-Swapping**
Switch between GPT-4, Claude, Gemini mid-project. **Context preserved 100%**.

</td>
<td width="50%">

### ⚡ **Persistent Progress**
Close the CLI, reboot your PC. Your roadmap and progress stay intact.

</td>
</tr>
</table>

---

## 🚀 Quick Start

```bash
# Install globally
npm install -g awaitter-lite

# Start coding
awaitter-lite
# or short alias
aw
```

**First time?** Run `/setup` for guided configuration.

---

## 🎯 What Makes Awaitter Different?

Most AI assistants give up halfway through complex projects. **Awaitter Lite doesn't.**

### The Problem with Traditional AI Assistants

```
You: "Create a full-stack e-commerce app"
Traditional AI: "Here's App.tsx... [loses context]"
                "Oh, what were we doing?"
                ❌ 30% complete, then stops
```

### The Awaitter Approach

```
You: "Create a full-stack e-commerce app"
Awaitter:
  📋 Generates roadmap with 5 sprints, 23 tasks
  ⚡ Executes systematically
  ✅ Tracks progress: 23/23 tasks complete
  🎉 Full app delivered, tested, documented
```

---

## 🗺️ Roadmap System (NEW)

When you request something complex, Awaitter **automatically creates a structured roadmap**.

### Example: Full-Stack App Request

```bash
> Create a real-time order tracking system for B2B, multi-tenant
```

**Awaitter generates:**

```
📋 PROJECT ROADMAP: B2B Order Tracking System

═══════════════════════════════════════════════════════════════
🏗️  SPRINT 1: DATABASE & CORE MODELS (Estimated: ~15 min)
═══════════════════════════════════════════════════════════════
☐ 1.1  Create database schema (users, tenants, orders)
☐ 1.2  Set up migrations and seed data
☐ 1.3  Create SQLAlchemy models

═══════════════════════════════════════════════════════════════
🔐  SPRINT 2: AUTHENTICATION & MULTI-TENANCY (~20 min)
═══════════════════════════════════════════════════════════════
☐ 2.1  Implement JWT authentication
☐ 2.2  Add tenant isolation middleware
☐ 2.3  Create user management endpoints

═══════════════════════════════════════════════════════════════
📦  SPRINT 3: ORDER MANAGEMENT API (~25 min)
═══════════════════════════════════════════════════════════════
☐ 3.1  CRUD endpoints for orders
☐ 3.2  Real-time WebSocket handlers
☐ 3.3  Status update workflows

... and 2 more sprints

TOTAL: 23 tasks | 5 sprints | ~85 minutes estimated
```

**Then it executes systematically:**

```
✅ SPRINT 1: DATABASE & CORE MODELS - COMPLETED (12 tasks)
✅ SPRINT 2: AUTHENTICATION & MULTI-TENANCY - COMPLETED (8 tasks)
⏳ SPRINT 3: ORDER MANAGEMENT API - IN PROGRESS (3/5 tasks)
☐ SPRINT 4: FRONTEND & UI
☐ SPRINT 5: TESTING & DEPLOYMENT
```

---

## 🎮 Execution Modes

Choose how Awaitter works for you:

<table>
<tr>
<th>Mode</th>
<th>Best For</th>
<th>How It Works</th>
</tr>
<tr>
<td>

**🚀 Unstoppable**

</td>
<td>Fast devs who want results NOW</td>
<td>

Executes entire roadmap automatically. Only stops for critical errors.

</td>
</tr>
<tr>
<td>

**🏃 Sprint** ⭐ *Default*

</td>
<td>Balanced control & speed</td>
<td>

Completes one sprint, shows summary, waits for your "continue".

</td>
</tr>
<tr>
<td>

**👣 Step-by-Step**

</td>
<td>Learning, reviewing, precision work</td>
<td>

Executes one task, pauses. You approve each step.

</td>
</tr>
</table>

**Change anytime:** `/mode unstoppable` or `/mode step-by-step`

### Visual Example

```bash
# Sprint Mode (Default)
✅ SPRINT 1 COMPLETED (12 tasks, 5 files created)

   Ready to start SPRINT 2? (type 'continue')
> continue

⏳ SPRINT 2: AUTHENTICATION - IN PROGRESS...
```

```bash
# Step-by-Step Mode
✅ Task 1.1 complete: Database schema created

   Next: Task 1.2 - Set up migrations
   Continue? (waiting for your confirmation)
> yes

⏳ Running Task 1.2...
```

---

## 🔄 Model Hot-Swapping (NEW)

**Switch models mid-project** without losing context:

```bash
# Start with free model
> /models
  Selected: Gemini 2.0 Flash (free, fast)

# Work on your project...
📋 Roadmap generated, 15/45 tasks complete

# Hit rate limit? Switch instantly
> /models
  Selected: GPT-4 Turbo

✅ Context preserved
✅ Roadmap intact (15/45 tasks still tracked)
✅ Continue from Task 16 seamlessly
```

**Supported mid-switch:**
- ✅ Full conversation history
- ✅ Roadmap progress
- ✅ Current sprint/task
- ✅ File changes tracking

---

## 🛠️ Core Features

### Code Execution (Not Just Suggestions)
- ✅ **Read & analyze** entire codebases
- ✅ **Write files** - creates actual files, not just shows code
- ✅ **Edit files** - refactors existing code in place
- ✅ **Run commands** - npm install, pytest, build, deploy
- ✅ **Search** - glob patterns, grep content

### Smart Systems
- ✅ **Auto error recovery** - Module not found? Auto-installs
- ✅ **Undo/rollback** - `/undo` or `/undo 5` to revert changes
- ✅ **Session persistence** - Auto-saves every 5 messages
- ✅ **Git integration** - Natural language git commands

### Developer Experience
- ✅ **17 AI models** - Local (Ollama) + Cloud (GPT/Claude/Gemini/Groq)
- ✅ **Hardware detection** - Recommends best models for your system
- ✅ **Streaming responses** - See output in real-time
- ✅ **Context management** - Never forgets what you're building

---

## 📋 Commands

### New Commands
```bash
/mode                  # View/change execution mode (unstoppable/sprint/step)
/roadmap               # View current project roadmap and progress
/models                # Switch models (context preserved!)
```

### Essential Commands
```bash
/help                  # Show all commands
/setup                 # Guided configuration wizard
/hardware              # Analyze system & model compatibility
/apikey <provider>     # Configure API keys
```

### Session & Undo
```bash
/sessions              # List saved sessions
/sessions load <id>    # Resume previous work
/undo [n]              # Undo last n operations
/snapshots             # View undo history
```

### Context Management
```bash
/context               # Show conversation stats
/clear                 # Clear conversation
/tools                 # List available tools
/exit                  # Exit CLI
```

---

## 🤖 Supported Models

### 🏠 Local (Free - Runs on Your PC)
| Model | Speed | Quality | Context | Cost |
|-------|-------|---------|---------|------|
| Qwen 2.5 Coder 1.5B | ⚡⚡ | ⭐⭐⭐ | 4K | **Free** |
| Qwen 2.5 Coder 7B | ⚡ | ⭐⭐⭐⭐ | 8K | **Free** |
| DeepSeek Coder 16B | 💨 | ⭐⭐⭐⭐ | 16K | **Free** |

### ☁️ Cloud APIs
| Provider | Model | Speed | Quality | Context | Cost |
|----------|-------|-------|---------|---------|------|
| **Google** | Gemini 2.0 Flash | ⚡⚡⚡ | ⭐⭐⭐⭐ | 1M | **Free** ✨ |
| **Groq** | Llama 3.3 70B | ⚡⚡⚡ | ⭐⭐⭐⭐ | 8K | **Free** ✨ |
| **OpenAI** | GPT-4 Turbo | 💨 | ⭐⭐⭐⭐⭐ | 128K | $10-30/1M |
| **Anthropic** | Claude 3.5 Sonnet | 💨 | ⭐⭐⭐⭐⭐ | 200K | $3-15/1M |
| **DeepSeek** | DeepSeek Coder API | 💨 | ⭐⭐⭐⭐ | 16K | $0.14/1M 💰 |

**Pro Tip:** Start with free models (Gemini/Groq), switch to premium if needed using `/models`

---

## 🎬 Real Examples

### Example 1: Full-Stack App (Unstoppable Mode)

```bash
> /mode unstoppable

> Create a task management SaaS:
  - React frontend with Tailwind
  - Node.js API with MongoDB
  - Auth with JWT
  - Real-time updates with Socket.io
  - Deploy to Vercel & Railway

📋 Roadmap generated: 6 sprints, 31 tasks, ~120 min

⚡ EXECUTING IN UNSTOPPABLE MODE...

✅ Sprint 1: Database Setup (5 tasks) - 8 min
✅ Sprint 2: Authentication (6 tasks) - 15 min
✅ Sprint 3: Task CRUD API (7 tasks) - 22 min
✅ Sprint 4: Frontend Components (8 tasks) - 35 min
✅ Sprint 5: Real-time Features (3 tasks) - 18 min
✅ Sprint 6: Deployment (2 tasks) - 12 min

🎉 PROJECT COMPLETE!
   31/31 tasks ✅
   42 files created
   Frontend: https://task-app.vercel.app
   API: https://task-api.railway.app
```

### Example 2: Learning Mode (Step-by-Step)

```bash
> /mode step-by-step

> Refactor my Express app to use TypeScript

📋 Roadmap: 4 sprints, 12 tasks

⏳ Task 1.1: Install TypeScript dependencies

  ▸ bash → npm install -D typescript @types/node @types/express
  ✓ Installed successfully

Task 1.1 complete. Next: Create tsconfig.json
Continue? (y/n)
> y

⏳ Task 1.2: Create tsconfig.json...

# You control every step - perfect for learning
```

### Example 3: Model Switching Mid-Project

```bash
# Start with free tier
> /models
  Selected: Gemini 2.0 Flash

> Build a complex analytics dashboard

📋 Roadmap: 35 tasks
⏳ Progress: 18/35 tasks complete...

# Gemini hits rate limit
❌ Error: Quota exceeded

# Switch instantly
> /models
  Selected: Claude 3.5 Sonnet

✅ Context & roadmap preserved
⏳ Resuming: Task 19/35 - Data visualization components
```

---

## 🔑 Quick Setup

### Option 1: In-CLI Setup (Easiest)

```bash
awaitter-lite
> /setup

🔧 Configuration Wizard
  1. OpenAI (GPT-4)
  2. Anthropic (Claude)
  3. Google (Gemini) ✨ Free
  4. Groq ✨ Free

Select provider: 3
Enter API key: [paste your key]
✅ Gemini configured and tested!
```

### Option 2: Environment Variables

```bash
export GOOGLE_API_KEY="AIza..."        # Free tier available
export GROQ_API_KEY="gsk_..."          # Free tier available
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

**Get free API keys:**
- [Gemini (Google)](https://makersuite.google.com/app/apikey) - Free tier ✨
- [Groq](https://console.groq.com) - Free tier ✨

---

## 💡 Pro Tips

### 1. Use Roadmaps for Complex Tasks

```bash
# ❌ Vague request
> Make my app better

# ✅ Clear request that triggers roadmap
> Refactor my app to:
  - Use TypeScript
  - Add error handling
  - Implement caching
  - Add comprehensive tests
```

### 2. Choose the Right Mode

- **Quick prototype?** → Unstoppable mode
- **Production code?** → Sprint mode (review each phase)
- **Learning TypeScript?** → Step-by-step mode

### 3. Leverage Free Models First

```bash
# Gemini 2.0 Flash = FREE + 1M context + fast
# Perfect for most tasks

# Only upgrade to GPT-4/Claude for:
# - Very complex reasoning
# - Mission-critical code
```

### 4. Never Fear Breaking Things

```bash
> Refactor everything to use hooks

# 50 files changed...
# Something looks wrong?

> /undo 50

✅ All changes reverted instantly
```

---

## 🏗️ Local LLM Setup (Ollama)

Run models **completely free** on your PC:

```bash
# 1. Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 2. Pull a coding model
ollama pull qwen2.5-coder:7b

# 3. Start Ollama
ollama serve

# 4. Use with Awaitter
awaitter-lite --model qwen-7b

# No API keys, no costs, 100% private
```

**Recommended local models:**
- **1.5B** - Laptops, quick edits (4GB RAM)
- **7B** - Desktops, serious coding (16GB RAM)
- **32B** - Workstations, complex projects (32GB+ RAM)

---

## 🐛 Troubleshooting

### "Module not found" errors?
Awaitter auto-fixes these. Just let it run:

```bash
> Run the tests

❌ Cannot find module 'jest'
↻ Installing jest automatically...
✅ npm install jest successful
✅ Tests running...
```

### Roadmap not generating?
Roadmaps trigger for **complex tasks**. Be specific:

```bash
# ❌ Too simple
> Add a button

# ✅ Triggers roadmap
> Create a user authentication system with:
  - Login/signup forms
  - JWT tokens
  - Protected routes
  - Password reset
```

### Model not working?
Check API key configuration:

```bash
> /models

# Shows ✓ for configured models
# Shows ✗ for missing keys

# Configure instantly:
> /apikey google AIza...
```

---

## ⚠️ Important Notes

### Roadmap Persistence
- ✅ Survives CLI restarts
- ✅ Survives model switches
- ✅ Survives computer reboots (with auto-saved sessions)
- ❌ Cleared with `/clear` command

### Model Switching
- ✅ Switch anytime without losing context
- ✅ Roadmap progress preserved
- ⚠️ Different models = different code styles (be consistent for production)

### Execution Modes
Change modes mid-project:
```bash
# Start fast
> /mode unstoppable

# Need to review?
> /mode sprint

# Model will adapt immediately
```

---

## ☕ Support This Project

Awaitter Lite is **free and open source**. If it saves you hours of work:

<div align="center">

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Development-FF5E5B?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/novolabs)

**Your support helps:**
- 🚀 Add more AI models
- ⚡ Improve roadmap generation
- 🐛 Faster bug fixes
- 📚 Better docs & examples

</div>

---

## 📄 License

MIT - Use freely in personal and commercial projects

---

## 🤝 Contributing & Feedback

Found a bug? Have an idea? We'd love to hear from you!

**Report Issues:** [github.com/novolabs/awaitter-lite/issues](https://github.com/novolabs/awaitter-lite/issues)

**Feature Requests:** Tell us what you want to build!

---

<div align="center">

**Made with ❤️ by [NovoLabs](https://github.com/novolabs)**

⭐ Star on GitHub • 🐛 Report Bugs • 💡 Suggest Features • ☕ Buy us a Coffee

[GitHub](https://github.com/novolabs/awaitter-lite) • [npm](https://www.npmjs.com/package/awaitter-lite) • [Ko-fi](https://ko-fi.com/novolabs)

---

**Start building smarter, not harder.** 🚀

```bash
npm install -g awaitter-lite && awaitter-lite
```

</div>
