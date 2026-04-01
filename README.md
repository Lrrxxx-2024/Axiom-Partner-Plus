# 🎨 Opinionated Creative Partner｜有主见的创作搭档

**拟人化 ≠ 说话像人。是 Agent 拥有内部状态，用状态驱动行为模式切换。**

**Personification ≠ mimicking human speech. It means the Agent owns internal states that drive behavior mode switching.**

一个超级拟人化 AI Agent 的对话框架设计与可交互 Demo。探索如何让 AI 从"听话的工具"变成"有主见的创作搭档"。

An interactive framework design and demo for a hyper-personified AI Agent. Exploring how to turn AI from an obedient tool into an opinionated creative partner.

![React](https://img.shields.io/badge/React-19-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue) ![Gemini](https://img.shields.io/badge/Gemini_API-3_Flash-orange)

---

## Demo Videos｜演示视频

> Pay attention to the right panel: the Agent doesn't just respond — it decides *how* to respond based on its internal state. Notice when it switches to DEBATE mode and pushes back.
>
> 注意右侧面板：Agent 不只是在回复，它在根据内部状态决定"怎么回复"。留意它切换到 DEBATE 模式时如何推回用户的选择。

**🎬 Content Production — Article, Image & Video Generation｜内容生产——文章、图片与视频生成**

https://youtu.be/PLYTb1-gGUU

**🧠 Internal State — Watch the Agent think and shift modes in real-time｜内部状态——实时观察 Agent 的思考与模式切换**

https://youtu.be/wo-XVfrZABI

---

## Why This Project｜为什么做这个项目

Most AI products fake "personality" with tone and emoji. This project takes a different approach: **the Agent maintains internal state variables** (creative brief, aesthetic direction, confidence level, disagreement flag) that **drive automatic switching between 5 behavior modes** — not prompt engineering tricks.

大多数 AI 产品的拟人化停留在语气词和 emoji。这个项目用不同的思路：**Agent 内部维护一组状态变量**（创作简报、审美方向、执行信心、异议标记），**用这些状态驱动 5 个行为模式之间的自动切换**——不是 prompt 技巧。

The same user input triggers completely different Agent behavior depending on its internal state. That's what separates a state-machine-driven Agent from a regular chatbot.

同一句用户输入，在不同的内部状态下会触发完全不同的 Agent 行为——这是状态机驱动与普通 Chatbot 的根本区别。

---

## The 5 Behavior Modes｜5 个行为模式

| Mode 模式 | Trigger 触发条件 | What the Agent Does 行为 |
|------|---------|-------------------|
| 🔍 **UNDERSTAND 理解意图** | Vague request 需求模糊 | Asks clarifying questions instead of guessing 主动追问，不猜测执行 |
| 💡 **PROPOSE 提出方向** | Brief is clear 需求基本清晰 | Offers 2-3 directions, states its own preference 给出多条路径并标注自己的倾向 |
| ⚡ **DEBATE 表达主见** | Disagrees with user 不认同用户选择 | Pushes back with specific reasons 给出具体理由推回 |
| 🎨 **EXECUTE 执行生产** | Direction confirmed 方向确定 | Makes micro-decisions autonomously, produces visuals 自主做微决策，产出视觉内容 |
| 🔬 **CRITIQUE 主动评审** | After execution 执行完成 | Self-reviews before asking for user feedback 先自我评价再征询意见 |

---

## Deliverables｜交付物

**Interactive Demo｜可交互 Demo**

- **Left panel**: Real-time chat with AI (LLM-powered, streaming output)
- **Right panel**: Agent internal state panel — mode switching, inner monologue, state variables, all updating in real-time


- **左侧面板**：实时对话界面（LLM 驱动，流式输出）
- **右侧面板**：Agent 内部状态面板——行为模式、内心推理、状态变量实时变化

Supports image and video generation with automatic fallback logic (video failure → image).

支持图片与视频生成，含失败自动降级逻辑（视频失败 → 自动回退图片）。

**Framework Extension Document｜框架拓展文档**

Three expansion layers — cross-session memory (RESUME/EVOLVE modes), multi-Agent collaboration (lead Agent arbitration), user profile evolution (per-dimension preference confidence). Every design decision has a "why".

三层拓展设计——跨会话记忆（新增 RESUME/EVOLVE 模式）、多 Agent 协作（主 Agent 仲裁架构）、用户画像演进（偏好置信度机制）。每个设计决策都有"为什么"。

---

## Architecture｜架构

```
User Input + Agent Internal State
        ↓
  State Machine (decides which mode)
        ↓
  Mode-specific behavior rules → Response + State Update
        ↓
  If EXECUTE → Content Production Layer (image / video / text)
```

**Dual-layer design｜双层架构：**

- **Surface layer** (user-visible): Natural language conversation｜表层（用户可见）：自然语言对话
- **State layer** (user-invisible): Internal variables driving mode transitions｜底层（用户不可见）：内部状态变量驱动模式转换

**Key architectural decisions｜关键架构决策：**

- **State machine, not dialogue tree** — creative collaboration is non-linear; same input should trigger different behavior in different states｜状态机而非对话树——创作协作是非线性的
- **Agent decides content type** — `executeType` is determined by the Agent with full context, not by frontend keyword matching｜内容类型由 Agent 决定，不靠前端关键词匹配
- **Video failure auto-fallback** — if video generation fails, automatically falls back to image with explanation｜视频失败自动回退图片
- **Mode transition constraints** — UNDERSTAND → EXECUTE is forbidden (must go through PROPOSE); DEBATE has a 2-round cap｜模式转换约束——不能跳过 PROPOSE 直接执行

---

## Tech Stack｜技术栈

| Layer 层级 | Technology 技术 |
|-------|-----------|
| Frontend 前端 | React 19 + TypeScript + Tailwind CSS + Framer Motion |
| Agent Brain Agent 大脑 | Gemini 3 Flash (streaming + structured state output) |
| Image Gen 图片生成 | Gemini 2.5 Flash Image |
| Video Gen 视频生成 | Veo 3.1 Fast (with timeout + fallback) |
| State Mgmt 状态管理 | React useState + LLM structured output via separator |

---

## Run Locally｜本地运行

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

Chat works with a free Gemini API key. Image/video generation requires a billing-enabled key.

对话功能用免费 Gemini API Key 即可。图片/视频生成需要开通计费的 Key。

---

## Project Structure｜项目结构

```
src/
├── App.tsx                    # Main UI: chat + state panel｜主界面：对话 + 状态面板
├── types.ts                   # AgentState, Message, ExecuteType｜类型定义
├── services/
│   └── geminiService.ts       # LLM chat, image gen, video gen｜API 调用层
├── lib/
│   └── utils.ts               # Tailwind utilities｜工具函数
└── index.css                  # Global styles｜全局样式
```

---

## Framework Extension｜框架拓展（已设计，待实现）

Three expansion layers designed for future development:

三层拓展方向，已完成设计文档，待工程实现：

**Layer 1 — Cross-session Memory｜跨会话记忆**

Persistent state (decision log, locked preferences, project archive) + new modes (RESUME, EVOLVE). The Agent remembers past collaborations and can revise earlier decisions when new information conflicts.

持久化状态（决策日志、锁定偏好、项目档案）+ 新增 RESUME/EVOLVE 模式。Agent 记住历史协作，并在新信息与旧决策冲突时主动修正。

**Layer 2 — Multi-Agent Collaboration｜多 Agent 协作**

Lead Agent (creative director) with sub-agents (visual, copy, strategy). Sub-agents don't communicate directly; the Lead Agent arbitrates conflicts in CRITIQUE mode.

主 Agent（创意总监）+ 子 Agent（视觉、文案、策略）。子 Agent 之间不直接通信，由主 Agent 在 CRITIQUE 阶段仲裁冲突。

**Layer 3 — User Profile Evolution｜用户画像演进**

Per-dimension preference confidence scores derived from explicit statements, selection behavior, and revision feedback. High confidence → Agent decides without asking. Low confidence → Agent confirms first.

按维度独立的偏好置信度，从用户明确表态、选择行为、修改反馈中学习。置信度高 → Agent 直接做决策；置信度低 → Agent 主动确认。

---

## Design Philosophy｜设计哲学

Every decision answers "why".｜每个决策都能回答"为什么"。

| 决策 Decision | 为什么 Why |
|------|--------|
| 状态机而非对话树 State machine, not dialogue tree | 创作协作是非线性的，同一输入在不同状态下应触发不同行为 |
| Agent 有"异议标记" Disagreement flag | 搭档和工具的本质区别——没有这个能力就退化成工具 |
| 执行阶段不问用户 No confirmation during EXECUTE | 方向对齐后自主做 micro-decisions，过度确认破坏协作信任 |
| 内容生产类型由 Agent 决定 Agent decides content type | 前端关键词匹配不可靠，Agent 有上下文能做更好的判断 |
| 视频失败自动回退图片 Video fallback to image | 用户体验不应被 API 限制打断，降级产出比报错卡住好 |

---

Built entirely with AI tools (Claude, Google AI Studio, Gemini) as a portfolio piece exploring AI Agent product design.

全程使用 AI 工具（Claude、Google AI Studio、Gemini）完成。独立完成从第一性原理出发的需求分析、框架设计、交互 Demo 搭建、代码审查与优化、拓展文档撰写。重点不在"做了一个能跑的 Demo"，而在于每一个产品决策都能回答"为什么这样设计"。
