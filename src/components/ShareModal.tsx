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
        <div role="dialog" aria-modal="true" 
      className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs grid place-items-center p-4 z-50 overflow-y-auto">
            <button onClick={onCancel} className=" cursor-pointer pd-4 border"> キャンセル</button>
        </div>
    );
}