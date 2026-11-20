"use client";

import { useEffect, useRef, useState } from "react";
import {
  addReferenceImageIdb,
  deleteReferenceImageIdb,
  loadReferenceImagesIdb,
  MAX_REFERENCE_IMAGES_PER_PROJECT,
  ReferenceImageLimitError,
} from "@/logic/storage-idb";
import type { ProjectReferenceImage } from "@/logic/types";
import ReferenceList from "./ReferenceList";

// ローカル永続化で完結：addReferenceImageIdb は projectId と画像ファイルを渡すと圧縮して保存してくれる

type Props = {
  projectId: string;
  open: boolean;
  onClose: () => void;
};

// 一旦テスト用でモーダル実装しているが、リストとする。コンポーネントとして制作することで projectDetail と Timerpage で活用
export default function ReferenceBoard({ projectId, open, onClose }: Props) {
  const [images, setImages] = useState<ProjectReferenceImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 開いたときに IDB から読み込む
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    loadReferenceImagesIdb(projectId)
      .then((items) => {
        if (!cancelled) setImages(items);
        console.log("hozon")
      })
      .catch((e) => {
        console.error(e);
        if (!cancelled) setError("参考画像の読み込みに失敗しました");
      });
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  const handleFiles = async (files: FileList | null) => {
    console.log("選択したファイル:");
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const added = await addReferenceImageIdb(projectId, file);
        setImages((prev) => [...prev, added]);
      }
    } catch (e) {
      if (e instanceof ReferenceImageLimitError) {
        setError(e.message);
      } else {
        console.error(e);
        setError("画像の保存に失敗しました");
      }
    } finally {
      setBusy(false);
      // 同じファイルを続けて選んでも onChange が発火するようにリセット
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: string) => {
    setError(null);
    try {
      await deleteReferenceImageIdb(imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (e) {
      console.error(e);
      setError("画像の削除に失敗しました");
    }
  };

  if (!open) return null;

  const isFull = images.length >= MAX_REFERENCE_IMAGES_PER_PROJECT;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white rounded-2xl p-6 border border-zinc-200 shadow-xl my-8 font-sans text-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            参考画像
            <span className="ml-2 text-sm font-normal text-zinc-500">
              {images.length} / {MAX_REFERENCE_IMAGES_PER_PROJECT}
            </span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-zinc-500 hover:text-zinc-800"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
        <button
          type="button"
          disabled={busy || isFull}
          onClick={() => inputRef.current?.click()}
          className="cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "保存中..." : "画像を選択"}
        </button>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4">
          <ReferenceList images={images} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
