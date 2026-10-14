import Link from "next/link";
import type { Metadata } from "next";
import { baseOpenGraph } from "../shared-metadata";

const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

const title = "使い方ガイド";
const description =
  "memomy の使い方。プロジェクトの作成、ポモドーロ付き作業タイマー、進捗画像とメモの記録、カレンダー、作業時間の振り返りまでを紹介します。";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guide" },
  openGraph: {
    ...baseOpenGraph,
    url: "/guide",
    title: `${title} | memomy`,
    description,
  },
};

type Step = {
  title: string;
  body: string;
  points: string[];
};

const steps: Step[] = [
  {
    title: "プロジェクトを作る",
    body: "描きたい作品やイベントの新刊など、取り組む単位ごとに「プロジェクト」を作ります。",
    points: [
      "納期・目標作業時間・メモを設定できます",
      "ポモドーロの作業時間と休憩時間をプロジェクトごとに決められます",
      "完了したプロジェクトは「完了にする」で一覧から分けて管理できます",
    ],
  },
  {
    title: "タイマーで作業時間を計る",
    body: "プロジェクトの「作業をはじめる」からタイマー画面に移り、Start で計測を開始します。",
    points: [
      "Pause / Resume で休憩をはさみながら計測できます",
      "ポモドーロを使うと、作業と休憩が自動で切り替わり、切り替わりを効果音で知らせます",
      "作業中のメモを残しておけます。ページを再読み込みしても計測は途中から再開できます",
    ],
  },
  {
    title: "作業を「コミット」して記録する",
    body: "Stop を押すと、今回の作業を 1 件の記録（コミット）として保存する画面が開きます。",
    points: [
      "今回・今日の累計・プロジェクト累計の作業時間を確認できます",
      "メモと進捗画像を 1 枚添えて、制作の過程を残せます。過去のメモも見返せます",
      "「保存して続ける」でタイマーを止めずに区切りだけ記録することもできます",
      "タイマーを使わなかった・使い忘れた作業は「ダイレクトコミット」で後から記録できます",
    ],
  },
  {
    title: "カレンダーで予定とメモを管理する",
    body: "トップページのカレンダーで、日ごとの作業予定やメモを管理できます。",
    points: [
      "予定には開始・終了時間、関連するプロジェクトを設定できます",
      "日付をクリックすると、その日の予定・メモ・作業記録を確認できます",
    ],
  },
  {
    title: "積み重ねを振り返る",
    body: "マイページでは、これまでの作業の積み重ねをまとめて振り返れます。",
    points: [
      "総作業時間・記録数・稼働プロジェクト数を確認できます",
      "日ごとの作業量をヒートマップで表示します",
      "完了したプロジェクトの進捗画像をギャラリーとして一覧できます",
      "プロフィールに自己紹介・作業用 BGM・SNS リンク・バッジを設定できます",
    ],
  },
];

export default function GuidePage() {
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
          Guide
        </span>

        <h1 className="text-3xl font-extrabold text-slate-900">
          memomy の使い方
        </h1>

        <p className="text-sm text-slate-500 leading-relaxed">
          memomy は、イラストなどの創作にかけた時間と過程を記録するワークログアプリです。
          ここでは、プロジェクトを作ってから作業を記録し、振り返るまでの流れを紹介します。
        </p>
      </div>

      {/* 手順 */}
      {steps.map((step, index) => (
        <section
          key={step.title}
          className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-3"
        >
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="text-sky-600 font-mono text-xs">{String(index + 1).padStart(2, "0")}.</span>
            {step.title}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
          <ul className="space-y-1.5 pl-1">
            {step.points.map((point) => (
              <li key={point} className="text-xs text-slate-500 leading-relaxed flex gap-2">
                <span className="text-sky-500">・</span>
                {point}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* データの保存先 */}
      <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-2">
        <h2 className="text-base font-bold text-slate-900">データの保存について</h2>
        {isApiMode ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            記録したデータはアカウントに紐づけてサーバーに保存されます。ログインすれば別の端末からも同じデータを利用できます。
          </p>
        ) : (
          <p className="text-sm text-slate-600 leading-relaxed">
            記録したデータは、お使いのブラウザ内（IndexedDB）にのみ保存され、サーバーには送信されません。
            アカウント登録なしですぐに使えますが、ブラウザのデータを削除すると記録も消え、別の端末やブラウザとは共有されません。
          </p>
        )}
      </section>

      {/* CTA */}
      <div className="text-center space-y-3 pt-2">
        <Link
          href="/"
          className="inline-block bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition-colors"
        >
          つかってみる
        </Link>
        <p className="text-xs text-slate-500">
          memomy の考え方については
          <Link href="/about" className="text-sky-600 font-semibold underline underline-offset-2 ml-1">
            memomy について
          </Link>
          をご覧ください。
        </p>
      </div>
    </main>
  );
}
