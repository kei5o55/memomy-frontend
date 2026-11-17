import {useState} from "react"

type Props = {
    open: boolean;
    onClose: () => void;
}

export default function ReferenceModal({
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

        </div>
    );
}