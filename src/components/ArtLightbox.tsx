"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function ArtLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // SSR（Next.js）での createPortal エラーを防止するためのマウント判定
  useEffect(() => {
    setMounted(true);
  }, []);

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
      {open && mounted && createPortal(
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-6 cursor-zoom-out animate-in fade-in duration-150"
        >
          <div className="relative w-full h-full max-w-5xl max-h-[90vh] flex items-center justify-center pointer-events-none">
            <img
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