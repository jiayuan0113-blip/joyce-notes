import { useEffect, useRef, useState } from "react";
import { CardPageView } from "./components/CardPage";
import { paginateBlocks } from "./domain/paginator";
import { parseMarkdownToBlocks } from "./domain/markdownParser";
import { processText } from "./domain/textProcessor";
import { loadProject, saveProject } from "./services/projectStorage";
import { exportCardNodes, triggerDownload } from "./services/exportService";
import type { CardPage, ImageAsset } from "./domain/types";

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function App() {
  const [isHydrated, setIsHydrated] = useState(false);
  const [authorName, setAuthorName] = useState("Joyce在坡");
  const [generatedDate, setGeneratedDate] = useState(formatDate(new Date()));
  const [rawText, setRawText] = useState("");
  const [processedMarkdown, setProcessedMarkdown] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [pages, setPages] = useState<CardPage[]>([]);
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>();
  const [showMarkdown, setShowMarkdown] = useState(false);
  const [exportMessage, setExportMessage] = useState("");
  const previewRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = loadProject();
    if (stored) {
      setAuthorName(stored.authorName);
      setRawText(stored.rawText);
      setProcessedMarkdown(stored.processedMarkdown);
      setGeneratedDate(stored.generatedDate);
      setImages(stored.images);
      setPages(stored.pages);
      setAvatarDataUrl(stored.avatarDataUrl);
    }
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    saveProject({
      authorName,
      generatedDate,
      avatarDataUrl,
      rawText,
      processedMarkdown,
      images,
      pages,
    });
  }, [authorName, avatarDataUrl, generatedDate, isHydrated, images, pages, rawText, processedMarkdown]);

  function handleProcess() {
    setGeneratedDate(formatDate(new Date()));
    const processed = processText(rawText);
    const markdown = processed.markdown.trim();

    if (!markdown) {
      setProcessedMarkdown("");
      setNotes(processed.notes);
      setPages([]);
      setShowMarkdown(false);
      return;
    }

    const blocks = parseMarkdownToBlocks(markdown, images);
    const nextPages = paginateBlocks(blocks);
    setProcessedMarkdown(markdown);
    setNotes(processed.notes);
    setPages(nextPages);
    setShowMarkdown(false);
  }

  function handleMarkdownChange(value: string) {
    setProcessedMarkdown(value);

    if (!value.trim()) {
      setPages([]);
      return;
    }

    const blocks = parseMarkdownToBlocks(value, images);
    setPages(paginateBlocks(blocks));
  }

  async function handleAvatarUpload(file: File | undefined) {
    if (!file) return;
    setAvatarDataUrl(await fileToDataUrl(file));
  }

  async function handleInlineImageUpload(file: File | undefined) {
    if (!file) return;
    const id = `img-${Date.now()}`;
    const dataUrl = await fileToDataUrl(file);
    const asset: ImageAsset = { id, name: file.name, dataUrl, caption: file.name };
    setImages((current) => [...current, asset]);
    setRawText((current) => `${current}${current.endsWith("\n") || !current ? "" : "\n\n"}![${file.name}](${id})`);
    setNotes((current) => [...current, `已添加图片 ${file.name}`]);
  }

  async function handleExport() {
    const nodes = Array.from(exportRef.current?.querySelectorAll<HTMLElement>(".xhs-card-page") ?? []);
    if (nodes.length === 0) return;

    try {
      const result = await exportCardNodes(nodes);
      if (result.zipBlob) {
        const zipUrl = URL.createObjectURL(result.zipBlob);
        triggerDownload("xhs_cards.zip", zipUrl);
        setTimeout(() => {
          URL.revokeObjectURL(zipUrl);
        }, 0);
        setExportMessage(`已生成 ${result.files.length} 张卡片和 zip 文件`);
        return;
      }

      for (const file of result.files) triggerDownload(file.name, file.dataUrl);
      setExportMessage(`已生成 ${result.files.length} 张卡片`);
    } catch {
      setExportMessage("导出失败，请重试");
    }
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <h1>图文卡片</h1>
        <button
          type="button"
          className="secondary-button"
          disabled={pages.length === 0}
          onClick={() => void handleExport()}
        >
          导出
        </button>
      </header>

      <section className="identity-panel" aria-label="身份信息">
        <label className="avatar-upload">
          {avatarDataUrl ? <img src={avatarDataUrl} alt={`${authorName}头像`} /> : <span>J</span>}
          <input
            aria-label="上传头像"
            type="file"
            accept="image/*"
            onChange={(event) => void handleAvatarUpload(event.target.files?.[0])}
          />
        </label>
        <div className="identity-fields">
          <label className="field-label" htmlFor="author-name">
            作者名
          </label>
          <input
            id="author-name"
            className="inline-input"
            value={authorName}
            onChange={(event) => setAuthorName(event.target.value)}
          />
          <p className="muted-text">{generatedDate} 自动生成</p>
        </div>
      </section>

      <section className="editor-section">
        <label className="field-label" htmlFor="raw-text">
          原始正文
        </label>
        <textarea
          id="raw-text"
          className="raw-editor"
          placeholder="把正文粘贴到这里"
          aria-label="原始正文"
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
        />
        <label className="upload-button">
          上传正文图片
          <input
            aria-label="上传正文图片"
            type="file"
            accept="image/*"
            onChange={(event) => void handleInlineImageUpload(event.target.files?.[0])}
          />
        </label>
        <button type="button" className="primary-button" onClick={handleProcess}>
          处理正文
        </button>
      </section>

      {notes.length > 0 ? (
        <section className="status-panel" aria-label="处理结果">
          {notes.map((note) => (
            <p key={note}>{note}</p>
          ))}
        </section>
      ) : null}
      {exportMessage ? <p className="export-message" role="status">
          {exportMessage}
        </p> : null}

      {processedMarkdown ? (
        <section className="markdown-panel">
          <button type="button" className="text-button" onClick={() => setShowMarkdown((value) => !value)}>
            {showMarkdown ? "收起 Markdown 微调" : "展开 Markdown 微调"}
          </button>
          {showMarkdown ? (
            <textarea
              className="raw-editor"
              aria-label="处理后 Markdown"
              value={processedMarkdown}
              onChange={(event) => handleMarkdownChange(event.target.value)}
            />
          ) : null}
        </section>
      ) : null}

      {pages.length > 0 ? (
        <section className="preview-section" aria-label="卡片预览">
          <div className="preview-header">
            <h2>预览</h2>
            <span>预计 {pages.length} 张</span>
          </div>
          <div className="preview-grid" ref={previewRef}>
            {pages.map((page, index) => (
              <CardPageView
                authorName={authorName}
                dateText={generatedDate}
                images={images}
                avatarDataUrl={avatarDataUrl}
                key={page.id}
                page={page}
                pageCount={pages.length}
                pageIndex={index + 1}
              />
            ))}
          </div>
        </section>
      ) : null}
      {pages.length > 0 ? (
        <section
          className="export-surface"
          ref={exportRef}
          aria-hidden="true"
          style={{
            position: "fixed",
            left: "0",
            top: "0",
            transform: "translate(-110vw, -110vh)",
            clipPath: "inset(0)",
            width: "1080px",
            pointerEvents: "none",
          }}
        >
          {pages.map((page, index) => (
              <CardPageView
                authorName={authorName}
                dateText={generatedDate}
                images={images}
                avatarDataUrl={avatarDataUrl}
                key={`export-${page.id}`}
              page={page}
              pageCount={pages.length}
              pageIndex={index + 1}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
