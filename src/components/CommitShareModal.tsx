import type { Commit,WorkSession } from "@/logic/types";

type Props = {
    open: boolean;
    onCancel: () => void;
    commit?: Commit;//worksessionから共有分作成の方がローカル完結でいいかも
}


export default function CommitShareModal({//手かこれモーダルじゃなくて直接APIよぶのでよくね？
    open,
    onCancel,
    commit
}:Props ) {
    if(!open) return null;
    
    return (
        <div 
            role="dialog"
            className="fixed inset-0 bg-zinc-900/50 backdrop-blur-xs grid place-items-center p-4 z-50 overflow-y-auto"
            onMouseDown = {(e) => {
                if (e.target === e.currentTarget) onCancel();
            }}
        >
        <div className="w-full max-w-lg bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl my-8 font-sans text-zinc-800 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            testestest


            <button 
                className="px-5 py-2.5 text-sm font-medium text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl shadow-sm disabled:opacity-50 cursor-pointer"
            >
                Xに共有
            </button>
        </div>
        </div>
    );
}