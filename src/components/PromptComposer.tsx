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
          <p className="eyebrow">Input</p>
          <h2>App brief</h2>
        </div>
        <div className="composer-controls">
          <label className="mode-picker" htmlFor="generation-mode">
            <span>Generation mode</span>
            <select
              id="generation-mode"
              value={mode}
              disabled={isGenerating}
              onChange={(event) => onModeChange(event.target.value as GenerationMode)}
            >
              <option value="llm">Real AI</option>
              <option value="mock">Mock</option>
            </select>
          </label>
          <span className="status-pill">{isGenerating ? "Agents running" : "Ready"}</span>
        </div>
      </div>
      <textarea
        value={prompt}
        onChange={(event) => onPromptChange(event.target.value)}
        placeholder="Describe the app you want to build..."
      />
      <div className="composer-footer">
        {error ? (
          <p className="error-text">{error}</p>
        ) : (
          <p>
            {mode === "llm" && !llmConfigured
              ? `Real AI needs ${aiProvider === "deepseek" ? "DEEPSEEK_API_KEY" : "OPENAI_API_KEY"} on server. Switch to Mock if key is missing.`
              : "Tip: include audience, workflow, and desired output."}
          </p>
        )}
        <button className="button primary" type="button" disabled={isGenerating} onClick={onGenerate}>
          {isGenerating ? "Generating..." : "Generate Demo"}
        </button>
      </div>
    </section>
  );
}
