# Atoms Lite Demo 项目说明

## 1. 实现思路与关键取舍

### 1.1 技术选型

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 15 App Router | 前后端同构，减少工程拆分成本 |
| 数据库 | Supabase (Postgres) | 内置 Auth + RLS，一站式解决用户隔离和持久化 |
| AI | DeepSeek + OpenAI 双支持 | Mock/LLM 两套生成模式，默认 DeepSeek |
| 样式 | 手写 CSS | 项目规模不大，精确控制风格，减少依赖 |
| 语言 | TypeScript 5.7 | 类型安全，减少运行时错误 |

### 1.2 核心架构

**数据流：**
```
用户输入需求 → PromptComposer 收集 prompt + attachments
    ↓
POST /api/generate-stream (SSE 流式)
    ↓
generation-service 路由到 mock/llm
    ↓
AI 生成 (blueprint + code + agentSteps)
    ↓
saveProject 写入 Supabase
    ↓
前端 SSE 事件驱动，实时更新 UI
```

**双模式生成：**
- `Mock 模式`：本地确定性生成，稳定可控，用于演示/调试
- `LLM 模式`：调用 DeepSeek 或 OpenAI，生成更真实的应用结果

### 1.3 关键取舍

| 取舍 | 决策 | 原因 |
|------|------|------|
| 生成结果展示 | 蓝图预览 + 代码片段 | 笔试时长内优先保证完整闭环，不做不稳定动态执行沙盒 |
| 多 Agent | 阶段化展示 | 保留 AI 工作流过程感，控制实现复杂度 |
| CSS | 手写 CSS | 项目规模不大，精确控制风格，减少依赖 |
| 文件上传 | 参考素材能力 | 先保证功能闭环，逐步增强理解能力 |
| 预览渲染 | 蓝图展示 | 不做受控渲染 schema，保持灵活性 |

---

## 2. 当前完成程度

### 2.1 已完成 ✅

#### 基础产品闭环
- [x] 需求输入（PromptComposer，支持 textarea）
- [x] Prompt 模板库（6 个预设模板）
- [x] AI 生成（Mock + LLM 双模式）
- [x] 流式生成（SSE，支持 step_update 事件）
- [x] 结果展示（蓝图预览 + 代码工作台 + Agent 时间线）
- [x] 项目保存（Supabase 持久化）
- [x] 项目详情页（`/projects/[id]`）
- [x] 公开分享页（`/share/[token]`）

#### 用户体系
- [x] Supabase Auth 登录/注册
- [x] 用户数据隔离（项目按 owner_id 隔离）
- [x] AuthProvider 上下文管理
- [x] AuthRequired 组件拦截未登录用户

#### AI 能力
- [x] DeepSeek API 集成（`deepseek-chat`）
- [x] OpenAI API 集成（`gpt-4o`）
- [x] JSON Schema 约束 AI 输出格式
- [x] 容错机制（normalizeLlmProject 兜底）
- [x] Mock 生成器（确定性本地生成）

#### 四阶段 Agent 工作流
- [x] Planner Agent（规划）
- [x] UX Agent（交互设计）
- [x] Coder Agent（代码生成）
- [x] QA Agent（校验）

#### 扩展功能
- [x] 参考素材上传（图片 + 文档，最多 5 个）
- [x] 文本文件内容提取
- [x] Prompt 模板库
- [x] 项目搜索（按标题/需求关键词）
- [x] 项目筛选（全部/收藏/公开/私有）
- [x] 项目排序（更新时间/创建时间）
- [x] 项目收藏（isFavorite）
- [x] 项目重命名
- [x] 项目删除
- [x] 公开/私有切换
- [x] 分享链接复制
- [x] Artifacts 下载

#### 代码质量
- [x] TypeScript 严格类型检查
- [x] ESLint 代码规范检查
- [x] 类型检查脚本（`npm run typecheck`）
- [x] 数据库测试脚本（`npm run test:real-db`）
- [x] AI 测试脚本（`npm run test:real-ai`）

### 2.2 未完成 ❌

