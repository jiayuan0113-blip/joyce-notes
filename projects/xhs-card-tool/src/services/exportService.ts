import { toPng } from "html-to-image";
import JSZip from "jszip";

export type ExportedFile = {
  name: string;
  dataUrl: string;
};

export type ExportResult = {
  files: ExportedFile[];
  zipBlob?: Blob;
};

function dataUrlToBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] ?? "";
}

export async function exportCardNodes(nodes: HTMLElement[]): Promise<ExportResult> {
  const files: ExportedFile[] = [];

  for (const [index, node] of nodes.entries()) {
    const dataUrl = await toPng(node, {
      width: 1080,
      height: 1440,
      pixelRatio: 1,
      cacheBust: true,
    });
    files.push({ name: `card_${String(index + 1).padStart(2, "0")}.png`, dataUrl });
  }

  if (files.length <= 1) {
    return { files };
  }

  const zip = new JSZip();
  for (const file of files) {
    zip.file(file.name, dataUrlToBase64(file.dataUrl), { base64: true });
  }

  return {
    files,
    zipBlob: await zip.generateAsync({ type: "blob" }),
  };
}

export function triggerDownload(name: string, url: string): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}
