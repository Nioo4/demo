import type { AgentStep } from "@/lib/types";

const fallbackSteps: AgentStep[] = [
  {
    id: "planner",
    key: "planner",
    label: "Planner Agent",
    status: "pending",
    summary: "Waiting for an app brief.",
    output: []
  },
  {
    id: "ux",
    key: "ux",
    label: "UX Agent",
    status: "pending",
    summary: "Screen flow will appear here.",
    output: []
  },
  {
    id: "coder",
    key: "coder",
    label: "Code Agent",
    status: "pending",
    summary: "Generated files will appear after planning.",
    output: []
  },
  {
    id: "qa",
    key: "qa",
    label: "QA Agent",
    status: "pending",
    summary: "Viability checks will appear here.",
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
        <p className="eyebrow">Execution</p>
        <h2>Agent timeline</h2>
      </div>
      <div className="timeline">
        {effectiveSteps.map((step, index) => (
          <article className={`timeline-step ${step.status}`} key={step.id}>
            <span className="step-index">{String(index + 1).padStart(2, "0")}</span>
            <div>
              <div className="step-title-row">
                <h3>{step.label}</h3>
                <span>{step.status}</span>
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
