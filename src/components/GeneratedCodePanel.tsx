"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import type { GeneratedCode } from "@/lib/types";

type GeneratedCodePanelProps = {
  code: GeneratedCode | null;
};

type HighlightToken = {
  type: "plain" | "comment" | "string" | "keyword" | "number";
  value: string;
};

const JAVASCRIPT_PATTERN =
  /(\/\/.*$|\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b(?:const|let|var|function|return|export|import|from|if|else|for|while|switch|case|break|continue|async|await|type|interface|extends|implements|new|class|throw|try|catch|null|undefined|true|false)\b)|(\b\d+(?:\.\d+)?\b)/g;

const JSON_PATTERN = /(\b\B)|("(?:[^"\\]|\\.)*")|(\b(?:true|false|null)\b)|(-?\b\d+(?:\.\d+)?\b)/g;

const CSS_PATTERN =
  /(\/\*.*?\*\/)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(@[a-z-]+|--[\w-]+|#[0-9a-fA-F]{3,8}|\.[A-Za-z_-][\w-]*)|(\b\d+(?:\.\d+)?(?:px|rem|em|vh|vw|%)?\b)/g;

const SQL_PATTERN =
  /(--.*$)|('(?:[^'\\]|\\.)*')|(\b(?:select|from|where|insert|into|update|delete|create|table|alter|drop|policy|index|exists|not|null|default|primary|key|references|on|cascade|check|and|or|for|to|using|with|enable|row|level|security|trigger|function|returns|language|begin|end)\b)|(\b\d+(?:\.\d+)?\b)/gi;

export function GeneratedCodePanel({ code }: GeneratedCodePanelProps) {
  const files = useMemo(() => code?.files ?? [], [code]);
  const [activePath, setActivePath] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (files.length === 0) {
      setActivePath("");
      setCopyStatus("idle");
      return;
    }

    setActivePath((currentPath) => {
      if (files.some((file) => file.path === currentPath)) {
        return currentPath;
      }

      return files[0].path;
    });
    setCopyStatus("idle");
  }, [files]);

  const activeFile = files.find((file) => file.path === activePath) ?? files[0] ?? null;
  const activeLines = useMemo(() => activeFile?.content.split("\n") ?? [], [activeFile]);

  async function handleCopy() {
    if (!activeFile || typeof navigator === "undefined") {
      return;
    }

    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopyStatus("copied");
    } catch {
      setCopyStatus("failed");
    }
  }

  return (
    <section className="panel code-panel">
      <div className="panel-heading">
        <p className="eyebrow">代码产物</p>
        <h2>生成代码工作台</h2>
      </div>

      {activeFile ? (
        <div className="code-workbench">
          <aside className="code-explorer">
            <div className="code-explorer-header">
              <span>文件</span>
              <strong>{code?.componentName ?? "ProjectOutput"}</strong>
            </div>

            <div className="code-file-list">
              {files.map((file) => {
                const isActive = file.path === activeFile.path;

                return (
                  <button
                    className={`code-file-entry${isActive ? " active" : ""}`}
                    key={file.path}
                    onClick={() => setActivePath(file.path)}
                    type="button"
                  >
                    <span className="code-file-name">{getBaseName(file.path)}</span>
                    <span className="code-file-meta">
                      {formatLanguage(file.language)}
                      <small>{file.path}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="code-editor-shell">
            <div className="code-tabs">
              {files.map((file) => {
                const isActive = file.path === activeFile.path;

                return (
                  <button
                    className={`code-tab${isActive ? " active" : ""}`}
                    key={file.path}
                    onClick={() => setActivePath(file.path)}
                    type="button"
                  >
                    {getBaseName(file.path)}
                  </button>
                );
              })}
            </div>

            <div className="code-toolbar">
              <div className="code-toolbar-copy">
                <strong>{activeFile.path}</strong>
                <span>{formatLanguage(activeFile.language)}</span>
              </div>

              <button className="code-copy-button" onClick={handleCopy} type="button">
                {copyStatus === "copied" ? "已复制" : copyStatus === "failed" ? "复制失败" : "复制代码"}
              </button>
            </div>

            <div className="code-editor" role="region" aria-label={`${activeFile.path} source code`}>
              {activeLines.map((line, index) => (
                <div className="code-line" key={`${activeFile.path}:${index + 1}`}>
                  <span className="code-line-number">{index + 1}</span>
                  <span className="code-line-content">{renderHighlightedLine(line, activeFile.language)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="muted">Agent 完成后，这里会以文件工作台的形式展示生成出的组件和数据结构代码。</p>
      )}
    </section>
  );
}

function renderHighlightedLine(line: string, language: string): ReactNode {
  const tokens = tokenizeLine(line, language);

  if (tokens.length === 0) {
    return " ";
  }

  return tokens.map((token, index) => (
    <span className={`code-token ${token.type}`} key={`${index}-${token.value}`}>
      {token.value.length > 0 ? token.value : " "}
    </span>
  ));
}

function tokenizeLine(line: string, language: string) {
  const pattern = getHighlightPattern(language);

  if (!pattern || line.length === 0) {
    return [{ type: "plain", value: line }] satisfies HighlightToken[];
  }

  const tokens: HighlightToken[] = [];
  let lastIndex = 0;

  for (const match of line.matchAll(pattern)) {
    const value = match[0];
    const start = match.index ?? 0;

    if (start > lastIndex) {
      tokens.push({
        type: "plain",
        value: line.slice(lastIndex, start)
      });
    }

    const type: HighlightToken["type"] = match[1]
      ? "comment"
      : match[2]
        ? "string"
        : match[3]
          ? "keyword"
          : match[4]
            ? "number"
            : "plain";

    tokens.push({ type, value });
    lastIndex = start + value.length;
  }

  if (lastIndex < line.length) {
    tokens.push({
      type: "plain",
      value: line.slice(lastIndex)
    });
  }

  return tokens;
}

function getHighlightPattern(language: string) {
  const normalized = language.trim().toLowerCase();

  if (normalized.includes("json")) {
    return JSON_PATTERN;
  }

  if (
    normalized.includes("typescript") ||
    normalized.includes("javascript") ||
    normalized.includes("tsx") ||
    normalized.includes("jsx")
  ) {
    return JAVASCRIPT_PATTERN;
  }

  if (normalized.includes("css")) {
    return CSS_PATTERN;
  }

  if (normalized.includes("sql")) {
    return SQL_PATTERN;
  }

  return null;
}

function getBaseName(path: string) {
  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] ?? path;
}

function formatLanguage(language: string) {
  const normalized = language.trim().toLowerCase();

  if (normalized === "tsx") {
    return "TSX";
  }

  if (normalized === "ts") {
    return "TypeScript";
  }

  if (normalized === "js" || normalized === "jsx") {
    return normalized.toUpperCase();
  }

  if (normalized === "json") {
    return "JSON";
  }

  if (normalized === "sql") {
    return "SQL";
  }

  if (normalized === "css") {
    return "CSS";
  }

  if (normalized === "md" || normalized === "markdown") {
    return "Markdown";
  }

  return language || "Text";
}
