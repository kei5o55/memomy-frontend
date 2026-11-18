import {useState} from "react"
import { loadReferenceImageIdb,addReferenceImageIdb,clearReferenceImageIdb} from "@/logic/strage-idb"
//ローカル永続化で完結__addReferenceはprojectIdと画像ファイルを渡したらリサイズして保存してくれるよぅ

type Props = {
    open: boolean;
    onClose: () => void;
}

// 一旦テスト用でモーダル実装しているが、リストとする。コンポーネントとして制作することでprojectDetailとTimerpageで活用
export default function ReferenceList({
    open,
    onClose
}:Props){
    if(!open) return ;


    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm rounded-2xl grid place-items-center p-4 overflow-y-auto"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-2xl bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl my-8 font-sans text-zinc-800 animate-in fade-in zoom-in-95 duration-150">
                一旦テスト用でモーダル実装しているが、リストとする。コンポーネントとして制作することでprojectDetailとTimerpageで活用

                <button className="cursor-pointer border">画像を選択</button>
            </div>
        </div>
    );
}