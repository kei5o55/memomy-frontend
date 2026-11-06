'use client';
import { useState } from "react";
import {
    buildCommitShareText,
    buildXIntentUrl,
    formatDurationJa,
    type CommitShareInput,
} from "@/logic/shareMessage";

type Props = {
    open: boolean;
    onCancel: () => void;
    commit: CommitShareInput; // コミットモーダルに今入力されている内容
}

// 保存前のコミット内容を X Web Intent で共有するモーダル（ひな型）
export default function CommitShareModal({ open, ...rest }: Props) {
    if (!open) return null;

    // 開くたびに、その時点のコミット内容から本文を作り直すため、中身は開いている間だけマウントする
    return <CommitShareModalContent {...rest} />;
}

function CommitShareModalContent({ onCancel, commit }: Omit<Props, "open">) {
    // 本文は投稿前に手直しできるようにする
    const [text, setText] = useState(() => buildCommitShareText(commit));

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
                    <h2 className="text-lg font-bold text-zinc-900">コミットをシェア</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 cursor-pointer"
                    >
                        ✕
                    </button>
                </div>

                {/* 共有する内容 */}
                <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <p className="text-xs text-zinc-500">今回の作業時間</p>
                        <p className="text-lg font-bold">{formatDurationJa(commit.durationMs)}</p>
                    </div>
                    <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                        <p className="text-xs text-zinc-500">今日の合計</p>
                        <p className="text-lg font-bold">{formatDurationJa(commit.todayTotalMs)}</p>
                    </div>
                </div>

                {/* 投稿文プレビュー（編集可） */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-zinc-700" htmlFor="commit-share-text">
                        投稿文
                    </label>
                    <textarea
                        id="commit-share-text"
                        rows={6}
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-sm resize-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
                    />
                    {/* TODO: X の文字数（日本語は 1 文字 2 カウント、URL は 23 カウント）で残り文字数を表示する */}
                    <p className="text-xs text-zinc-400">
                        投稿時に memomy の URL が付きます。進捗画像は添付されません
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
