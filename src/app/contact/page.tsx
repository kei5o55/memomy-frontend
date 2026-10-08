import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="max-w-2xl mx-auto min-h-screen px-4 py-8 space-y-6 font-sans text-slate-800 antialiased">
      {/* ナビゲーション */}
      <div className="border-b border-slate-200 pb-4">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 py-2 px-3.5 rounded-xl shadow-sm transition-colors"
        >
          ← トップページへ戻る
        </Link>
      </div>

      {/* ヘッダー */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-sky-600 uppercase tracking-wider">
          Contact
        </span>

        <h1 className="text-3xl font-extrabold text-slate-900">
          お問い合わせ
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          不具合の報告や改善要望、その他お気づきの点があれば、
          以下の方法からお気軽にご連絡ください。
        </p>
      </div>

      {/* お問い合わせ方法 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          お問い合わせ方法
        </h2>

        <div className="space-y-3">
          {/* マシュマロ */}
          <a
            href="https://marshmallow-qa.com/fti1k8ni3gu5g8t"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <p className="text-sm font-bold text-slate-900">
              💬 マシュマロ
            </p>
            <p className="text-xs text-slate-500 mt-1">
              匿名でのご意見・改善要望などはこちら。
            </p>
          </a>

          {/* メール */}
          <a
            href="mailto:info@kei5ot.com"
            className="block p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <p className="text-sm font-bold text-slate-900">
              ✉️ メール(info@kei5ot.com)
            </p>
            <p className="text-xs text-slate-500 mt-1">
              不具合報告や個別のお問い合わせはこちら。
            </p>
          </a>

          {/* X */}
          <a
            href="https://x.com/kei5ot"
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <p className="text-sm font-bold text-slate-900">
              𝕏 X
            </p>
            <p className="text-xs text-slate-500 mt-1">
              気軽なご意見・ご感想などはこちら。
            </p>
          </a>
        </div>
      </div>

      {/* 補足 */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
        <p className="text-xs text-slate-500 leading-relaxed">
          ※ お問い合わせ内容によっては、すぐに対応できない場合があります。
          <br />
          ※ 不具合報告の際は、発生した操作や環境などを添えていただけると助かります。
        </p>
      </div>
    </main>
  );
}

