"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
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

  // ファイル選択・クリップボードの両方から呼ばれる
  const handleFiles = async (files: FileList | File[] | null) => {
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

  // Ctrl+V / ⌘V で貼り付けられた画像を保存する
  const onPaste = useEffectEvent((e: ClipboardEvent) => {
    if (busy || images.length >= MAX_REFERENCE_IMAGES_PER_PROJECT) return;
    const files = Array.from(e.clipboardData?.files ?? []).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (files.length === 0) return;
    e.preventDefault();
    void handleFiles(files);
  });

  // モーダルを開いている間だけ paste を拾う
  useEffect(() => {
    if (!open) return;
    const listener = (e: ClipboardEvent) => onPaste(e);
    document.addEventListener("paste", listener);
    return () => document.removeEventListener("paste", listener);
  }, [open]);

  // ボタンからクリップボードを読む（Clipboard API は HTTPS / localhost でのみ使え、初回は許可を求められる）
  const handlePasteButton = async () => {
    setError(null);
    if (!navigator.clipboard?.read) {
      setError("このブラウザではボタンからの読み取りに対応していません。Ctrl+V で貼り付けてください");
      return;
    }
    try {
      const items = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of items) {
        const type = item.types.find((t) => t.startsWith("image/"));
        if (!type) continue;
        const blob = await item.getType(type);
        const ext = type.split("/")[1] ?? "png";
        files.push(new File([blob], `clipboard-${Date.now()}.${ext}`, { type }));
      }
      if (files.length === 0) {
        setError("クリップボードに画像がありません");
        return;
      }
      await handleFiles(files);
    } catch (e) {
      console.error(e);
      setError("クリップボードを読み取れませんでした");
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
        <button
          type="button"
          disabled={busy || isFull}
          onClick={() => void handlePasteButton()}
          className="ml-2 cursor-pointer rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          クリップボードから貼り付け
        </button>
        <p className="mt-1 text-xs text-zinc-500">Ctrl+V（⌘V）でも貼り付けられます</p>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4">
          <ReferenceList images={images} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
