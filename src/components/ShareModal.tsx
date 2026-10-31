'use client';
import { useMemo, useState } from "react";
import type { Commit, Project } from "@/logic/types";
import {
    buildDailyShareText,
    buildDailySummary,
    buildXIntentUrl,
    formatDurationJa,
    toDateKey,
} from "@/logic/shareMessage";

type Props = {
    open: boolean;
    onCancel: () => void;
    commits: Commit[]; // 集計対象のコミット（全プロジェクト分）
    projects: Project[]; // プロジェクト名の解決用
    date?: string; // 初期表示する日 "YYYY-MM-DD"（省略時は今日）
}

// 1 日の作業記録を X Web Intent で共有するモーダル（ひな型）
export default function ShareModal({ open, ...rest }: Props) {
    if (!open) return null;

    // 開くたびに入力状態（日付・本文の編集）を初期化するため、中身は開いている間だけマウントする
    return <ShareModalContent {...rest} />;
}

function ShareModalContent({
    onCancel,
    commits,
    projects,
    date: initialDate,
}: Omit<Props, "open">) {
    // 今日の日付は初回マウント時だけ取得する（レンダーのたびに Date.now() を呼ばない）
    const [date, setDate] = useState(() => initialDate ?? toDateKey(Date.now()));
    const summary = useMemo(() => buildDailySummary(commits, projects, date), [commits, projects, date]);
    // 本文は投稿前に手直しできるようにする（日付を変えたら自動生成し直す）
    const [text, setText] = useState(() => buildDailyShareText(summary));

    const handleDateChange = (nextDate: string) => {
        if (!nextDate) return;
        setDate(nextDate);
        setText(buildDailyShareText(buildDailySummary(commits, projects, nextDate)));
    };

    // X の投稿画面を新しいタブで開く（投稿するかどうかはユーザーが X 上で決める）
    const handleShare = () => {
        window.open(buildXIntentUrl({ text }), "_blank", "noopener,noreferrer");
    };

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs grid place-items-center p-4 z-50 overflow-y-auto"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
            <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl my-8 font-sans text-zinc-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                {/* ヘッダー */}
                <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                    <h2 className="text-lg font-bold text-zinc-900">作業記録をシェア</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* 対象日 */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700" htmlFor="share-date">
                        共有する日
                    </label>
                    <input
                        id="share-date"
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm"
                    />
                </div>

                {/* 集計結果 */}
                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <p className="text-xs text-zinc-500">合計作業時間</p>
                        <p className="text-lg font-bold">{formatDurationJa(summary.totalMs)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <p className="text-xs text-zinc-500">コミット数</p>
                        <p className="text-lg font-bold">{summary.commitCount} 回</p>
                    </div>
                </div>

                {/* 投稿文プレビュー（編集可） */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700" htmlFor="share-text">
                        投稿文
                    </label>
                    <textarea
                        id="share-text"
                        rows={6}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                    {/* TODO: X の文字数（日本語は 1 文字 2 カウント、URL は 23 カウント）で残り文字数を表示する */}
                    <p className="text-xs text-zinc-400">
                        投稿時に memomy の URL と #memomy が付きます
                    </p>
                </div>

                {/* フッター */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-xl cursor-pointer"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleShare}
                        disabled={!text.trim()}
                        className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
                    >
                        X で共有
                    </button>
                </div>
            </div>
        </div>
    );
}
