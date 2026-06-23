import { beforeEach, describe, expect, it } from "vitest";
import { loadProject, saveProject } from "./projectStorage";
import type { CardProject } from "../domain/types";

const project: CardProject = {
  authorName: "Joyce在坡",
  generatedDate: "2026-06-23",
  rawText: "原文",
  processedMarkdown: "# 标题",
  images: [],
  pages: [],
};

describe("projectStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saves and loads the current project", () => {
    saveProject(project);
    expect(loadProject()).toEqual(project);
  });

  it("returns null for invalid stored data", () => {
    localStorage.setItem("xhs-card-tool.project", "{bad json");
    expect(loadProject()).toBeNull();
  });

  it("returns null when required string fields are missing", () => {
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        generatedDate: "2026-06-23",
        rawText: "正文",
        processedMarkdown: "# 标题",
        images: [],
        pages: [],
      }),
    );
    expect(loadProject()).toBeNull();
  });

  it("returns null when required array fields are missing", () => {
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-23",
        rawText: "正文",
        processedMarkdown: "# 标题",
        images: "not-array",
        pages: [],
      }),
    );
    expect(loadProject()).toBeNull();
  });

  it("returns null when image items are invalid", () => {
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-23",
        rawText: "正文",
        processedMarkdown: "# 标题",
        images: [null],
        pages: [],
      }),
    );
    expect(loadProject()).toBeNull();
  });

  it("returns null when page items are invalid", () => {
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-23",
        rawText: "正文",
        processedMarkdown: "# 标题",
        images: [],
        pages: [{ id: "x" }],
      }),
    );
    expect(loadProject()).toBeNull();
  });
});
