import type { AgentStep } from "@/lib/types";
import { formatAgentStatus } from "@/lib/ui";

const fallbackSteps: AgentStep[] = [
  {
    id: "planner",
    key: "planner",
    label: "规划 Agent",
    status: "pending",
    summary: "等待接收新的产品需求。",
    output: []
  },
  {
    id: "ux",
    key: "ux",
    label: "交互 Agent",
    status: "pending",
    summary: "等待规划结果后输出页面结构。",
    output: []
  },
  {
    id: "coder",
    key: "coder",
    label: "代码 Agent",
    status: "pending",
    summary: "等待生成页面骨架与数据模型。",
    output: []
  },
  {
    id: "qa",
    key: "qa",
    label: "校验 Agent",
    status: "pending",
    summary: "等待检查当前结果是否可演示。",
    output: []
  }
];

type AgentTimelineProps = {
  steps: AgentStep[];
  isGenerating: boolean;
};

export function AgentTimeline({ steps, isGenerating }: AgentTimelineProps) {
  const visibleSteps = steps.length > 0 ? steps : fallbackSteps;
  const hasRunningStep = visibleSteps.some((step) => step.status === "running");
  const effectiveSteps =
    isGenerating && !hasRunningStep
      ? visibleSteps.map((step, index) => (index === 0 ? { ...step, status: "running" as const } : step))
      : visibleSteps;

  return (
    <section className="panel timeline-panel">
      <div className="panel-heading">
        <p className="eyebrow">执行过程</p>
        <h2>Agent 时间线</h2>
      </div>
      <div className="timeline">
        {effectiveSteps.map((step, index) => (
          <article className={`timeline-step ${step.status}`} key={step.id}>
            <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="step-title-row">
                <h3>{step.label}</h3>
                <span>{formatAgentStatus(step.status)}</span>
              </div>
              <p>{step.summary}</p>
              {step.output.length > 0 ? (
                <ul>
                  {step.output.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
