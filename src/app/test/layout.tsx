import type { Metadata } from "next";
import { notFound } from "next/navigation";

// 開発用ページ。本番では 404 にし、検索結果にも出さない
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
