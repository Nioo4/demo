"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useState } from "react";

import type {
  GenerationProject,
  PreviewField,
  PreviewPage,
  PreviewSchema,
  PreviewSection
} from "@/lib/types";

type AppPreviewProps = {
  project: GenerationProject | null;
};

const ENTITY_LABELS: Record<string, string> = {
  agentexecutionrecord: "Agent 执行记录",
  agentrun: "Agent 执行记录",
  artifact: "产物",
  artifacts: "产物",
  attachment: "附件",
  calculation: "计算记录",
  course: "课程",
  idea: "想法",
  milestone: "里程碑",
  note: "笔记",
  notes: "笔记",
  preference: "偏好设置",
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
  keyboardenabled: "键盘快捷键",
  kind: "类型",
  lastaction: "最近动作",
  mimetype: "文件类型",
  milestoneid: "里程碑ID",
  name: "名称",
  output: "输出",
  precision: "精度",
  projectid: "项目ID",
  result: "结果",
  snippet: "摘要片段",
  status: "状态",
  summary: "摘要",
  taskid: "任务ID",
  theme: "主题",
  timestamp: "时间",
  title: "标题",
  updatedat: "更新时间",
  userid: "用户ID"
};

const CALCULATOR_KEYS = [
  ["7", "8", "9", "÷"],
  ["4", "5", "6", "×"],
  ["1", "2", "3", "-"],
  ["0", ".", "C", "+"]
];

export function AppPreview({ project }: AppPreviewProps) {
  if (!project) {
    return (
      <section className="panel preview-panel empty-preview">
        <p className="eyebrow">应用预览</p>
        <h2>还没有生成结果</h2>
        <p>提交一段产品需求后，这里会展示真实页面预览、数据结构和下一步扩展建议。</p>
      </section>
    );
  }

  if (project.blueprint.previewSchema?.pages.length) {
    return <SchemaPreview project={project} previewSchema={project.blueprint.previewSchema} />;
  }

  return <LegacyPreview project={project} />;
}

function SchemaPreview({ project, previewSchema }: { project: GenerationProject; previewSchema: PreviewSchema }) {
  const pages = previewSchema.pages;
  const [activePageId, setActivePageId] = useState(previewSchema.defaultPageId ?? pages[0]?.id ?? "");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [calculatorExpressions, setCalculatorExpressions] = useState<Record<string, string>>({});
  const [calculatorHistory, setCalculatorHistory] = useState<Record<string, string[]>>({});
  const calculatorHistoryEntries = useMemo(() => Object.values(calculatorHistory).flat(), [calculatorHistory]);

  useEffect(() => {
    const nextFieldValues: Record<string, string> = {};
    const nextCalculatorExpressions: Record<string, string> = {};
    const nextCalculatorHistory: Record<string, string[]> = {};

    for (const page of pages) {
      for (const section of page.sections) {
        if (section.fields) {
          for (const field of section.fields) {
            nextFieldValues[getFieldKey(section.id, field)] = field.initialValue ?? "";
          }
        }

        if (section.type === "calculator") {
          nextCalculatorExpressions[section.id] = section.presetExpression ?? "";
          nextCalculatorHistory[section.id] = [...(section.history ?? [])];
        }
      }
    }

    setFieldValues(nextFieldValues);
    setCalculatorExpressions(nextCalculatorExpressions);
    setCalculatorHistory(nextCalculatorHistory);
    setActivePageId(
      previewSchema.defaultPageId && pages.some((page) => page.id === previewSchema.defaultPageId)
        ? previewSchema.defaultPageId
        : pages[0]?.id ?? ""
    );
  }, [pages, previewSchema.defaultPageId, project.id, project.updatedAt]);

  const activePage = useMemo(
    () => pages.find((page) => page.id === activePageId) ?? pages[0] ?? null,
    [activePageId, pages]
  );

  if (!activePage) {
    return <LegacyPreview project={project} />;
  }

  return (
    <section className="panel preview-panel">
      <div className="panel-heading">
        <p className="eyebrow">真实页面预览</p>
        <h2>生成结果预览</h2>
      </div>

      <div className="rendered-preview-card">
        <div className="rendered-preview-toolbar">
          <div className="rendered-preview-title">
            <p className="eyebrow">{project.blueprint.audience}</p>
            <h3>{project.title}</h3>
            <p>{activePage.summary}</p>
          </div>
        </div>

        <div className="rendered-preview-tabs" role="tablist" aria-label="预览页面切换">
          {pages.map((page) => (
            <button
              key={page.id}
              className={`rendered-preview-tab${page.id === activePage.id ? " active" : ""}`}
              type="button"
              role="tab"
              aria-selected={page.id === activePage.id}
              onClick={() => setActivePageId(page.id)}
            >
              <strong>{page.title}</strong>
              <span>{page.summary}</span>
            </button>
          ))}
        </div>

        <div className="rendered-preview-canvas">
          {activePage.sections.map((section) =>
            renderSection({
              section,
              fieldValues,
              calculatorExpressions,
              calculatorHistory,
              calculatorHistoryEntries,
              setFieldValues,
              setCalculatorExpressions,
              setCalculatorHistory
            })
          )}
        </div>
      </div>
    </section>
  );
}

