import "./globals.css";
import Footer from "../components/minor/Footer";
import type { Metadata } from "next";
import { baseOpenGraph } from "./shared-metadata";

export const metadata: Metadata = {
  metadataBase: new URL("https://memomy.net"),
  title: {
    default: "memomy｜創作活動を記録するワークログ",
    template: "%s | memomy",
  },
  description:
    "イラスト制作や創作活動の時間や記録を残せるワークログアプリ。",
  // og:url / canonical は各ページで指定する（ここで指定すると全ページに同じ URL が付くため）
  openGraph: {
    ...baseOpenGraph,
    title: "memomy｜創作活動を記録するワークログ",
    description:
      "日々の創作活動を記録し、積み重ねを可視化する。",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "memomy",
  url: "https://memomy.net/",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />
        {/* メインコンテンツエリア（余白を埋めてフッターを下に押し出す）。<main> は各ページ側で持つ */}
        <div className="flex-1">
          {children}
        </div>

        {/* フッター */}
        <Footer />
      </body>
    </html>
  );
}