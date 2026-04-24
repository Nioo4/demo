import type { AppBlueprint, PreviewCard, PreviewPage, PreviewSchema, ProjectAttachment } from "./types";

export function buildPreviewSchema(
  prompt: string,
  title: string,
  blueprint: AppBlueprint,
  attachments: ProjectAttachment[] = []
): PreviewSchema {
  const lower = prompt.toLowerCase();
  const hasAttachments = attachments.length > 0;
  const isCalculator =
    lower.includes("calculator") || lower.includes("calc") || prompt.includes("计算器") || prompt.includes("运算");
  const isTeamTool =
    lower.includes("team") || lower.includes("task") || lower.includes("kanban") || prompt.includes("团队") || prompt.includes("任务");
  const isCommerce =
    lower.includes("shop") ||
    lower.includes("store") ||
    lower.includes("commerce") ||
    prompt.includes("商城") ||
    prompt.includes("电商") ||
    prompt.includes("店铺");
  const isLearning =
    lower.includes("learn") ||
    lower.includes("course") ||
    lower.includes("study") ||
    prompt.includes("学习") ||
    prompt.includes("课程") ||
    prompt.includes("教育");

  if (isCalculator) {
    return buildCalculatorPreview(title, blueprint);
  }

  if (isTeamTool) {
    return buildTeamPreview(title, blueprint, hasAttachments);
  }

  if (isCommerce) {
    return buildCommercePreview(title, blueprint);
  }

  if (isLearning) {
    return buildLearningPreview(title, blueprint);
  }

  return buildGeneralPreview(title, blueprint, hasAttachments);
}

function buildCalculatorPreview(title: string, blueprint: AppBlueprint): PreviewSchema {
  return {
    defaultPageId: "workspace",
    pages: [
      {
        id: "workspace",
        title: "计算面板",
        summary: "直接输入表达式并完成基础计算。",
        primaryAction: "查看历史",
        secondaryAction: "切换主题",
        sections: [
          {
            id: "hero",
            type: "hero",
            title,
            description: blueprint.valueProposition,
            badges: [blueprint.audience, "四则运算", "即时结果"],
            primaryAction: "开始计算",
            secondaryAction: "复制结果"
          },
          {
            id: "calculator-main",
            type: "calculator",
            title: "计算器主面板",
            description: "输入数字、运算符并实时查看结果。",
            badges: ["可编辑输入", "本地交互"],
            primaryAction: "写入历史",
            secondaryAction: "清空表达式",
            presetExpression: "12+8",
            history: ["12 + 8 = 20", "15 × 6 = 90", "100 ÷ 4 = 25"]
          },
          {
            id: "capabilities",
            type: "checklist",
            title: "当前能力",
            description: "用于展示该版本已经覆盖的交互点。",
            items: ["输入数字与运算符", "查看实时结果", "保存历史记录", "切换主题样式"]
          }
        ]
      },
      {
        id: "history",
        title: "历史记录",
        summary: "展示最近计算和常用能力。",
        primaryAction: "回到计算面板",
        sections: [
          {
            id: "history-stats",
            type: "stats",
            title: "使用概览",
            description: "这里用可视化方式补充产品状态。",
            metrics: [
              { label: "今日计算", value: "18" },
              { label: "最近结果", value: "20" },
              { label: "常用操作", value: "加减乘除" }
            ]
          },
          {
            id: "history-table",
            type: "table",
            title: "最近计算",
            description: "以表格形式预览真实页面的记录区。",
            columns: ["算式", "结果", "时间"],
            rows: [
              ["12 + 8", "20", "刚刚"],
              ["15 × 6", "90", "2 分钟前"],
              ["100 ÷ 4", "25", "5 分钟前"]
            ]
          }
        ]
      }
    ]
  };
}

