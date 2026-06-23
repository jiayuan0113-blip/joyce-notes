import { describe, expect, it } from "vitest";
import { parseMarkdownToBlocks } from "./markdownParser";
import type { ImageAsset } from "./types";

describe("parseMarkdownToBlocks", () => {
  it("parses headings, bold, highlights, images, and forced page breaks", () => {
    const images: ImageAsset[] = [
      { id: "img-1", name: "peter-yang.jpg", dataUrl: "data:image/jpeg;base64,abc" },
    ];
    const markdown = `# 标题

普通段落包含 **加粗** 和 ==高亮==。

![Peter Yang 访谈截图](img-1)

---

## 1、共享记忆

正文内容。`;

    const blocks = parseMarkdownToBlocks(markdown, images);

    expect(blocks).toMatchObject([
      { type: "title", text: "标题" },
      { type: "paragraph", text: "普通段落包含 加粗 和 高亮。" },
      { type: "image", imageId: "img-1", alt: "Peter Yang 访谈截图" },
      { type: "pageBreak" },
      { type: "heading", text: "1、共享记忆" },
      { type: "paragraph", text: "正文内容。" },
    ]);
    expect(blocks[1]).toMatchObject({
      runs: [
        { text: "普通段落包含 " },
        { text: "加粗", bold: true },
        { text: " 和 " },
        { text: "高亮", highlight: true },
        { text: "。" },
      ],
    });
  });

  it("keeps unknown image references as image blocks for user correction", () => {
    const blocks = parseMarkdownToBlocks("![说明](missing-image)", []);

    expect(blocks).toMatchObject([{ type: "image", imageId: "missing-image", alt: "说明" }]);
  });

  it("preserves soft line breaks in Chinese/Latin text with spaces", () => {
    const blocks = parseMarkdownToBlocks("中文\nEnglish 混排", []);

    expect(blocks).toMatchObject([{ type: "paragraph", text: "中文 English 混排" }]);
  });

  it("parses inline emphasis inside markdown headings", () => {
    const blocks = parseMarkdownToBlocks("# 我把 **Codex** 当 ==远程同事== 用", []);

    expect(blocks[0]).toMatchObject({
      type: "title",
      text: "我把 Codex 当 远程同事 用",
      runs: [
        { text: "我把 " },
        { text: "Codex", bold: true },
        { text: " 当 " },
        { text: "远程同事", highlight: true },
        { text: " 用" },
      ],
    });
  });
});
