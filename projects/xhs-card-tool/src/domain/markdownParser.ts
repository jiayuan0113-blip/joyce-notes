import type { CardBlock, ImageAsset, TextRun } from "./types";

let idCounter = 0;

function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

function parseRuns(text: string): TextRun[] {
  const runs: TextRun[] = [];
  const pattern = /(\*\*([^*]+)\*\*)|(==([^=]+)==)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index) });
    }
    if (match[2]) runs.push({ text: match[2], bold: true });
    if (match[4]) runs.push({ text: match[4], highlight: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex) });
  }

  return runs.length ? runs : [{ text }];
}

function plainTextFromRuns(runs: TextRun[]): string {
  return runs.map((run) => run.text).join("");
}

export function parseMarkdownToBlocks(markdown: string, _images: ImageAsset[]): CardBlock[] {
  idCounter = 0;
  const blocks: CardBlock[] = [];
  const chunks = markdown
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    if (chunk === "---") {
      blocks.push({ id: nextId("break"), type: "pageBreak" });
      continue;
    }

    const image = chunk.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (image) {
      blocks.push({
        id: nextId("image"),
        type: "image",
        alt: image[1],
        imageId: image[2],
      });
      continue;
    }

    if (chunk.startsWith("# ")) {
      const text = chunk.slice(2).trim();
      const runs = parseRuns(text);
      blocks.push({ id: nextId("title"), type: "title", text: plainTextFromRuns(runs), runs });
      continue;
    }

    if (chunk.startsWith("## ")) {
      const text = chunk.slice(3).trim();
      const runs = parseRuns(text);
      blocks.push({ id: nextId("heading"), type: "heading", text: plainTextFromRuns(runs), runs });
      continue;
    }

    const runs = parseRuns(chunk.replace(/\n/g, " "));
    const hasOnlyHighlight = runs.every((run) => run.highlight) && plainTextFromRuns(runs).length <= 42;
    blocks.push({
      id: nextId(hasOnlyHighlight ? "highlight" : "paragraph"),
      type: hasOnlyHighlight ? "highlight" : "paragraph",
      text: plainTextFromRuns(runs),
      runs,
    });
  }

  return blocks;
}
