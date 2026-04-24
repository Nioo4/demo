export type PromptTemplate = {
  id: string;
  category: string;
  title: string;
  description: string;
  prompt: string;
};

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "saas-launch",
    category: "SaaS",
    title: "产品发布助手",
    description: "适合做 To-do、里程碑、发布说明和版本节奏管理。",
    prompt:
      "做一个面向独立开发者的产品发布助手，包含需求整理、发布时间线、版本说明生成、风险提醒和历史发布记录页面。"
  },
  {
    id: "content-studio",
    category: "内容创作",
    title: "内容选题工作台",
    description: "适合做选题池、创作流程、素材整理和发布复盘。",
    prompt:
      "做一个内容创作者使用的选题工作台，支持记录灵感、整理素材、规划内容日历、生成发布文案和复盘数据。"
  },
  {
    id: "shop-dashboard",
    category: "电商",
    title: "店铺运营看板",
    description: "适合做商品、订单、库存和营销活动协同。",
    prompt:
      "做一个小型电商品牌使用的运营看板，包含商品管理、库存预警、订单概览、活动计划和运营日报。"
  },
  {
    id: "edu-coach",
    category: "教育",
    title: "学习路径规划器",
    description: "适合做课程路线、打卡任务和学习反馈。",
    prompt:
      "做一个帮助用户制定学习路径的应用，包含课程路线图、阶段任务、打卡提醒、知识点总结和学习反馈页面。"
  },
  {
    id: "team-ops",
    category: "内部工具",
    title: "团队协作中心",
    description: "适合做项目状态、会议纪要和跨角色同步。",
    prompt:
      "做一个小团队协作中心，支持项目状态同步、会议纪要整理、任务分配、进度提醒和共享资料查看。"
  },
  {
    id: "community-hub",
    category: "社区",
    title: "社区活动平台",
    description: "适合做活动报名、内容发现和成员成长。",
    prompt:
      "做一个社区活动平台，包含活动发现、报名管理、成员成长记录、通知公告和活动回顾页面。"
  }
];
