'use client';
import useState from "react"
import type { Commit, Project } from "@/logic/types";

type Props ={
    open: boolean;
    onCancel:()=> void;
    project?: Project;//街頭プロジェクトをもらう
    totalMs?: number;
    commit?: Commit;//ツイートに使う文章のやつ
}

export default function  ShareModal({
    open,
    onCancel,
}: Props){

    if(!open) return null;

    return (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs grid place-items-center p-4 z-50 overflow-y-auto">
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl my-8 font-sans text-zinc-800 animate-in fade-in zoom-in-95 duration-150">
                <div>ここにいろいろ描いていく</div>

                <button onClick={onCancel} className=" cursor-pointer pd-4 border"> キャンセル</button>
            </div>
        </div>
    );
}