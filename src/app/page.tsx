// app/page.tsx
import type { Metadata } from "next";
import ProjectsDashboard from "../components/ProjectsDashboard";
import { baseOpenGraph } from "./shared-metadata";

const description =
  "イラスト制作や創作活動の作業時間・進捗画像・メモを記録し、積み重ねを可視化するワークログアプリ。ポモドーロタイマー付き。";

export const metadata: Metadata = {
  description,
  alternates: { canonical: "/" },
  openGraph: {
    ...baseOpenGraph,
    url: "/",
    title: "memomy｜創作活動を記録するワークログ",
    description,
  },
};

// 構造化データ：Web アプリとしての情報（無料・ブラウザで動作）
const webApplicationJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "memomy",
  url: "https://memomy.net/",
  description,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web",
  inLanguage: "ja",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "JPY",
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webApplicationJsonLd) }}
      />
      <ProjectsDashboard />
    </>
  );
}
