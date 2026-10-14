import type { Metadata } from "next";

// 各ページの openGraph の共通部分。
// Next.js は openGraph をページ側で指定するとオブジェクトごと上書きするため、ページ側でこれを展開して使う
export const baseOpenGraph = {
  type: "website",
  siteName: "memomy",
  locale: "ja_JP",
  // ページ側で openGraph を指定すると app/opengraph-image.tsx が引き継がれないため明示する
  images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "memomy - 創作活動を記録するワークログ" }],
} satisfies Metadata["openGraph"];
