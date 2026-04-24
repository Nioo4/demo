import type { AgentStep, AppBlueprint, GeneratedCode, GenerationProject, ProjectAttachment } from "./types";

const SAMPLE_PROMPT =
  "做一个面向独立开发者的发布计划助手，能把产品想法整理成页面结构、任务清单和发布说明。";

export function getSamplePrompt() {
  return SAMPLE_PROMPT;
}

export function generateMockProject(prompt: string, attachments: ProjectAttachment[] = []): GenerationProject {
  const normalizedPrompt = normalizePrompt(prompt);
  const now = new Date().toISOString();
  const title = buildTitle(normalizedPrompt);
  const blueprint = buildBlueprint(normalizedPrompt, title, attachments);
  const generatedCode = buildGeneratedCode(title, blueprint);
  const agentSteps = buildAgentSteps(blueprint, attachments);

  return {
    id: crypto.randomUUID(),
    title,
    prompt: normalizedPrompt,
    status: "ready",
    isPublic: false,
    isFavorite: false,
    shareToken: null,
    theme: "command-center",
    attachments,
    artifacts: [],
    agentSteps,
    blueprint,
    generatedCode,
    createdAt: now,
    updatedAt: now
  };
}

function normalizePrompt(prompt: string) {
  const trimmed = prompt.trim();
  return trimmed.length > 0 ? trimmed : SAMPLE_PROMPT;
}

function buildTitle(prompt: string) {
  const compact = prompt.trim().replace(/\s+/g, " ");
  const chineseOnly = compact.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, "");

  if (/[\u4e00-\u9fa5]/.test(chineseOnly)) {
    return `${chineseOnly.slice(0, 10) || "AI应用"}工作台`;
  }

  const words = compact
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5);

  if (words.length === 0) {
    return "AI 应用工作台";
  }

  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildBlueprint(prompt: string, title: string, attachments: ProjectAttachment[]): AppBlueprint {
  const lower = prompt.toLowerCase();
  const hasAttachments = attachments.length > 0;
  const isTeamTool =
    lower.includes("team") || lower.includes("collaborat") || prompt.includes("团队") || prompt.includes("协作");
  const isCommerce =
    lower.includes("shop") ||
    lower.includes("store") ||
    lower.includes("commerce") ||
    prompt.includes("商城") ||
    prompt.includes("电商") ||
    prompt.includes("店铺");
  const isLearning =
    lower.includes("learn") ||
    lower.includes("course") ||
    lower.includes("study") ||
    prompt.includes("学习") ||
    prompt.includes("课程") ||
    prompt.includes("教育");

  const audience = isTeamTool
    ? "需要快速协同与对齐的小团队"
    : isCommerce
      ? "需要聚焦售卖流程的运营与商家"
      : isLearning
        ? "需要循序渐进学习路径的用户"
        : "想快速验证产品方向的独立开发者";

  const primaryEntity = isCommerce ? "商品" : isLearning ? "课程" : isTeamTool ? "工作区" : "想法";
  const screens = [
    {
      name: "需求控制台",
      purpose: "接收用户目标与约束，并展示当前生成状态。",
      interactions: ["提交需求", "查看 Agent 进度", "重新生成"]
    },
    {
      name: "生成工作区",
      purpose: "展示应用结构、主要流程和建议下一步。",
      interactions: ["查看页面结构", "打开代码片段", "保存项目"]
    },
    {
      name: hasAttachments ? "参考素材面板" : "项目记录",
      purpose: hasAttachments ? "集中查看上传的文档和图片，并将它们作为方案参考。" : "保存每次生成结果，方便横向对比与继续迭代。",
      interactions: hasAttachments ? ["浏览文档摘要", "查看图片参考", "回到需求编辑"] : ["浏览历史结果", "重新打开项目", "清理旧草稿"]
    }
  ];

  const dataModel = [
    {
      entity: primaryEntity,
      fields: ["id", "title", "status", "summary", "createdAt", "updatedAt"]
    },
    {
      entity: "Agent执行记录",
      fields: ["id", "projectId", "agentKey", "status", "summary", "output"]
    },
    {
      entity: hasAttachments ? "参考素材" : "产物",
      fields: hasAttachments ? ["id", "projectId", "kind", "name", "mimeType", "snippet"] : ["id", "projectId", "kind", "name", "content"]
    }
  ];

  return {
    audience,
    valueProposition: hasAttachments
      ? `${title} 会结合这次上传的 ${attachments.length} 个参考素材，把模糊需求整理成页面结构、交互重点和可复看的结果。`
      : `${title} 会把模糊的需求整理成清晰流程，给出页面结构、下一步动作、可保存状态和可复看的结果。`,
    screens,
    dataModel,
    extensionIdeas: [
      hasAttachments ? "给图片和文档补充自动摘要、OCR 与标签能力。" : "把生成结果进一步拆成可编辑的页面与组件级产物。",
      "补上用户登录与权限控制，支持多人查看同一个项目。",
      "增加一键导出仓库或部署预览的能力。"
    ]
  };
}

