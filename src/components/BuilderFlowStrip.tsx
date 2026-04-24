type BuilderFlowStripProps = {
  hasAttachments: boolean;
  hasResult: boolean;
  isGenerating: boolean;
  isPublic: boolean;
};

const steps = [
  {
    key: "input",
    index: "01",
    title: "输入需求",
    description: "写下产品目标与场景"
  },
  {
    key: "references",
    index: "02",
    title: "附加素材",
    description: "上传图片或文档参考"
  },
  {
    key: "generate",
    index: "03",
    title: "AI 生成",
    description: "规划、交互、代码、校验"
  },
  {
    key: "share",
    index: "04",
    title: "预览分享",
    description: "查看结果并切换公开状态"
  }
] as const;

export function BuilderFlowStrip({ hasAttachments, hasResult, isGenerating, isPublic }: BuilderFlowStripProps) {
  return (
    <section className="builder-flow">
      {steps.map((step) => {
        const state = resolveStepState(step.key, { hasAttachments, hasResult, isGenerating, isPublic });

        return (
          <article className={`flow-stage ${state}`} key={step.key}>
            <span className="flow-stage-index">{step.index}</span>
            <div className="flow-stage-copy">
              <strong>{step.title}</strong>
              <span>{step.description}</span>
            </div>
          </article>
        );
      })}
    </section>
  );
}

function resolveStepState(
  key: (typeof steps)[number]["key"],
  state: { hasAttachments: boolean; hasResult: boolean; isGenerating: boolean; isPublic: boolean }
) {
  switch (key) {
    case "input":
      return state.isGenerating || state.hasResult ? "complete" : "active";
    case "references":
      if (state.hasAttachments) {
        return "complete";
      }
      return state.isGenerating || state.hasResult ? "idle" : "active";
    case "generate":
      if (state.isGenerating) {
        return "active";
      }
      return state.hasResult ? "complete" : "idle";
    case "share":
      if (!state.hasResult) {
        return "idle";
      }
      return state.isPublic ? "complete" : "active";
    default:
      return "idle";
  }
}
