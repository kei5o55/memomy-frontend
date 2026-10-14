import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  // Vercel のプレビュー環境（*.vercel.app）は本番の重複コンテンツになるためクロールさせない
  // （VERCEL_ENV が未設定のローカルや Vercel 以外のホスティングでは本番扱い）
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://memomy.net/sitemap.xml",
  };
}