function buildGeneratedCode(title: string, blueprint: AppBlueprint): GeneratedCode {
  const componentName = `${title.replace(/[^\w]/g, "") || "Generated"}Preview`;
  const firstScreen = blueprint.screens[0];

  return {
    componentName,
    files: [
      {
        path: "src/generated/AppPreview.tsx",
        language: "tsx",
        content: `export function ${componentName}() {
  return (
    <main className="generated-app">
      <p className="eyebrow">${blueprint.audience}</p>
      <h1>${title}</h1>
      <p>${blueprint.valueProposition}</p>
      <section>
        <h2>${firstScreen.name}</h2>
        <p>${firstScreen.purpose}</p>
      </section>
    </main>
  );
}
`
      },
      {
        path: "src/generated/data-model.ts",
        language: "ts",
        content: `export const dataModel = ${JSON.stringify(blueprint.dataModel, null, 2)} as const;
`
      }
    ]
  };
}

function buildAgentSteps(blueprint: AppBlueprint, attachments: ProjectAttachment[]): AgentStep[] {
  const attachmentOutput =
    attachments.length > 0
      ? [`识别到 ${attachments.length} 个参考素材`, ...attachments.slice(0, 2).map((attachment) => attachment.name)]
      : [];

  return [
    {
      id: crypto.randomUUID(),
      key: "planner",
      label: "规划 Agent",
      status: "complete",
      summary: "已把原始需求整理成更明确的产品方向。",
      output: [blueprint.audience, blueprint.valueProposition]
    },
    {
      id: crypto.randomUUID(),
      key: "ux",
      label: "交互 Agent",
      status: "complete",
      summary: attachments.length > 0 ? "已结合上传素材规划主要页面与交互路径。" : "已规划主要页面与核心交互路径。",
      output: [...attachmentOutput, ...blueprint.screens.map((screen) => `${screen.name}: ${screen.purpose}`)].slice(0, 5)
    },
    {
      id: crypto.randomUUID(),
      key: "coder",
      label: "代码 Agent",
      status: "complete",
      summary: "已生成组件骨架与数据模型草稿。",
      output: blueprint.dataModel.map((model) => `${model.entity}: ${model.fields.join("、")}`)
    },
    {
      id: crypto.randomUUID(),
      key: "qa",
      label: "校验 Agent",
      status: "complete",
      summary: "已检查结果是否具备演示与继续迭代的可行性。",
      output: [
        attachments.length > 0 ? "上传素材已进入当前项目上下文。" : "当前原型已具备从需求输入到结果预览的完整闭环。",
        "项目结果会落到 Supabase 的 projects 与 agent_runs 表。",
        "真实 AI 与稳定 Mock 共用同一套前端与接口契约。"
      ]
    }
  ];
}
