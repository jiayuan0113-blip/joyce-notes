export type CardTemplate = {
  id: string;
  name: string;
  description: string;
  vars: Record<string, string>;
};

export const TEMPLATES: CardTemplate[] = [
  {
    id: "classic",
    name: "经典",
    description: "大标题 + 暖色调",
    vars: {
      "--card-bg": "#fbfaf6",
      "--card-text": "#222222",
      "--card-muted": "#858585",
      "--card-highlight": "rgba(255, 210, 0, 0.52)",
      "--card-avatar-bg": "#d9ecf5",
      "--card-avatar-color": "#2c6385",
      "--card-page-count": "#aaa6a0",
    },
  },
  {
    id: "magazine",
    name: "杂志",
    description: "衬线标题 + 分割线",
    vars: {
      "--card-bg": "#ffffff",
      "--card-text": "#1a1a1a",
      "--card-muted": "#aaaaaa",
      "--card-highlight": "rgba(200, 60, 60, 0.25)",
      "--card-avatar-bg": "#f0f0f0",
      "--card-avatar-color": "#555555",
      "--card-page-count": "#cccccc",
    },
  },
  {
    id: "minimal",
    name: "极简",
    description: "小字居中 + 大留白",
    vars: {
      "--card-bg": "#ffffff",
      "--card-text": "#333333",
      "--card-muted": "#bbbbbb",
      "--card-highlight": "rgba(0, 0, 0, 0.08)",
      "--card-avatar-bg": "#f5f5f5",
      "--card-avatar-color": "#999999",
      "--card-page-count": "#cccccc",
    },
  },
  {
    id: "dark",
    name: "深色",
    description: "暗底 + 亮色点缀",
    vars: {
      "--card-bg": "#1a1a1a",
      "--card-text": "#e0e0e0",
      "--card-muted": "#666666",
      "--card-highlight": "rgba(255, 180, 60, 0.5)",
      "--card-avatar-bg": "#2a3540",
      "--card-avatar-color": "#88b0d0",
      "--card-page-count": "#444444",
    },
  },
  {
    id: "column",
    name: "专栏",
    description: "左线装饰 + 报刊排版",
    vars: {
      "--card-bg": "#f8f6f1",
      "--card-text": "#2c2c2c",
      "--card-muted": "#8a8a8a",
      "--card-highlight": "rgba(60, 120, 180, 0.25)",
      "--card-avatar-bg": "#dce4ec",
      "--card-avatar-color": "#3c6080",
      "--card-page-count": "#b0a89c",
    },
  },
  {
    id: "memo",
    name: "便签",
    description: "手写感 + 暖黄底",
    vars: {
      "--card-bg": "#fef9e7",
      "--card-text": "#3a3520",
      "--card-muted": "#a09878",
      "--card-highlight": "rgba(220, 160, 60, 0.35)",
      "--card-avatar-bg": "#f0e6c0",
      "--card-avatar-color": "#7a6830",
      "--card-page-count": "#c8b888",
    },
  },
];

export function getTemplate(id: string): CardTemplate {
  return TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
}
