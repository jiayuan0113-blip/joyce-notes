import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";
import { CardPageView } from "./CardPage";
import type { CardPage, ImageAsset } from "../domain/types";

const pageWithLocalImage: CardPage = {
  id: "page-1",
  blocks: [
    { id: "title", type: "title", text: "让 Codex 起飞", runs: [{ text: "让 Codex 起飞" }] },
    {
      id: "p1",
      type: "paragraph",
      text: "正文包含加粗和高亮。",
      runs: [
        { text: "正文包含" },
        { text: "加粗", bold: true },
        { text: "和" },
        { text: "高亮", highlight: true },
        { text: "。" },
      ],
    },
    { id: "img", type: "image", imageId: "img-1", alt: "访谈截图" },
  ],
};

const pageWithRemoteImage: CardPage = {
  id: "page-2",
  blocks: [{ id: "img-url", type: "image", imageId: "https://example.com/x.png", alt: "网络图片" }],
};

const pageWithMissingImage: CardPage = {
  id: "page-3",
  blocks: [{ id: "img-missing", type: "image", imageId: "missing-image", alt: "缺失图片" }],
};

const images: ImageAsset[] = [{ id: "img-1", name: "img.jpg", dataUrl: "data:image/jpeg;base64,abc" }];

describe("CardPageView", () => {
  it("renders identity, text hierarchy, local image assets, and no fake app chrome", () => {
    render(<CardPageView page={pageWithLocalImage} images={images} authorName="Joyce在坡" dateText="2026-06-23" />);

    expect(screen.getByText("Joyce在坡")).toBeInTheDocument();
    expect(screen.getByText("2026-06-23")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "让 Codex 起飞" })).toBeInTheDocument();
    expect(screen.getByText("加粗")).toHaveClass("text-bold");
    expect(screen.getByText("高亮")).toHaveClass("text-highlight");
    expect(screen.getByAltText("访谈截图")).toBeInTheDocument();
    expect(screen.getByText("访谈截图")).toBeInTheDocument();
    expect(screen.queryByText("点赞")).not.toBeInTheDocument();
    expect(screen.queryByText("评论")).not.toBeInTheDocument();
  });

  it("renders remote image URLs directly", () => {
    render(<CardPageView page={pageWithRemoteImage} images={[] as ImageAsset[]} authorName="Joyce在坡" dateText="2026-06-23" />);

    expect(screen.getByRole("img", { name: "网络图片" })).toHaveAttribute("src", "https://example.com/x.png");
  });

  it("keeps unknown local ids as missing image", () => {
    render(<CardPageView page={pageWithMissingImage} images={images} authorName="Joyce在坡" dateText="2026-06-23" />);

    expect(screen.getByText("图片未找到：missing-image")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
