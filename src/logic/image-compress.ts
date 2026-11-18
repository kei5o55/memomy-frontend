// src/logic/image-compress.ts
// 保存前の画像圧縮（コミット画像・プロジェクト参考画像で共通）

// 横幅の上限（これより大きい画像は縮小する）
export const IMAGE_MAX_WIDTH = 1280;
// JPEG の画質
export const IMAGE_JPEG_QUALITY = 0.8;

/**
 * 横幅が IMAGE_MAX_WIDTH を超える画像を縮小し、JPEG に変換して返す
 * - 縮小が不要なサイズでも JPEG に再エンコードする（容量を抑えるため）
 */
export async function compressImage(file: File): Promise<File> {
  const img = new Image();
  const url = URL.createObjectURL(file);

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const scale = Math.min(1, IMAGE_MAX_WIDTH / img.width);

    const canvas = document.createElement("canvas");
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("画像の変換に失敗しました"))),
        "image/jpeg",
        IMAGE_JPEG_QUALITY,
      ),
    );

    return new File([blob], file.name, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