function buildTeamPreview(title: string, blueprint: AppBlueprint, hasAttachments: boolean): PreviewSchema {
  return {
    defaultPageId: "board",
    pages: [
      {
        id: "board",
        title: "任务看板",
        summary: "围绕协作状态、任务推进和风险同步构建主界面。",
        primaryAction: "新建任务",
        secondaryAction: "筛选任务",
        sections: [
          {
            id: "hero",
            type: "hero",
            title,
            description: blueprint.valueProposition,
            badges: [blueprint.audience, "协作工作流", hasAttachments ? "含素材输入" : "轻量协作"],
            primaryAction: "创建任务",
            secondaryAction: "邀请成员"
          },
          {
            id: "board-columns",
            type: "kanban",
            title: "任务流转",
            description: "以可交互看板展示真实页面布局。",
            board: [
              { name: "待处理", cards: ["需求梳理", "确定角色权限"] },
              { name: "进行中", cards: ["接口联调", "页面收口"] },
              { name: "已完成", cards: ["数据库设计", "分享链路"] }
            ]
          },
          {
            id: "focus-list",
            type: "checklist",
            title: "今日重点",
            description: "补充真实产品里常见的待办区块。",
            items: ["同步里程碑", "整理 blockers", "更新交付状态", "确认演示流程"]
          }
        ]
      },
      {
        id: "review",
        title: "项目复盘",
        summary: "展示结果摘要、风险和近期计划。",
        primaryAction: "导出摘要",
        sections: [
          {
            id: "review-stats",
            type: "stats",
            title: "进度概览",
            metrics: [
              { label: "活跃任务", value: "12" },
              { label: "待确认风险", value: "3" },
              { label: "本周交付", value: "2 项" }
            ]
          },
          {
            id: "review-cards",
            type: "cardGrid",
            title: "关键结论",
            cards: toCards(blueprint.extensionIdeas)
          }
        ]
      }
    ]
  };
}

function buildCommercePreview(title: string, blueprint: AppBlueprint): PreviewSchema {
  return {
    defaultPageId: "catalog",
    pages: [
      {
        id: "catalog",
        title: "商品工作台",
        summary: "展示商品列表、活动信息和转化指标。",
        primaryAction: "新增商品",
        secondaryAction: "查看活动",
        sections: [
          {
            id: "hero",
            type: "hero",
            title,
            description: blueprint.valueProposition,
            badges: [blueprint.audience, "商品管理", "转化追踪"],
            primaryAction: "发布商品",
            secondaryAction: "查看订单"
          },
          {
            id: "commerce-stats",
            type: "stats",
            title: "运营指标",
            metrics: [
              { label: "今日访问", value: "2,340" },
              { label: "转化率", value: "6.2%" },
              { label: "待发货", value: "18" }
            ]
          },
          {
            id: "product-grid",
            type: "cardGrid",
            title: "推荐商品",
            cards: [
              { title: "新品首发", description: "突出本期活动商品与卖点。", meta: "库存 120" },
              { title: "高转化单品", description: "适合放在首页卡位展示。", meta: "转化 8.4%" },
              { title: "会员专区", description: "支持优惠策略与会员价展示。", meta: "会员可见" }
            ]
          }
        ]
      },
      {
        id: "orders",
        title: "订单总览",
        summary: "补充真实后台页面里的表格视图。",
        primaryAction: "导出订单",
        sections: [
          {
            id: "orders-table",
            type: "table",
            title: "最近订单",
            columns: ["订单号", "用户", "状态", "金额"],
            rows: [
              ["A-1024", "张三", "待发货", "¥299"],
              ["A-1025", "李四", "已支付", "¥159"],
              ["A-1026", "王五", "已完成", "¥499"]
            ]
          }
        ]
      }
    ]
  };
}

