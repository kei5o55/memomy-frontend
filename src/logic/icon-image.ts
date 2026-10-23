// src/logic/icon-image.ts
// プロフィールアイコンのアップロード前チェックと縮小

// バックエンド（UserIcon モデル）と同じ制限
export const ICON_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
export const ICON_MAX_BYTES = 2 * 1024 * 1024;
// アイコンは小さく表示するだけなので、長辺をこのサイズまで縮小してから送る
export const ICON_MAX_PX = 512;

export const isAllowedIconType = (file: File): boolean => ICON_ALLOWED_TYPES.includes(file.type);

/**
 * 長辺が ICON_MAX_PX を超える画像を canvas で縮小する（スマホの写真でも 2MB 制限に収まるように）
 * - GIF はアニメーションが消えるため縮小しない
 * - 縮小できなかった場合（ブラウザ非対応など）は元のファイルを返す
 * - WebP で書き出す。WebP 非対応のブラウザでは PNG になる（どちらもバックエンドで許可している形式）
 */
export async function resizeIconImage(file: File, maxPx = ICON_MAX_PX): Promise<{ blob: Blob; filename: string }> {
  const original = { blob: file as Blob, filename: file.name };
  if (file.type === "image/gif") return original;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxPx / Math.max(bitmap.width, bitmap.height));
    if (scale === 1) {
      bitmap.close();
      return original;
    }

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return original;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    if (!blob) return original;

    const ext = blob.type === "image/webp" ? "webp" : "png";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "icon";
    return { blob, filename: `${baseName}.${ext}` };
  } catch (error) {
    console.error("アイコン画像の縮小に失敗しました:", error);
    return original;
  }
}