function renderSection(context: SectionRenderContext) {
  const { section } = context;

  switch (section.type) {
    case "hero":
      return (
        <article className="rendered-preview-section rendered-preview-hero" key={section.id}>
          <div className="rendered-preview-hero-copy">
            <p className="eyebrow">生成页面</p>
            <h3>{section.title}</h3>
            {section.description ? <p>{section.description}</p> : null}
          </div>

          {section.badges?.length ? (
            <div className="rendered-preview-badges">
              {section.badges.map((badge) => (
                <span className="chip" key={badge}>
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      );

    case "form":
      return (
        <article className="rendered-preview-section rendered-preview-form" key={section.id}>
          <SectionHeader section={section} />
          <div className="rendered-preview-form-grid">
            {(section.fields ?? []).map((field) => {
              const fieldKey = getFieldKey(section.id, field);

              return (
                <label className="rendered-preview-field" key={fieldKey}>
                  <span>{field.label}</span>
                  <input
                    type={field.inputType === "search" ? "text" : field.inputType}
                    value={context.fieldValues[fieldKey] ?? ""}
                    placeholder={field.placeholder}
                    onChange={(event) =>
                      context.setFieldValues((current) => ({
                        ...current,
                        [fieldKey]: event.target.value
                      }))
                    }
                  />
                </label>
              );
            })}
          </div>
        </article>
      );

    case "stats": {
      const metrics = resolvePreviewMetrics(section, context.calculatorHistoryEntries);
      return (
        <article className="rendered-preview-section" key={section.id}>
          <SectionHeader section={section} />
          <div className="rendered-preview-stats">
            {metrics.map((metric) => (
              <div className="rendered-preview-stat-card" key={`${section.id}-${metric.label}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </article>
      );
    }

    case "cardGrid":
      return (
        <article className="rendered-preview-section" key={section.id}>
          <SectionHeader section={section} />
          <div className="rendered-preview-card-grid">
            {(section.cards ?? []).map((card) => (
              <div className="rendered-preview-card" key={`${section.id}-${card.title}`}>
                <strong>{card.title}</strong>
                <p>{card.description}</p>
                {card.meta ? <span>{card.meta}</span> : null}
              </div>
            ))}
          </div>
        </article>
      );

    case "checklist":
      return (
        <article className="rendered-preview-section" key={section.id}>
          <SectionHeader section={section} />
          <ul className="rendered-preview-checklist rendered-preview-static-list">
            {(section.items ?? []).map((item, index) => (
              <li key={`${section.id}-${index}`}>
                <span className="rendered-preview-static-dot" />
                <strong>{item}</strong>
              </li>
            ))}
          </ul>
        </article>
      );

    case "table": {
      const rows = resolvePreviewRows(section, context.calculatorHistoryEntries);
      return (
        <article className="rendered-preview-section rendered-preview-table-shell" key={section.id}>
          <SectionHeader section={section} />
          <div className="rendered-preview-table-wrap">
            <table className="rendered-preview-table">
              <thead>
                <tr>
                  {(section.columns ?? []).map((column) => (
                    <th key={`${section.id}-${column}`}>{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={`${section.id}-row-${rowIndex}`}>
                    {row.map((cell, cellIndex) => (
                      <td key={`${section.id}-${rowIndex}-${cellIndex}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      );
    }

    case "kanban":
      return (
        <article className="rendered-preview-section rendered-preview-kanban-shell" key={section.id}>
          <SectionHeader section={section} />
          <div className="rendered-preview-kanban">
            {(section.board ?? []).map((column) => (
              <div className="rendered-preview-kanban-column" key={`${section.id}-${column.name}`}>
                <div className="rendered-preview-kanban-header">
                  <strong>{column.name}</strong>
                  <span>{column.cards.length} 项</span>
                </div>
                <div className="rendered-preview-kanban-cards">
                  {column.cards.map((card) => (
                    <div className="rendered-preview-kanban-card" key={`${section.id}-${column.name}-${card}`}>
                      {card}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      );

    case "calculator":
      return renderCalculatorSection(context);

    default:
      return null;
  }
}

function renderCalculatorSection(context: SectionRenderContext) {
  const { section } = context;
  const expression = context.calculatorExpressions[section.id] ?? "";
  const history = context.calculatorHistory[section.id] ?? [];
  const result = evaluateExpression(expression);

  return (
    <article className="rendered-preview-section rendered-preview-calculator" key={section.id}>
      <SectionHeader section={section} />

      <div className="rendered-preview-calculator-display">
        <label className="rendered-preview-field">
          <span>表达式</span>
          <input
            type="text"
            value={expression}
            placeholder={section.presetExpression ?? "输入表达式"}
            onChange={(event) =>
              context.setCalculatorExpressions((current) => ({
                ...current,
                [section.id]: event.target.value
              }))
            }
          />
        </label>
        <div className="rendered-preview-result-box">
          <span>计算结果</span>
          <strong>{result ?? "等待输入"}</strong>
        </div>
      </div>

      <div className="rendered-preview-keypad">
        {CALCULATOR_KEYS.flat().map((key) => (
          <button
            className={`rendered-preview-key${isOperatorKey(key) ? " operator" : ""}`}
            key={`${section.id}-${key}`}
            type="button"
            onClick={() => handleCalculatorKey(section.id, key, context)}
          >
            {key}
          </button>
        ))}
        <button
          className="rendered-preview-key wide"
          type="button"
          onClick={() => handleCalculatorKey(section.id, "DEL", context)}
        >
          DEL
        </button>
        <button
          className="rendered-preview-key wide confirm"
          type="button"
          onClick={() => commitCalculatorResult(section.id, result, context)}
        >
          =
        </button>
      </div>

      <div className="rendered-preview-history">
        <span>最近计算</span>
        <ul>
          {history.length > 0 ? (
            history.map((item, index) => <li key={`${section.id}-history-${index}`}>{item}</li>)
          ) : (
            <li>还没有计算记录</li>
          )}
        </ul>
      </div>
    </article>
  );
}

function commitCalculatorResult(sectionId: string, result: string | null, context: SectionRenderContext) {
  const expression = context.calculatorExpressions[sectionId] ?? "";
  if (!expression.trim() || !result) {
    return;
  }

  const historyEntry = `${expression} = ${result}`;
  context.setCalculatorHistory((current) => ({
    ...current,
    [sectionId]: [historyEntry, ...(current[sectionId] ?? [])].slice(0, 6)
  }));
}

function resolvePreviewMetrics(section: PreviewSection, calculatorHistoryEntries: string[]) {
  if (section.id !== "history-stats" || calculatorHistoryEntries.length === 0) {
    return section.metrics ?? [];
  }

  const latestResult = splitHistoryEntry(calculatorHistoryEntries[0]).result || "暂无";

  return (section.metrics ?? []).map((metric) => {
    if (metric.label === "今日计算") {
      return {
        ...metric,
        value: String(calculatorHistoryEntries.length)
      };
    }

    if (metric.label === "最近结果") {
      return {
        ...metric,
        value: latestResult
      };
    }

    return metric;
  });
}

function resolvePreviewRows(section: PreviewSection, calculatorHistoryEntries: string[]) {
  if (section.id !== "history-table" || calculatorHistoryEntries.length === 0) {
    return section.rows ?? [];
  }

  return calculatorHistoryEntries.map((entry, index) => {
    const { expression, result } = splitHistoryEntry(entry);

    return [expression, result || "-", formatHistoryRelativeTime(index)];
  });
}

function splitHistoryEntry(entry: string) {
  const parts = entry.split(" = ");

  if (parts.length < 2) {
    return {
      expression: entry,
      result: ""
    };
  }

  return {
    expression: parts.slice(0, -1).join(" = "),
    result: parts[parts.length - 1] ?? ""
  };
}

function formatHistoryRelativeTime(index: number) {
  if (index === 0) {
    return "刚刚";
  }

  return `${index} 条前`;
}

function handleCalculatorKey(sectionId: string, key: string, context: SectionRenderContext) {
  context.setCalculatorExpressions((current) => {
    const base = current[sectionId] ?? "";

    if (key === "C") {
      return {
        ...current,
        [sectionId]: ""
      };
    }

    if (key === "DEL") {
      return {
        ...current,
        [sectionId]: base.slice(0, -1)
      };
    }

    return {
      ...current,
      [sectionId]: `${base}${key}`
    };
  });
}

function evaluateExpression(expression: string) {
  const normalized = expression.replace(/×/g, "*").replace(/÷/g, "/").trim();
  if (!normalized) {
    return null;
  }

  if (!/^[0-9+\-*/%.()\s]+$/.test(normalized)) {
    return null;
  }

  try {
    const computed = Function(`"use strict"; return (${normalized});`)();
    if (typeof computed !== "number" || !Number.isFinite(computed)) {
      return null;
    }

    return formatNumber(computed);
  } catch {
    return null;
  }
}

function formatNumber(value: number) {
  const fixed = Number.isInteger(value) ? value.toString() : value.toFixed(6);
  return fixed.replace(/\.0+$/, "").replace(/(\.\d*?)0+$/, "$1");
}

function isOperatorKey(key: string) {
  return key === "+" || key === "-" || key === "×" || key === "÷";
}

function SectionHeader({ section }: { section: PreviewSection }) {
  return (
    <div className="rendered-preview-section-header">
      <div>
        <h3>{section.title}</h3>
        {section.description ? <p>{section.description}</p> : null}
      </div>
      {section.badges?.length ? (
        <div className="rendered-preview-badges subtle">
          {section.badges.map((badge) => (
            <span className="chip" key={`${section.id}-${badge}`}>
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function LegacyPreview({ project }: { project: GenerationProject }) {
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

function getFieldKey(sectionId: string, field: PreviewField) {
  return `${sectionId}:${field.id}`;
}

type SectionRenderContext = {
  section: PreviewSection;
  fieldValues: Record<string, string>;
  calculatorExpressions: Record<string, string>;
  calculatorHistory: Record<string, string[]>;
  calculatorHistoryEntries: string[];
  setFieldValues: Dispatch<SetStateAction<Record<string, string>>>;
  setCalculatorExpressions: Dispatch<SetStateAction<Record<string, string>>>;
  setCalculatorHistory: Dispatch<SetStateAction<Record<string, string[]>>>;
};
