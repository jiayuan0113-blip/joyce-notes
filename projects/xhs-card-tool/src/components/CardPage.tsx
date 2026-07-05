import type { CardBlock, CardPage, ImageAsset, TextBlock, TextRun } from "../domain/types";
import { getTemplate } from "../domain/templates";

type CardPageViewProps = {
  page: CardPage;
  images: ImageAsset[];
  authorName: string;
  dateText: string;
  avatarDataUrl?: string;
  pageIndex?: number;
  pageCount?: number;
  templateId?: string;
};

function renderRuns(runs: TextRun[]) {
  return runs.map((run, index) => {
    const className = [
      run.bold ? "text-bold" : "",
      run.highlight ? "text-highlight" : "",
      run.underline ? "text-underline" : "",
    ].filter(Boolean).join(" ");
    return (
      <span className={className || undefined} key={`${run.text}-${index}`}>
        {run.text}
      </span>
    );
  });
}

function titleFontSize(text: string): number | undefined {
  const contentWidth = 908;
  const maxSize = 116;
  const minSize = 56;
  let emWidth = 0;
  for (const char of text) {
    emWidth += char.charCodeAt(0) > 127 ? 1 : 0.6;
  }
  const fitted = Math.floor(contentWidth / emWidth);
  if (fitted >= maxSize) return undefined;
  return Math.max(minSize, fitted);
}

function TextBlockView({ block }: { block: TextBlock }) {
  if (block.type === "title") {
    const size = titleFontSize(block.text);
    return <h2 className="card-title" style={size ? { fontSize: `${size}px` } : undefined}>{renderRuns(block.runs)}</h2>;
  }
  if (block.type === "heading") {
    return <h3 className="card-heading">{renderRuns(block.runs)}</h3>;
  }
  if (block.type === "subheading") {
    return <h4 className="card-subheading">{renderRuns(block.runs)}</h4>;
  }
  if (block.type === "highlight") {
    return <p className="card-paragraph">{renderRuns(block.runs)}</p>;
  }
  return <p className="card-paragraph">{renderRuns(block.runs)}</p>;
}

function isValidImageUrl(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  );
}

function getImageSource(block: Extract<CardBlock, { type: "image" }>, images: ImageAsset[]): string | null {
  const uploaded = images.find((item) => item.id === block.imageId);
  if (uploaded) {
    return uploaded.dataUrl;
  }

  if (isValidImageUrl(block.imageId)) {
    return block.imageId;
  }

  return null;
}

function ImageBlockView({ block, images }: { block: Extract<CardBlock, { type: "image" }>; images: ImageAsset[] }) {
  const imageSource = getImageSource(block, images);

  return (
    <figure className="card-image-block">
      {imageSource ? <img src={imageSource} alt={block.alt} /> : <div className="missing-image">图片未找到：{block.imageId}</div>}
      {block.alt ? <figcaption>{block.alt}</figcaption> : null}
    </figure>
  );
}

export function CardPageView({
  page,
  images,
  authorName,
  dateText,
  avatarDataUrl,
  pageIndex,
  pageCount,
  templateId,
}: CardPageViewProps) {
  const tid = templateId ?? "classic";
  const template = getTemplate(tid);
  return (
    <article className={`xhs-card-page xhs-card-page--${tid}`} data-page-id={page.id} style={template.vars as React.CSSProperties}>
      <header className="card-author">
        {avatarDataUrl ? (
          <img className="card-avatar" src={avatarDataUrl} alt={`${authorName}头像`} />
        ) : (
          <div className="card-avatar-fallback">J</div>
        )}
        <div>
          <div className="card-author-name">{authorName}</div>
          <div className="card-date">{dateText}</div>
        </div>
      </header>

      <div className="card-content">
        {page.blocks.map((block) => {
          if (block.type === "pageBreak") return null;
          if (block.type === "image") return <ImageBlockView block={block} images={images} key={block.id} />;
          return <TextBlockView block={block} key={block.id} />;
        })}
      </div>

      {pageIndex && pageCount ? (
        <footer className="card-page-count">
          {pageIndex}/{pageCount}
        </footer>
      ) : null}
    </article>
  );
}
