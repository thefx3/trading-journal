const MAX_DIMENSION = 2560;
const WEBP_QUALITY = 0.95;
const FINAL_WEBP_QUALITY = 0.9;
const MINIMUM_SAVING_RATIO = 0.12;

export type OptimizedChart = { file: File; originalSize: number; optimized: boolean };

function webpName(name: string) { const dot = name.lastIndexOf("."); return `${dot > 0 ? name.slice(0, dot) : name}.webp`; }

function canvasToBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", WEBP_QUALITY));
}

export async function encodeFinalTradeChart(file: File): Promise<File> {
  if (file.type === "image/webp") return file;
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d", { alpha: false }); if (!context) throw new Error("Canvas is unavailable");
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(bitmap, 0, 0);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Could not encode chart")), "image/webp", FINAL_WEBP_QUALITY));
    return new File([blob], webpName(file.name), { type: "image/webp", lastModified: file.lastModified });
  } finally { bitmap.close(); }
}

export async function optimizeTradeChart(file: File): Promise<OptimizedChart> {
  if (typeof createImageBitmap !== "function") return { file, originalSize: file.size, optimized: false };
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale)); const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
    const context = canvas.getContext("2d", { alpha: true }); if (!context) return { file, originalSize: file.size, optimized: false };
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high"; context.drawImage(bitmap, 0, 0, width, height);
    const blob = await canvasToBlob(canvas);
    if (!blob || blob.size >= file.size * (1 - MINIMUM_SAVING_RATIO)) return { file, originalSize: file.size, optimized: false };
    return { file: new File([blob], webpName(file.name), { type: "image/webp", lastModified: file.lastModified }), originalSize: file.size, optimized: true };
  } finally { bitmap.close(); }
}

export function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