function buildLearningPreview(title: string, blueprint: AppBlueprint): PreviewSchema {
  return {
    defaultPageId: "learning-path",
    pages: [
      {
        id: "learning-path",
        title: "学习路径",
        summary: "用课程、进度和任务组织学习体验。",
        primaryAction: "继续学习",
        secondaryAction: "切换课程",
        sections: [
          {
            id: "hero",
            type: "hero",
            title,
            description: blueprint.valueProposition,
            badges: [blueprint.audience, "课程组织", "阶段进度"],
            primaryAction: "开始章节",
            secondaryAction: "查看笔记"
          },
          {
            id: "learning-stats",
            type: "stats",
            title: "学习概览",
            metrics: [
              { label: "已完成章节", value: "6/12" },
              { label: "本周学习", value: "4 小时" },
              { label: "待复习", value: "3 个知识点" }
            ]
          },
          {
            id: "chapter-list",
            type: "checklist",
            title: "本周学习任务",
            items: ["完成第 3 章练习", "整理课堂笔记", "提交小测验", "复习重点概念"]
          }
        ]
      },
      {
        id: "course-library",
        title: "课程内容",
        summary: "展示课程卡片与章节入口。",
        sections: [
          {
            id: "course-cards",
            type: "cardGrid",
            title: "推荐内容",
            cards: toCards(blueprint.screens.map((screen) => `${screen.name}: ${screen.purpose}`))
          }
        ]
      }
    ]
  };
}

function buildGeneralPreview(title: string, blueprint: AppBlueprint, hasAttachments: boolean): PreviewSchema {
  const firstPageSections = [
    {
      id: "hero",
      type: "hero" as const,
      title,
      description: blueprint.valueProposition,
      badges: [blueprint.audience, hasAttachments ? "含参考素材" : "需求直出"],
      primaryAction: "提交主流程",
      secondaryAction: "查看产物"
    },
    {
      id: "intake-form",
      type: "form" as const,
      title: "信息输入",
      description: "模拟真实应用里的输入区和主操作按钮。",
      fields: [
        { id: "goal", label: "目标", inputType: "text" as const, placeholder: "输入这次要完成的目标" },
        { id: "owner", label: "负责人", inputType: "text" as const, placeholder: "填写负责人或角色" },
        { id: "keyword", label: "关键词", inputType: "search" as const, placeholder: "例如：增长、协作、效率" }
      ],
      primaryAction: "保存信息",
      secondaryAction: "清空表单"
    },
    {
      id: "status-stats",
      type: "stats" as const,
      title: "状态概览",
      metrics: [
        { label: "页面数", value: String(blueprint.screens.length) },
        { label: "数据实体", value: String(blueprint.dataModel.length) },
        { label: "扩展方向", value: String(blueprint.extensionIdeas.length) }
      ]
    }
  ];

  const followUpCards = blueprint.screens.map((screen) => ({
    title: screen.name,
    description: screen.purpose,
    meta: screen.interactions.slice(0, 2).join(" / ")
  }));

  return {
    defaultPageId: "overview",
    pages: [
      {
        id: "overview",
        title: "概览页",
        summary: "用真实页面结构承接本次生成结果。",
        primaryAction: "继续编辑",
        secondaryAction: "打开详情",
        sections: firstPageSections
      },
      {
        id: "workspace",
        title: "工作区",
        summary: "展示页面卡片、待办清单和数据区。",
        primaryAction: "新增模块",
        sections: [
          {
            id: "workspace-cards",
            type: "cardGrid",
            title: "页面模块",
            description: "将蓝图中的页面结构渲染成可浏览模块。",
            cards: followUpCards
          },
          {
            id: "workspace-list",
            type: "checklist",
            title: "下一步动作",
            items: blueprint.extensionIdeas.slice(0, 4)
          }
        ]
      },
      {
        id: "data",
        title: "数据视图",
        summary: "补充一个更像后台页面的数据表视图。",
        sections: [
          {
            id: "data-table",
            type: "table",
            title: "数据模型",
            columns: ["实体", "字段说明"],
            rows: blueprint.dataModel.map((model) => [model.entity, model.fields.join(" / ")])
          }
        ]
      }
    ]
  };
}

function toCards(items: string[]): PreviewCard[] {
  return items.slice(0, 6).map((item, index) => ({
    title: `模块 ${index + 1}`,
    description: item,
    meta: index === 0 ? "优先展示" : "可继续扩展"
  }));
}
