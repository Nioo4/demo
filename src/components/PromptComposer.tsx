import type { GenerationMode } from "@/lib/types";

type PromptComposerProps = {
  prompt: string;
  mode: GenerationMode;
  llmConfigured: boolean;
  aiProvider: string;
  isGenerating: boolean;
  error: string | null;
  onPromptChange: (value: string) => void;
  onModeChange: (mode: GenerationMode) => void;
  onGenerate: () => void;
};

export function PromptComposer({
  prompt,
  mode,
  llmConfigured,
  aiProvider,
  isGenerating,
  error,
  onPromptChange,
  onModeChange,
  onGenerate
}: PromptComposerProps) {
  return (
    <section className="composer-card">
      <div className="composer-header">
        <div>
          <p className="eyebrow">需求输入</p>
          <h2>描述你想生成的应用</h2>
        </div>
        <div className="composer-controls">
          <label className="mode-picker" htmlFor="generation-mode">
            <span>生成模式</span>
            <select
              id="generation-mode"
              value={mode}
              disabled={isGenerating}
              onChange={(event) => onModeChange(event.target.value as GenerationMode)}
            >
              <option value="llm">真实 AI</option>
              <option value="mock">稳定 Mock</option>
            </select>
          </label>
          <span className="status-pill">{isGenerating ? "生成中" : "准备就绪"}</span>
        </div>
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="例如：做一个给独立开发者使用的发布计划助手，包含任务拆解、里程碑、发布说明生成和历史记录。"
      />
      <div className="composer-footer">
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p>
            {mode === "llm" && !llmConfigured
              ? `真实 AI 需要服务端配置 ${aiProvider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY"}，未配置时可先切回稳定 Mock。`
              : "建议把目标用户、核心流程、希望得到的页面或结果写清楚。"}
          </p>
        )}
        <button className="button primary" type="button" disabled={isGenerating} onClick={onGenerate}>
          {isGenerating ? "正在生成..." : "开始生成"}
        </button>
      </div>
    </section>
  );
}
