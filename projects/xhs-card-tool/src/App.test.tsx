import { act } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { exportCardNodes, triggerDownload } from "./services/exportService";
import { App } from "./App";

vi.mock("./services/exportService", () => ({
  exportCardNodes: vi.fn(),
  triggerDownload: vi.fn(),
}));

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(exportCardNodes).mockReset();
    vi.mocked(triggerDownload).mockReset();
  });

  it("processes pasted text and renders preview cards", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("原始正文"));
    await user.type(
      screen.getByLabelText("原始正文"),
      "让 Codex 起飞的 10 个技巧\n\n最近我重度使用 Codex。\n\n1、给 Codex 建一套共享记忆\n核心规则放 AGENTS.md。",
    );
    await user.click(screen.getByRole("button", { name: "处理正文" }));

    expect(screen.getByText("已识别 1 个编号小标题")).toBeInTheDocument();
    expect(screen.getByText("预计 1 张")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "让 Codex 起飞的 10 个技巧" })).toBeInTheDocument();
  });

  it("preserves hydrated draft and autosaves after user edits", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "保存的作者",
        generatedDate: "2026-06-20",
        rawText: "保存的正文",
        processedMarkdown: "# 保存的标题",
        images: [],
        pages: [],
      }),
    );

    render(<App />);

    const rawTextInput = await screen.findByLabelText("原始正文");
    expect((rawTextInput as HTMLTextAreaElement).value).toBe("保存的正文");
    expect(screen.getByText("2026-06-20 自动生成")).toBeInTheDocument();

    const hydratedProject = JSON.parse(localStorage.getItem("xhs-card-tool.project") ?? "{}");
    expect(hydratedProject).toMatchObject({
      authorName: "保存的作者",
      rawText: "保存的正文",
      processedMarkdown: "# 保存的标题",
    });

    await user.clear(rawTextInput);
    await user.type(rawTextInput, "追加正文");

    await waitFor(() => {
      const nextProject = JSON.parse(localStorage.getItem("xhs-card-tool.project") ?? "{}");
      expect(nextProject.rawText).toBe("追加正文");
    });

    const saved = JSON.parse(localStorage.getItem("xhs-card-tool.project") ?? "{}");
    expect(saved.rawText).toBe("追加正文");
    expect(saved.generatedDate).toBe("2026-06-20");
  });

  it("updates generatedDate on processing to match the current date", async () => {
    const user = userEvent.setup();
    const getCurrentDateText = () =>
      new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());

    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "保存的作者",
        generatedDate: "2026-06-20",
        rawText: "旧正文",
        processedMarkdown: "",
        images: [],
        pages: [],
      }),
    );

    render(<App />);
    await user.type(screen.getByLabelText("原始正文"), "新增正文");
    await user.click(screen.getByRole("button", { name: "处理正文" }));

    expect(await screen.findByText(`${getCurrentDateText()} 自动生成`)).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem("xhs-card-tool.project") ?? "{}");
    expect(saved.generatedDate).toBe(getCurrentDateText());
  });

  it("keeps processed markdown collapsed by default", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("原始正文"), "标题\n\n正文");
    await user.click(screen.getByRole("button", { name: "处理正文" }));

    expect(screen.queryByLabelText("处理后 Markdown")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "展开 Markdown 微调" }));
    expect(screen.getByLabelText("处理后 Markdown")).toBeInTheDocument();
  });

  it("skips preview when processing yields blank markdown", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.clear(screen.getByLabelText("原始正文"));
    await user.type(screen.getByLabelText("原始正文"), "   \n \t\n ");
    await user.click(screen.getByRole("button", { name: "处理正文" }));

    expect(screen.getByText("正文为空")).toBeInTheDocument();
    expect(screen.queryByLabelText("处理后 Markdown")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("卡片预览")).not.toBeInTheDocument();
    expect(screen.queryByText(/预计\s+\d+\s+张/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出" })).toBeDisabled();
  });

  it("clears preview when markdown editor becomes blank", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText("原始正文"), "标题\n\n正文内容");
    await user.click(screen.getByRole("button", { name: "处理正文" }));

    await user.click(screen.getByRole("button", { name: "展开 Markdown 微调" }));
    expect(screen.getByLabelText("卡片预览")).toBeInTheDocument();

    const markdownEditor = screen.getByLabelText("处理后 Markdown");
    await user.clear(markdownEditor);
    await user.type(markdownEditor, "   ");

    expect(screen.queryByText("预览")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("卡片预览")).not.toBeInTheDocument();
    expect(screen.queryByText(/预计\s+\d+\s+张/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "导出" })).toBeDisabled();
  });

  it("uploads an inline image and inserts markdown syntax", async () => {
    const user = userEvent.setup();
    render(<App />);

    const file = new File(["fake"], "peter-yang.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText("上传正文图片");
    await user.upload(input, file);

    expect(await screen.findByText("已添加图片 peter-yang.jpg")).toBeInTheDocument();
    const rawTextInput = screen.getByLabelText("原始正文") as HTMLTextAreaElement;
    const rawText = rawTextInput.value;
    expect(rawText).toContain("![peter-yang.jpg](img-");
  });

  it("revokes zip object URL asynchronously after triggering zip download", async () => {
    vi.useFakeTimers();

    const createObjectURL = vi.fn().mockReturnValue("blob:zip-url");
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    const originalRevokeObjectURL = (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    const setTimeoutSpy = vi.spyOn(window, "setTimeout");

    (URL as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = createObjectURL;
    (URL as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-20",
        rawText: "标题\n\n正文",
        processedMarkdown: "# 标题\n\n正文",
        images: [],
        pages: [{ id: "page-1", blocks: [{ id: "title-1", type: "title", text: "标题", runs: [{ text: "标题" }] }] }],
      }),
    );

    vi.mocked(exportCardNodes).mockResolvedValue({
      files: [
        { name: "card_01.png", dataUrl: "data:image/png;base64,card-01" },
        { name: "card_02.png", dataUrl: "data:image/png;base64,card-02" },
      ],
      zipBlob: new Blob(["zip"]),
    });

    render(<App />);
    const exportButton = screen.getByRole("button", { name: "导出" });
    await act(async () => {
      fireEvent.click(exportButton);
      await Promise.resolve();
    });

    expect(vi.mocked(exportCardNodes)).toHaveBeenCalledTimes(1);
    const today = new Date().toISOString().slice(0, 10);
    expect(vi.mocked(triggerDownload)).toHaveBeenCalledWith(`xhs_cards_${today}.zip`, "blob:zip-url");
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 0);
    vi.runAllTimers();

    expect(revokeObjectURL).toHaveBeenCalledWith("blob:zip-url");
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);

    if (originalCreateObjectURL) {
      (URL as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = originalCreateObjectURL;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // biome-ignore lint/performance/noDelete: cleanup for environment compatibility
      delete (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      (URL as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = originalRevokeObjectURL;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // biome-ignore lint/performance/noDelete: cleanup for environment compatibility
      delete (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    }
    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it("exports cards from the unscaled export surface", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn().mockReturnValue("blob:zip-url");
    const revokeObjectURL = vi.fn();
    const originalCreateObjectURL = (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    const originalRevokeObjectURL = (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;

    (URL as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = createObjectURL;
    (URL as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = revokeObjectURL;

    let capturedNodes: HTMLElement[] = [];
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-20",
        rawText: "标题\n\n正文",
        processedMarkdown: "# 标题\n\n正文",
        images: [],
        pages: [
          { id: "page-1", blocks: [{ id: "title-1", type: "title", text: "标题", runs: [{ text: "标题" }] }] },
          { id: "page-2", blocks: [{ id: "title-2", type: "title", text: "副标题", runs: [{ text: "副标题" }] }] },
        ],
      }),
    );

    vi.mocked(exportCardNodes).mockImplementation(async (nodes) => {
      capturedNodes = nodes;
      return {
        files: nodes.map((_, index) => ({
          name: `card_${String(index + 1).padStart(2, "0")}.png`,
          dataUrl: `data:image/png;base64,card-${index + 1}`,
        })),
        zipBlob: new Blob(["zip"]),
      };
    });

    render(<App />);
    const exportButton = screen.getByRole("button", { name: "导出" });

    await user.click(exportButton);

    expect(capturedNodes).toHaveLength(2);
    expect(capturedNodes.every((node) => node.classList.contains("xhs-card-page"))).toBe(true);
    expect(capturedNodes.every((node) => node.closest(".export-surface") !== null)).toBe(true);
    expect(capturedNodes.every((node) => node.closest(".preview-grid") === null)).toBe(true);
    const today = new Date().toISOString().slice(0, 10);
    expect(vi.mocked(triggerDownload)).toHaveBeenCalledWith(`xhs_cards_${today}.zip`, "blob:zip-url");

    if (originalCreateObjectURL) {
      (URL as { createObjectURL: typeof URL.createObjectURL }).createObjectURL = originalCreateObjectURL;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // biome-ignore lint/performance/noDelete: cleanup for environment compatibility
      delete (URL as { createObjectURL?: typeof URL.createObjectURL }).createObjectURL;
    }
    if (originalRevokeObjectURL) {
      (URL as { revokeObjectURL: typeof URL.revokeObjectURL }).revokeObjectURL = originalRevokeObjectURL;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      // biome-ignore lint/performance/noDelete: cleanup for environment compatibility
      delete (URL as { revokeObjectURL?: typeof URL.revokeObjectURL }).revokeObjectURL;
    }
  });

  it("shows export completion message even when no notes were recorded", async () => {
    const user = userEvent.setup();
    vi.mocked(exportCardNodes).mockResolvedValue({
      files: [{ name: "card_01.png", dataUrl: "data:image/png;base64,card-01" }],
    });

    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-20",
        rawText: "标题\n\n正文",
        processedMarkdown: "# 标题\n\n正文",
        images: [],
        pages: [{ id: "page-1", blocks: [{ id: "title-1", type: "title", text: "标题", runs: [{ text: "标题" }] }] }],
      }),
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "导出" }));

    expect(screen.getByRole("status")).toHaveTextContent("已生成 1 张卡片");
  });

  it("shows failure message when export throws", async () => {
    const user = userEvent.setup();
    vi.mocked(exportCardNodes).mockRejectedValue(new Error("export failed"));

    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-20",
        rawText: "标题\n\n正文",
        processedMarkdown: "# 标题\n\n正文",
        images: [],
        pages: [{ id: "page-1", blocks: [{ id: "title-1", type: "title", text: "标题", runs: [{ text: "标题" }] }] }],
      }),
    );

    render(<App />);
    await user.click(screen.getByRole("button", { name: "导出" }));

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("导出失败，请重试");
    });
    expect(vi.mocked(triggerDownload)).not.toHaveBeenCalled();
  });

  it("applies fixed clipped layout to the export surface in preview mode", () => {
    localStorage.setItem(
      "xhs-card-tool.project",
      JSON.stringify({
        authorName: "Joyce在坡",
        generatedDate: "2026-06-20",
        rawText: "标题\n\n正文",
        processedMarkdown: "# 标题\n\n正文",
        images: [],
        pages: [{ id: "page-1", blocks: [{ id: "title-1", type: "title", text: "标题", runs: [{ text: "标题" }] }] }],
      }),
    );

    const { container } = render(<App />);
    const exportSurface = container.querySelector(".export-surface") as HTMLDivElement | null;

    expect(exportSurface).not.toBeNull();
    const styles = window.getComputedStyle(exportSurface as Element);
    expect(styles.position).toBe("fixed");
    expect(styles.left).toBe("0px");
    expect(styles.left).not.toBe("-20000px");
    expect(styles.transform).toContain("translate");
  });
});
