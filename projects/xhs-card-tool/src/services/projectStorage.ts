import type { CardProject } from "../domain/types";

const STORAGE_KEY = "xhs-card-tool.project";

function isTextRun(value: unknown): value is { text: string; bold?: boolean; highlight?: boolean } {
  if (!isObject(value)) return false;
  if (typeof value.text !== "string") return false;

  if (value.bold !== undefined && typeof value.bold !== "boolean") return false;
  if (value.highlight !== undefined && typeof value.highlight !== "boolean") return false;

  return true;
}

function isImageAsset(value: unknown): value is { id: string; name: string; dataUrl: string; caption?: string } {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string") return false;
  if (typeof value.name !== "string") return false;
  if (typeof value.dataUrl !== "string") return false;

  if (value.caption !== undefined && typeof value.caption !== "string") return false;

  return true;
}

function isCardBlock(value: unknown): value is { type: string } {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string") return false;

  const type = value.type;
  if (type !== "title" && type !== "heading" && type !== "paragraph" && type !== "quote" && type !== "highlight") {
    if (type === "image") {
      return typeof value.imageId === "string" && typeof value.alt === "string";
    }

    if (type === "pageBreak") {
      return true;
    }

    return false;
  }

  if (typeof value.text !== "string") return false;
  if (!Array.isArray(value.runs) || !value.runs.every(isTextRun)) return false;
  return true;
}

function isCardPage(value: unknown): value is { id: string; blocks: unknown[] } {
  if (!isObject(value)) return false;
  if (typeof value.id !== "string") return false;

  const blocks = value.blocks;
  return Array.isArray(blocks) && blocks.every(isCardBlock);
}

function hasValidNestedMembers(data: Record<string, unknown>): boolean {
  if (!Array.isArray(data.images) || !data.images.every(isImageAsset)) return false;
  if (!Array.isArray(data.pages) || !data.pages.every(isCardPage)) return false;
  return true;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isProjectPayload(data: unknown): data is CardProject {
  if (!isObject(data)) return false;
  const candidate = data as Record<string, unknown>;
  const hasRequiredStrings = [
    "authorName",
    "generatedDate",
    "rawText",
    "processedMarkdown",
  ].every((key) => typeof candidate[key] === "string");
  const avatarIsStringIfPresent =
    candidate.avatarDataUrl === undefined || typeof candidate.avatarDataUrl === "string";
  return hasRequiredStrings && avatarIsStringIfPresent && hasValidNestedMembers(candidate);
}

export function saveProject(project: CardProject): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
}

export function loadProject(): CardProject | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CardProject;
    return isProjectPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
