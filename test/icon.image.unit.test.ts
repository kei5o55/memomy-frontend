import { afterEach, describe, expect, test, vi } from "vitest";
import { isAllowedIconType, resizeIconImage } from "@/logic/icon-image";

const fileOf = (type: string, name = "icon") => new File(["data"], name, { type });

// canvas と createImageBitmap は jsdom に無いため、縮小の流れはスタブで確認する
function stubImage(width: number, height: number, outputType: string | null = "image/webp") {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue({ width, height, close }));
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ drawImage: vi.fn() }),
    toBlob: (cb: (b: Blob | null) => void) => cb(outputType ? new Blob(["small"], { type: outputType }) : null),
  };
  vi.spyOn(document, "createElement").mockReturnValue(canvas as unknown as HTMLCanvasElement);
  return { canvas, close };
}

describe("icon-image", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("isAllowedIconType", () => {
    test.each(["image/png", "image/jpeg", "image/webp", "image/gif"])("%s は許可する", (type) => {
      expect(isAllowedIconType(fileOf(type))).toBe(true);
    });

    test.each(["image/svg+xml", "image/heic", "application/pdf", ""])("%s は許可しない", (type) => {
      expect(isAllowedIconType(fileOf(type))).toBe(false);
    });
  });

  describe("resizeIconImage", () => {
    test("長辺が上限を超える画像は、比率を保って縮小し WebP にする", async () => {
      const { canvas, close } = stubImage(2000, 1000);

      const { blob, filename } = await resizeIconImage(fileOf("image/jpeg", "photo.jpg"), 512);

      expect([canvas.width, canvas.height]).toEqual([512, 256]);
      expect(blob.type).toBe("image/webp");
      expect(filename).toBe("photo.webp");
      expect(close).toHaveBeenCalled();
    });

    test("WebP で書き出せないブラウザでは PNG の拡張子にする", async () => {
      stubImage(2000, 2000, "image/png");

      const { filename } = await resizeIconImage(fileOf("image/jpeg", "photo.jpg"), 512);

      expect(filename).toBe("photo.png");
    });

    test("上限以下の画像はそのまま返す", async () => {
      stubImage(300, 200);
      const file = fileOf("image/png", "small.png");

      const { blob, filename } = await resizeIconImage(file, 512);

      expect(blob).toBe(file);
      expect(filename).toBe("small.png");
    });

    test("GIF はアニメーションが消えるため縮小しない", async () => {
      const createImageBitmapMock = vi.fn();
      vi.stubGlobal("createImageBitmap", createImageBitmapMock);
      const file = fileOf("image/gif", "anim.gif");

      const { blob } = await resizeIconImage(file, 512);

      expect(blob).toBe(file);
      expect(createImageBitmapMock).not.toHaveBeenCalled();
    });

    test("画像を読み込めない場合は元のファイルを返す", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("createImageBitmap", vi.fn().mockRejectedValue(new Error("decode error")));
      const file = fileOf("image/png", "broken.png");

      const { blob } = await resizeIconImage(file, 512);

      expect(blob).toBe(file);
    });

    test("canvas から書き出せなかった場合は元のファイルを返す", async () => {
      stubImage(2000, 2000, null);
      const file = fileOf("image/png", "big.png");

      const { blob } = await resizeIconImage(file, 512);

      expect(blob).toBe(file);
    });
  });
});
