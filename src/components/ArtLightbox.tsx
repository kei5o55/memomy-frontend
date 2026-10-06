"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

// SSR時とCSR時で正しいマウント状態を取得するためのフック定義
const emptySubscribe = () => () => {};
const useIsMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,  // クライアント側（ブラウザ）では true
    () => false  // サーバー側（SSR）では false
  );

export default function ArtLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const isMounted = useIsMounted();

  return (
    <>
      {/* 1. サムネイル表示部分（親要素枠にピッタリ収まる） */}
      <div
        onClick={() => setOpen(true)}
        className="w-full h-full cursor-zoom-in group relative overflow-hidden"
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 opacity-90 group-hover:opacity-100"
        />
      </div>

      {/* 2. モーダル表示部分（createPortal で document.body 直下に展開） */}
      {open && isMounted && createPortal(
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center pointer-events-none">
            <Image
              src={src}
              alt={alt}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-sm pointer-events-auto"
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}