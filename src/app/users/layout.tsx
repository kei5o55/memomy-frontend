import type { Metadata } from "next";

// アプリ画面（ユーザーごとのデータを表示するだけのページ）は検索結果に出さない
export const metadata: Metadata = {
  title: "マイページ",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
