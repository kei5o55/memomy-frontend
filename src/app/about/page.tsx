import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto min-h-screen px-4 py-8 space-y-6 font-sans text-slate-800 antialiased">
      {/* ナビゲーション */}
      <div className="border-b border-slate-200 pb-4">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 py-2 px-3.5 rounded-xl shadow-xs transition-colors"
        >
          ← トップページへ戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
          About memomy
        </span>

        <h1 className="text-3xl font-extrabold text-slate-900">
          memomy について
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          memomy（メモミー）は、クリエイターが創作に向き合った「過程（プロセス）」や
          積み重ねた時間を資産として記録するための、パーソナル・クリエイティブアプリケーションです。
        </p>
      </div>

      {/* 3つの設計思想 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          3つの設計思想
        </h2>

        <div className="space-y-3">
          {/* 1 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-sky-600 font-mono text-xs">01.</span>
              過程（Process）の可視化
            </p>
            <p className="text-xs text-slate-500 leading-relaxed pl-6">
              完成した作品だけでなく、そこに到達するまでに費やした試行錯誤や集中の記録をログとして残し、確かな成長の糧にします。
            </p>
          </div>

          {/* 2 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-sky-600 font-mono text-xs">02.</span>
              創作の継続・振り返り
            </p>
            <p className="text-xs text-slate-500 leading-relaxed pl-6">
              長期的に積み重ねた過程を振り返り今後の創作に活かしたり、作業の開始と終了のメリハリをつけたルーティンとして継続を支援
            </p>
          </div>

          {/* 3 */}
          <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="text-sky-600 font-mono text-xs">03.</span>
              遊び心とゲーミフィケーション
            </p>
            <p className="text-xs text-slate-500 leading-relaxed pl-6">
              作業時間の到達や特定の条件達成で解放されるアチーブメントバッジ。人に見せるためではなく、自らの足跡を楽しむための仕掛けです。
            </p>
          </div>
        </div>
      </div>

      {/* 開発思想メッセージ */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
           開発者メッセージ
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          モノづくりに終わりはなく、試行錯誤と探求のプロセスそのものがクリエイターの生き方だと思っている。
          やりたいこと、描きたい絵、アイデアをプロジェクトとして蓄積して、衝動のままにタイマーを回しメモリーを蓄積する。
        </p>
        <p className="text-xs text-slate-600 leading-relaxed">
          ふとした時に作業ログを見て達成感を感じたり、他の人の作業ログを見て刺激を受けたり、そういう小さいSNSみたいなものにできても嬉しいかなぁ。
        </p>
      </div>

      {/* 補足・フッター */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
        <p className="text-xs text-slate-500">
          ご意見・不具合の報告などは
          <Link href="/contact" className="text-sky-600 font-semibold underline underline-offset-2 ml-1">
            お問い合わせページ
          </Link>
          よりご連絡ください。
        </p>
      </div>
    </main>
  );
}