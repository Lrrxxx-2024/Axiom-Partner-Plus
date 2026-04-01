# 🎨 Opinionated Creative Partner

**拟人化 ≠ 说话像人。是 Agent 拥有内部状态，用状态驱动行为模式切换。**

一个超级拟人化 AI Agent 的对话框架设计与可交互 Demo。探索如何让 AI 从"听话的工具"变成"有主见的创作搭档"。

> An interactive demo exploring how to make AI a true creative partner — not by mimicking human speech, but by giving the Agent internal states that drive behavior mode switching.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Gemini](https://img.shields.io/badge/Gemini_API-3_Flash-orange)

> Pay attention to the right panel: the Agent doesn't just respond — it decides *how* to respond based on its internal state. Notice when it switches to DEBATE mode and pushes back.

大多数AI产品的拟人化停留在语言层——加语气词、加emoji、模仿人类说话方式。这个项目提出一个不同的思路：拟人化的本质不是"怎么说话"，而是Agent是否拥有内部状态，并用状态驱动行为模式切换。

### Demo Videos

**🎬 Content Production — Article, Image & Video Generation**

https://youtu.be/PLYTb1-gGUU

**🧠 Internal State — Watch the Agent think and shift modes in real-time**

https://youtu.be/wo-XVfrZABI


---

## Why This Project

Most AI products fake "personality" with tone and emoji. This project takes a different approach:

**The Agent maintains internal state variables** (creative brief, aesthetic direction, confidence level, disagreement flag) that **drive automatic switching between 5 behavior modes** — not prompt engineering tricks.

The same user input triggers completely different Agent behavior depending on its internal state. That's what separates a state-machine-driven Agent from a regular chatbot.

Agent内部维护一组状态变量（创作简报、审美方向、执行信心、异议标记），这些状态驱动Agent在5个行为模式间自动切换：

理解意图 — 需求模糊时主动追问，不猜测执行
提出方向 — 给出多条路径并标注自己的专业倾向
表达主见 — 不认同用户选择时，给出具体理由推回
执行生产 — 方向确定后自主做微决策，产出视觉内容
主动评审 — 不等用户反馈，先自我评价再征询意见

同一句用户输入，在不同的内部状态下会触发完全不同的Agent行为——这是状态机驱动与普通Chatbot的根本区别。

## The 5 Behavior Modes

| Mode | Trigger | What the Agent Does |
|------|---------|-------------------|
| 🔍 **UNDERSTAND** | Vague request | Asks clarifying questions instead of guessing |
| 💡 **PROPOSE** | Brief is clear | Offers 2-3 directions, states its own preference |
| ⚡ **DEBATE** | Disagrees with user | Pushes back with specific reasons |
| 🎨 **EXECUTE** | Direction confirmed | Makes micro-decisions autonomously, produces visuals |
| 🔬 **CRITIQUE** | After execution | Self-reviews before asking for user feedback |

**交付物**
可交互Demo：左侧为实时对话界面（LLM驱动，流式输出），右侧实时展示Agent内部状态面板（行为模式、内心推理、状态变量变化），支持图片生成与视频生成（架构已实现，含失败自动降级逻辑）
框架拓展文档：三层拓展设计——跨会话记忆（新增RESUME/EVOLVE模式）、多Agent协作（主Agent仲裁架构）、用户画像演进（偏好置信度机制），每个设计决策都有"为什么"

## Live Demo

**Left panel**: Real-time chat with AI (streaming, LLM-powered)
**Right panel**: Agent's internal state — visible to the audience, invisible to the "user"

The right panel shows mode switching, inner monologue, confidence bar, and disagreement flag updating in real-time as the conversation progresses.

## Architecture

```
User Input + Agent Internal State
        ↓
  State Machine (decides which mode)
        ↓
  Mode-specific behavior rules → Response + State Update
        ↓
  If EXECUTE → Content Production Layer (image / video / text)
```

**Dual-layer design:**
- **Surface layer** (user-visible): Natural language conversation
- **State layer** (user-invisible): Internal variables driving mode transitions

**Key architectural decisions:**

- **State machine, not dialogue tree** — creative collaboration is non-linear; same input should trigger different behavior in different states
- **Agent decides content type** — `executeType` (image/video/text) is determined by the Agent with full context, not by frontend keyword matching
- **Video failure auto-fallback** — if video generation fails, automatically falls back to image generation with explanation
- **Mode transition constraints** — UNDERSTAND → EXECUTE is forbidden (must go through PROPOSE); DEBATE has a 2-round cap

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Tailwind CSS + Framer Motion |
| Agent Brain | Gemini 3 Flash (streaming + structured state output) |
| Image Gen | Gemini 2.5 Flash Image |
| Video Gen | Veo 3.1 Fast (implemented with timeout + fallback) |
| State Mgmt | React useState + LLM structured output via separator |

## Run Locally

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/opinionated-creative-partner.git
cd opinionated-creative-partner

# 2. Install
npm install

# 3. Set API key
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY

# 4. Run
npm run dev
```

Open `http://localhost:3000`. Chat works with a free Gemini API key. Image/video generation requires a billing-enabled key.

## Project Structure

```
src/
├── App.tsx                    # Main UI: chat + state panel
├── types.ts                   # AgentState, Message, ExecuteType
├── services/
│   └── geminiService.ts       # LLM chat, image gen, video gen
├── lib/
│   └── utils.ts               # Tailwind utilities
└── index.css                  # Global styles
```

## Framework Extension (documented, not yet implemented)

Three expansion layers designed for future development:

**Layer 1 — Cross-session Memory**: Persistent state (decision log, locked preferences, project archive) + new modes (RESUME, EVOLVE)

**Layer 2 — Multi-Agent Collaboration**: Lead Agent (creative director) with sub-agents (visual, copy, strategy). Sub-agents don't communicate directly; the Lead Agent arbitrates conflicts.

**Layer 3 — User Profile Evolution**: Per-dimension preference confidence scores. High confidence → Agent decides without asking. Low confidence → Agent confirms first.

See `framework-extension.docx` for full documentation with design rationale.

## Design Philosophy

Every decision answers "why":

- Why a state machine? → Same input, different state, different behavior
- Why does the Agent have a disagreement flag? → A partner without opinions is just a tool
- Why no confirmation during EXECUTE? → Over-confirming breaks collaboration trust
- Why self-critique before asking? → Gives the user a reference point instead of a blank "what do you think?"

独立完成从第一性原理出发的需求分析、框架设计、交互Demo搭建、代码审查与优化、拓展文档撰写。重点不在"做了一个能跑的Demo"，而在于每一个产品决策都能回答"为什么这样设计"。

---

Built entirely with AI tools (Claude, Google AI Studio, Manus) as a portfolio piece exploring AI Agent product design.
