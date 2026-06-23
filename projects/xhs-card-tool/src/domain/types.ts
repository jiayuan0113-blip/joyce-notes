export type ImageAsset = {
  id: string;
  name: string;
  dataUrl: string;
  caption?: string;
};

export type TextRun = {
  text: string;
  bold?: boolean;
  highlight?: boolean;
};

export type TextBlock = {
  id: string;
  type: "title" | "heading" | "paragraph" | "quote" | "highlight";
  text: string;
  runs: TextRun[];
};

export type ImageBlock = {
  id: string;
  type: "image";
  imageId: string;
  alt: string;
};

export type PageBreakBlock = {
  id: string;
  type: "pageBreak";
};

export type CardBlock = TextBlock | ImageBlock | PageBreakBlock;

export type CardPage = {
  id: string;
  blocks: CardBlock[];
};

export type ProcessedText = {
  markdown: string;
  notes: string[];
};

export type CardProject = {
  authorName: string;
  avatarDataUrl?: string;
  generatedDate: string;
  rawText: string;
  processedMarkdown: string;
  images: ImageAsset[];
  pages: CardPage[];
};
