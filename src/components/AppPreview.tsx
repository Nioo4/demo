import type { GenerationProject } from "@/lib/types";

type AppPreviewProps = {
  project: GenerationProject | null;
};

const ENTITY_LABELS: Record<string, string> = {
  agentexecutionrecord: "Agent 执行记录",
  agentrun: "Agent 执行记录",
  artifact: "产物",
  artifacts: "产物",
  calculation: "计算记录",
  course: "课程",
  idea: "想法",
  milestone: "里程碑",
  note: "笔记",
  notes: "笔记",
  product: "商品",
  project: "项目",
  record: "记录",
  session: "会话",
  task: "任务",
  user: "用户",
  workspace: "工作区"
};

const FIELD_LABELS: Record<string, string> = {
  createdat: "创建时间",
  content: "内容",
  duedate: "截止时间",
  expression: "算式",
  filepath: "文件路径",
  id: "ID",
  kind: "类型",
  mimetype: "文件类型",
  milestoneid: "里程碑ID",
  name: "名称",
  output: "输出",
  projectid: "项目ID",
  result: "结果",
  snippet: "摘要片段",
  status: "状态",
  summary: "摘要",
  taskid: "任务ID",
  timestamp: "时间",
  title: "标题",
  updatedat: "更新时间",
  userid: "用户ID"
};

export function AppPreview({ project }: AppPreviewProps) {
  if (!project) {
    return (
      <section className="panel preview-panel empty-preview">
        <p className="eyebrow">应用预览</p>
        <h2>还没有生成结果</h2>
        <p>提交一段产品需求后，这里会展示页面草图、数据结构和下一步扩展建议。</p>
      </section>
    );
  }

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <p className="eyebrow">应用草图</p>
        <h2>生成结果预览</h2>
      </div>

      <div className="preview-hero">
        <p className="eyebrow">{project.blueprint.audience}</p>
        <h2>{project.title}</h2>
        <p>{project.blueprint.valueProposition}</p>
      </div>

      <div className="screen-grid">
        {project.blueprint.screens.map((screen) => (
          <article className="screen-card" key={screen.name}>
            <span className="screen-dot" />
            <h3>{screen.name}</h3>
            <p>{screen.purpose}</p>
            <div className="chip-row">
              {screen.interactions.map((interaction) => (
                <span className="chip" key={interaction}>
                  {interaction}
                </span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="model-strip">
        {project.blueprint.dataModel.map((model) => (
          <article key={model.entity}>
            <strong>{localizeEntityLabel(model.entity)}</strong>
            <span>{model.fields.map(localizeFieldLabel).join(" / ")}</span>
          </article>
        ))}
      </div>

      <ul className="extension-list">
        {project.blueprint.extensionIdeas.map((idea) => (
          <li key={idea}>{idea}</li>
        ))}
      </ul>
    </section>
  );
}

function localizeEntityLabel(value: string) {
  if (containsChinese(value)) {
    return value;
  }

  const normalized = normalizeKey(value);
  return ENTITY_LABELS[normalized] ?? value;
}

function localizeFieldLabel(value: string) {
  if (containsChinese(value)) {
    return value;
  }

  const normalized = normalizeKey(value);
  return FIELD_LABELS[normalized] ?? value;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function containsChinese(value: string) {
  return /[\u4e00-\u9fff]/.test(value);
}
