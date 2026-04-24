"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

const navItems = [
  {
    href: "/" as Route,
    label: "总览",
    description: "了解应用功能与入口"
  },
  {
    href: "/builder" as Route,
    label: "生成台",
    description: "输入需求并实时生成结果"
  },
  {
    href: "/projects" as Route,
    label: "项目库",
    description: "浏览已保存的项目记录"
  }
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="app-sidebar">
      <div className="sidebar-header">
        <Link className="sidebar-brand" href="/">
          <span className="brand-badge">A</span>
          <div>
            <strong>Atoms Lite</strong>
            <p>中文 AI 工作台</p>
          </div>
        </Link>
      </div>

      <div className="sidebar-section">
        <p className="sidebar-caption">工作区导航</p>
        <nav className="sidebar-nav" aria-label="主导航">
          {navItems.map((item) => {
            const isActive =
              item.href === "/" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                className={`sidebar-link ${isActive ? "active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <strong>{item.label}</strong>
                <span>{item.description}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="sidebar-footer">
        <p className="sidebar-caption">使用提示</p>
        <h2>推荐从生成台开始</h2>
        <p>先输入一句需求，查看生成过程与预览结果；满意后再到项目库回看历史记录。</p>
      </div>
    </aside>
  );
}
