import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
        {/* ブランド名 / プロダクト名 */}
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            memomy
          </span>
          <span className="text-xs text-slate-500">v0.0.1</span>
          <span className="text-xs text-slate-500">リンクはまだ未実装</span>
        </div>

        {/* リンク群 */}
        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <Link
            href=""
            className="transition-colors hover:text-slate-900 dark:hover:text-white opacity-30"
          >
            About
          </Link>
          <Link
            href=""
            className="transition-colors hover:text-slate-900 dark:hover:text-white opacity-30"
          >
            利用規約
          </Link>
          <Link
            href="/privacy"
            className="transition-colors hover:text-slate-900 dark:hover:text-white opacity-30"
          >
            プライバシーポリシー
          </Link>
          <a
            href="https://github.com/kei5o55/memomy-frontend"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-slate-900 dark:hover:text-white"
          >
            GitHub
          </a>
        </nav>

        {/* コピーライト */}
        <p className="text-xs text-slate-500">
          &copy; {new Date().getFullYear()} kei5ot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}