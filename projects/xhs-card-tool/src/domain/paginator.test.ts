import { describe, expect, it } from "vitest";
import { paginateBlocks } from "./paginator";
import type { CardBlock } from "./types";

function paragraph(id: string, repeat = 1): CardBlock {
  return {
    id,
    type: "paragraph",
    text: "这是一段正文。".repeat(repeat),
    runs: [{ text: "这是一段正文。".repeat(repeat) }],
  };
}

describe("paginateBlocks", () => {
  it("honors forced page breaks", () => {
    const pages = paginateBlocks([
      paragraph("p1"),
      { id: "b1", type: "pageBreak" },
      paragraph("p2"),
    ]);

    expect(pages).toHaveLength(2);
    expect(pages[0].blocks.map((block) => block.id)).toEqual(["p1"]);
    expect(pages[1].blocks.map((block) => block.id)).toEqual(["p2"]);
  });

  it("keeps image blocks with their captions as one block", () => {
    const pages = paginateBlocks([
      paragraph("intro", 8),
      { id: "img", type: "image", imageId: "img-1", alt: "图片说明" },
      paragraph("after", 8),
    ]);

    const imagePage = pages.find((page) => page.blocks.some((block) => block.id === "img"));
    expect(imagePage?.blocks).toContainEqual({ id: "img", type: "image", imageId: "img-1", alt: "图片说明" });
  });

  it("splits long content into multiple readable pages", () => {
    const blocks = Array.from({ length: 18 }, (_, index) => paragraph(`p${index}`, 3));
    const pages = paginateBlocks(blocks);

    expect(pages.length).toBeGreaterThan(1);
    expect(pages.every((page) => page.blocks.length > 0)).toBe(true);
  });
});
