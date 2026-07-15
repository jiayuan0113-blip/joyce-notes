import type { CardBlock, CardPage } from "./types";

export type PaginationOptions = {
  maxUnits: number;
};

export const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
  maxUnits: 100,
};

export function estimateBlockUnits(block: CardBlock): number {
  if (block.type === "pageBreak") return 0;
  if (block.type === "title") return 18;
  if (block.type === "heading") return 12;
  if (block.type === "highlight") return 16;
  if (block.type === "image") return 34;
  if (block.type === "listItem") {
    const lineCount = Math.ceil(block.text.length / 22);
    return Math.max(8, lineCount * 7);
  }
  const lineCount = Math.ceil(block.text.length / 24);
  return Math.max(10, lineCount * 7);
}

export function paginateBlocks(blocks: CardBlock[], options: PaginationOptions = DEFAULT_PAGINATION_OPTIONS): CardPage[] {
  const pages: CardPage[] = [];
  let current: CardBlock[] = [];
  let currentUnits = 0;
  let pageIndex = 1;
  const forcedBreakAfter = new Set<number>();

  function pushPage() {
    if (current.length === 0) return;
    pages.push({ id: `page-${pageIndex}`, blocks: current });
    pageIndex += 1;
    current = [];
    currentUnits = 0;
  }

  for (const block of blocks) {
    if (block.type === "pageBreak") {
      pushPage();
      forcedBreakAfter.add(pages.length - 1);
      continue;
    }

    const units = estimateBlockUnits(block);
    if (current.length > 0 && currentUnits + units > options.maxUnits) {
      pushPage();
    }

    current.push(block);
    currentUnits += units;
  }

  pushPage();

  if (pages.length >= 2 && !forcedBreakAfter.has(pages.length - 2)) {
    const last = pages[pages.length - 1];
    const lastUnits = last.blocks.reduce((sum, b) => sum + estimateBlockUnits(b), 0);
    if (lastUnits <= 25) {
      pages[pages.length - 2].blocks.push(...last.blocks);
      pages.pop();
    }
  }

  return pages.length ? pages : [{ id: "page-1", blocks: [] }];
}
