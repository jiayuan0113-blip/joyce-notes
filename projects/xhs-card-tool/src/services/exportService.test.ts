import { describe, expect, it, vi } from "vitest";
import { exportCardNodes } from "./exportService";

vi.mock("html-to-image", () => ({
  toPng: vi.fn(async (_node: HTMLElement, options: { width: number; height: number }) => {
    return `data:image/png;base64,${options.width}x${options.height}`;
  }),
}));

describe("exportCardNodes", () => {
  it("exports each card node at 1080x1440", async () => {
    const node = document.createElement("article");
    const result = await exportCardNodes([node]);

    expect(result.files).toEqual([{ name: "card_01.png", dataUrl: "data:image/png;base64,1080x1440" }]);
  });
});
