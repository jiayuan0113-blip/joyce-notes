import { describe, expect, it } from "vitest";
import { parseMarkdownToBlocks } from "./markdownParser";
import { paginateBlocks } from "./paginator";
import { processText } from "./textProcessor";

function countBoldRuns(markdown: string): number[] {
  return paginateBlocks(parseMarkdownToBlocks(markdown, [])).map((page) =>
    page.blocks.reduce((count, block) => {
      if (!("runs" in block)) return count;
      return count + block.runs.filter((run) => run.bold).length;
    }, 0),
  );
}

function countHighlightRuns(markdown: string): number[] {
  return paginateBlocks(parseMarkdownToBlocks(markdown, [])).map((page) =>
    page.blocks.reduce((count, block) => {
      if (!("runs" in block)) return count;
      return count + block.runs.filter((run) => run.highlight).length;
    }, 0),
  );
}

describe("processText", () => {
  it("normalizes messy line breaks without rewriting content", () => {
    const raw = `让 Codex 起飞的 10 个技巧


最近我重度使用 Codex，
每天都把它放进真实工作流里。

1、给 Codex 建一套共享记忆
核心规则放 AGENTS.md，项目背景放 Obsidian。`;

    const result = processText(raw);

    expect(result.markdown).toContain("# 让 Codex 起飞的 10 个技巧");
    expect(result.markdown).toContain("最近我重度使用 Codex，每天都把它放进真实工作流里。");
    expect(result.markdown).toContain("## 1、给 Codex 建一套共享记忆");
    expect(result.markdown).toContain("核心规则放 AGENTS.md，项目背景放 Obsidian。");
    expect(result.notes).toContain("已清理多余空行");
    expect(result.notes).toContain("已识别 1 个编号小标题");
  });

  it("keeps existing markdown headings authoritative", () => {
    const raw = `# 我自己的标题

## 1、已有小标题

正文内容。`;

    const result = processText(raw);

    expect(result.markdown).toBe(`# 我自己的标题

## 1、已有小标题

正文内容。`);
  });

  it("keeps deeper markdown headings authoritative", () => {
    const raw = `### 小节

正文内容。`;

    const result = processText(raw);

    expect(result.markdown).toBe(`### 小节

正文内容。`);
  });

  it("does not collapse mixed English spacing", () => {
    const raw = "This project uses  Codex workflow.\n\n";

    const result = processText(raw);

    expect(result.markdown).toBe("This project uses  Codex workflow.");
  });

  it("inserts a space when merging adjacent English lines", () => {
    const raw = "Codex is useful\nwhen context is stable.";

    const result = processText(raw);

    expect(result.markdown).toBe("Codex is useful when context is stable.");
    expect(result.markdown).not.toContain("usefulwhen");
  });

  it("does not invent new arguments", () => {
    const raw = "关键不是问它一个问题，而是让它知道你是谁。";

    const result = processText(raw);

    expect(result.markdown).toBe("==关键不是问它一个问题，而是让它知道你是谁。==");
  });

  it("adds at most one bold and one highlight to a page while preserving the words", () => {
    const raw = `我把 Codex 当远程同事用

我最近越来越觉得，Codex 真正好用的地方，不是「它会不会写代码」。

而是你能不能把它放进自己的工作系统里。

1、先给 Codex 建一个基础文件系统

先放三类东西：你的核心准则、个人背景、近期主线。

关键不是问它一个问题，而是让它知道你是谁。`;

    const result = processText(raw);

    expect(result.markdown).toContain("# 我把 Codex 当远程同事用");
    expect(result.markdown).toContain("## 1、先给 Codex 建一个基础文件系统");
    expect(result.markdown).toContain("不是「**它会不会写代码**」。");
    expect(result.markdown).toContain("==而是你能不能把它放进自己的工作系统里。==");
    expect(result.markdown).toContain("先放三类东西：你的核心准则、个人背景、近期主线。");
    expect(result.markdown).toContain("关键不是问它一个问题，而是让它知道你是谁。");
    expect(countBoldRuns(result.markdown)).toEqual([1]);
    expect(countHighlightRuns(result.markdown)).toEqual([1]);
    expect(result.notes).toContain("已自动加粗 1 处重点");
    expect(result.notes).toContain("已自动高亮 1 处重点");
  });

  it("limits automatic bold and highlight to one item per generated page", () => {
    const filler =
      "这是一段普通解释，用来承接上下文，不应该被自动加粗，只负责把正文推到下一页。".repeat(4);
    const raw = `我把 Codex 当远程同事用

我最近越来越觉得，Codex 真正好用的地方，不是「它会不会写代码」。

关键不是问它一个问题，而是让它知道你是谁。

而是你能不能把它放进自己的工作系统里。

${filler}

${filler}

这一步的判断是：先看上下文，再做取舍。

所以工具要先理解上下文，再决定要不要动手。

真正难的是把流程固定下来。

${filler}

${filler}

核心不是做一个漂亮页面，而是把输出稳定下来。`;

    const result = processText(raw);
    const boldCounts = countBoldRuns(result.markdown);
    const highlightCounts = countHighlightRuns(result.markdown);

    expect(boldCounts.length).toBeGreaterThan(1);
    expect(boldCounts.every((count) => count <= 1)).toBe(true);
    expect(highlightCounts.every((count) => count <= 1)).toBe(true);
    expect(boldCounts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(1);
    expect(highlightCounts.reduce((sum, count) => sum + count, 0)).toBeGreaterThan(1);
  });

  it("does not double-format existing inline markdown", () => {
    const raw = `# 我自己的标题

已经有 **加粗** 和 ==高亮==。`;

    const result = processText(raw);

    expect(result.markdown).toBe(`# 我自己的标题

已经有 **加粗** 和 ==高亮==。`);
  });
});
