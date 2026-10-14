import type { MetadataRoute } from "next";

const SITE_URL = "https://memomy.net";

// 検索結果に出したい公開ページのみ載せる（アプリ画面は noindex）
// lastModified は毎ビルドで変わる new Date() だと信頼されないため、実際の更新時のみ付ける
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/guide`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/contact`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
