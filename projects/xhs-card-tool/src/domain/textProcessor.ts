import type { ProcessedText } from "./types";
import { parseMarkdownToBlocks } from "./markdownParser";
import { DEFAULT_PAGINATION_OPTIONS, estimateBlockUnits } from "./paginator";

const numberedHeadingPattern = /^((?:\d+|[一二三四五六七八九十]+)[、.．])\s*(.+)$/;
const inlineMarkdownPattern = /(\*\*[^*]+\*\*)|(==[^=]+==)/;
const boldPattern = /\*\*[^*]+\*\*/g;
const highlightPattern = /==[^=]+==/g;

type AutoEmphasisKind = "bold" | "highlight";

type AutoEmphasisCandidate = {
  kind: AutoEmphasisKind;
  markdown: string;
};

type PageEmphasisState = {
  units: number;
  boldCount: number;
  highlightCount: number;
};

function normalizeInlineBreaks(lines: string[]): string[] {
  const paragraphs: string[] = [];
  let current = "";
  const isAsciiAlnum = (char: string) => /[A-Za-z0-9]/.test(char);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (current) {
        paragraphs.push(current);
        current = "";
      }
      continue;
    }

    if (
      trimmed.startsWith("#") ||
      numberedHeadingPattern.test(trimmed) ||
      trimmed.startsWith("![")
    ) {
      if (current) {
        paragraphs.push(current);
        current = "";
      }
      paragraphs.push(trimmed);
      continue;
    }

    if (!current) {
      current = trimmed;
      continue;
    }

    const prev = current[current.length - 1];
    const next = trimmed[0];
    const separator = isAsciiAlnum(prev) && isAsciiAlnum(next) ? " " : "";
    current = `${current}${separator}${trimmed}`;
  }

  if (current) paragraphs.push(current);
  return paragraphs;
}

function normalizeSpacing(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasInlineMarkdown(text: string): boolean {
  return inlineMarkdownPattern.test(text);
}

function isStructuralMarkdown(text: string): boolean {
  return text.startsWith("#") || text.startsWith("![") || numberedHeadingPattern.test(text);
}

function isHighlightCandidate(text: string): boolean {
  return (
    text.length <= 64 &&
    (/^(而是|所以|真正|最重要|核心|关键|我现在的感受)/.test(text) ||
      /关键不是.+而是/.test(text))
  );
}

function createQuotedBoldCandidate(text: string): AutoEmphasisCandidate | null {
  const next = text.replace(/「([^」]{2,24})」/, (_match, phrase: string) => {
    return `「**${phrase}**」`;
  });

  return next === text ? null : { kind: "bold", markdown: next };
}

function createColonTailBoldCandidate(text: string): AutoEmphasisCandidate | null {
  const match = text.match(/^(.*?[：:])([^。！？!?]{4,36})([。！？!?])?$/);
  if (!match) return null;

  return {
    kind: "bold",
    markdown: `${match[1]}**${match[2].trim()}**${match[3] ?? ""}`,
  };
}

function createHighlightCandidate(text: string): AutoEmphasisCandidate | null {
  if (!isHighlightCandidate(text)) return null;
  return { kind: "highlight", markdown: `==${text}==` };
}

function estimateMarkdownUnits(markdown: string): number {
  const blocks = parseMarkdownToBlocks(markdown, []);
  return blocks.reduce((sum, block) => sum + estimateBlockUnits(block), 0);
}

function countMatches(text: string, pattern: RegExp): number {
  return text.match(pattern)?.length ?? 0;
}

function pageStateForChunk(state: PageEmphasisState, markdown: string): PageEmphasisState {
  const units = estimateMarkdownUnits(markdown);
  if (state.units > 0 && state.units + units > DEFAULT_PAGINATION_OPTIONS.maxUnits) {
    return { units: 0, boldCount: 0, highlightCount: 0 };
  }

  return state;
}

function addChunkToPageState(state: PageEmphasisState, markdown: string): void {
  const nextState = pageStateForChunk(state, markdown);
  state.units = nextState.units;
  state.boldCount = nextState.boldCount;
  state.highlightCount = nextState.highlightCount;

  state.units += estimateMarkdownUnits(markdown);
  state.boldCount += countMatches(markdown, boldPattern);
  state.highlightCount += countMatches(markdown, highlightPattern);
}

function canUseCandidate(state: PageEmphasisState, candidate: AutoEmphasisCandidate): boolean {
  const candidateState = pageStateForChunk(state, candidate.markdown);
  if (candidate.kind === "bold") {
    return candidateState.boldCount < 1;
  }

  return candidateState.highlightCount < 1;
}

function autoEmphasize(
  paragraph: string,
  state: PageEmphasisState,
): { text: string; boldCount: number; highlightCount: number } {
  if (isStructuralMarkdown(paragraph) || hasInlineMarkdown(paragraph)) {
    addChunkToPageState(state, paragraph);
    return { text: paragraph, boldCount: 0, highlightCount: 0 };
  }

  const candidates = [
    createQuotedBoldCandidate(paragraph),
    createColonTailBoldCandidate(paragraph),
    createHighlightCandidate(paragraph),
  ].filter((candidate): candidate is AutoEmphasisCandidate => Boolean(candidate));
  const selected = candidates.find((candidate) => canUseCandidate(state, candidate));
  const text = selected?.markdown ?? paragraph;

  addChunkToPageState(state, text);
  return {
    text,
    boldCount: selected?.kind === "bold" ? 1 : 0,
    highlightCount: selected?.kind === "highlight" ? 1 : 0,
  };
}

export function processText(raw: string): ProcessedText {
  const normalized = normalizeSpacing(raw);
  if (!normalized) return { markdown: "", notes: ["正文为空"] };

  const hasManualHeading = /^#{1,6}\s+/m.test(normalized);
  const paragraphs = normalizeInlineBreaks(normalized.split("\n"));
  const notes: string[] = [];
  let headingCount = 0;
  let boldCount = 0;
  let highlightCount = 0;
  const pageState: PageEmphasisState = { units: 0, boldCount: 0, highlightCount: 0 };

  if (/\n\s*\n\s*\n/.test(raw)) {
    notes.push("已清理多余空行");
  }

  const output = paragraphs.map((paragraph, index) => {
    const numbered = paragraph.match(numberedHeadingPattern);
    if (numbered) {
      headingCount += 1;
      const heading = `## ${numbered[1]}${numbered[2]}`;
      addChunkToPageState(pageState, heading);
      return heading;
    }

    if (
      !hasManualHeading &&
      index === 0 &&
      paragraph.length <= 32 &&
      !paragraph.startsWith("![") &&
      !/[。.!?！？]$/.test(paragraph)
    ) {
      const title = `# ${paragraph}`;
      addChunkToPageState(pageState, title);
      return title;
    }

    const emphasized = autoEmphasize(paragraph, pageState);
    boldCount += emphasized.boldCount;
    highlightCount += emphasized.highlightCount;
    return emphasized.text;
  });

  if (headingCount > 0) notes.push(`已识别 ${headingCount} 个编号小标题`);
  if (boldCount > 0) notes.push(`已自动加粗 ${boldCount} 处重点`);
  if (highlightCount > 0) notes.push(`已自动高亮 ${highlightCount} 处重点`);

  return {
    markdown: output.join("\n\n"),
    notes,
  };
}
