import "./globals.css";
import Footer from "../components/Footer";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="flex min-h-screen flex-col bg-white text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-50">
        {/* メインコンテンツエリア（余白を埋めてフッターを下に押し出す） */}
        <main className="flex-1">
          {children}
        </main>

        {/* フッター */}
        <Footer />
      </body>
    </html>
  );
}