| 功能 | 状态 | 说明 |
|------|------|------|
| 真正可执行预览 | 未做 | 当前是蓝图展示，不是可交互应用运行页 |
| 真实多 Agent 编排 | 未做 | 当前是阶段化展示，非独立编排 |
| 多模态文件解析 | 部分 | 文本文件支持较好，PDF/DOCX/图片解析有限 |
| 生产级注册流程 | 部分 | 缺少自定义 SMTP、邮件验证策略 |
| 自动化 E2E 测试 | 部分 | 只有类型检查和集成脚本，缺完整回归测试 |
| Vercel 部署 | 未完成 | RLS 策略报错待排查 |

---

## 3. 未来扩展计划

### P0：优先补强"完成度"和"可交付性"

| 优先级 | 任务 | 理由 |
|--------|------|------|
| P0-1 | **受控预览渲染 schema** | 让 AI 输出更细粒度页面结构，前端渲染成真实产品预览，提升展示说服力 |
| P0-2 | **完善异常处理** | 补齐关键链路错误提示、失败兜底、加载状态 |
| P0-3 | **Vercel 部署收口** | 排查 RLS 策略错误，确保生产部署可用 |
| P0-4 | **自动化回归测试** | E2E 测试覆盖关键用户路径 |

### P1：优先补强"工程深度"

| 优先级 | 任务 | 理由 |
|--------|------|------|
| P1-1 | **真实分阶段 Agent** | planner → ux → coder → qa 串行生成，每阶段结果独立存 artifacts |
| P1-2 | **结构化产物链** | 页面 schema、接口草案、测试清单、交互说明等更多产物类型 |
| P1-3 | **多 Agent 编排系统** | 调度系统和状态同步，支持 Agent 间通信 |
| P1-4 | **版本历史** | 支持生成结果版本对比和回滚 |

### P2：优先补强"产品化能力"

| 优先级 | 任务 | 理由 |
|--------|------|------|
| P2-1 | **高级文件理解** | PDF/DOCX 正文抽取、图片 OCR、图像理解 |
| P2-2 | **用户体系完善** | 自定义 SMTP、密码重置、邮箱验证、账号信息页 |
| P2-3 | **导出与协作** | 导出 Markdown/JSON、生成分享摘要、多人协作查看 |
| P2-4 | **代码执行沙盒** | 真正可运行的代码预览环境（Docker/WebContainer） |

---

## 4. 项目结构

```
e:/projects/demo/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 首页
│   │   ├── auth/              # 登录/注册页
│   │   ├── builder/           # 生成台
│   │   ├── projects/          # 项目库
│   │   ├── share/[token]/     # 分享页
│   │   └── api/               # API 路由
│   │       ├── generate/      # 同步生成
│   │       ├── generate-stream/ # 流式生成 (SSE)
│   │       ├── projects/      # 项目 CRUD
│   │       └── health/        # 健康检查
│   ├── components/            # React 组件
│   │   ├── AuthProvider.tsx   # 认证上下文
│   │   ├── BuilderWorkspace.tsx # 生成台核心
│   │   ├── PromptComposer.tsx # 需求输入
│   │   ├── AgentTimeline.tsx  # Agent 时间线
│   │   ├── AppPreview.tsx     # 蓝图预览
│   │   ├── GeneratedCodePanel.tsx # 代码工作台
│   │   └── ProjectsExplorer.tsx # 项目列表
│   └── lib/                   # 核心业务逻辑
│       ├── ai-generator.ts    # AI 生成器
│       ├── mock-generator.ts  # Mock 生成器
│       ├── generation-service.ts # 生成服务
│       ├── server-store.ts   # Supabase 存储
│       └── types.ts          # 类型定义
├── supabase/
│   ├── schema.sql            # 数据库 Schema
│   └── migrations/           # 迁移脚本
└── docs/                     # 设计文档
```

---

## 5. 快速开始

```bash
# 安装依赖
npm install

# 本地开发
npm run dev

# 类型检查
npm run typecheck

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 运行数据库测试
npm run test:real-db

# 运行 AI 测试
npm run test:real-ai
```

### 环境变量配置

```bash
# Supabase (必需)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI (可选，不配置则使用 Mock 模式)
DEEPSEEK_API_KEY=your_deepseek_api_key
# 或
OPENAI_API_KEY=your_openai_api_key
```
