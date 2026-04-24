import type { Metadata } from "next";

import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/components/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Atoms Lite 中文工作台",
  description: "一个用于生成应用方案、查看过程与保存项目记录的中文 AI 工作台。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AuthProvider>
          <div className="app-shell">
            <AppSidebar />
            <div className="app-main">
              <header className="topbar">
                <div className="topbar-copy">
                  <p className="eyebrow">AI Workspace</p>
                  <h1 className="topbar-title">Atoms Lite 中文工作台</h1>
                  <p className="topbar-text">输入需求、上传素材、查看生成过程并管理项目结果。</p>
                </div>
                <div className="topbar-actions">
                  <span className="topbar-chip">生成台 / 项目库 / 分享页</span>
                </div>
              </header>
              <div className="page-slot">{children}</div>
            </div>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
