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
  // 楽観的に表示しているが、まだ IDB に保存できていない画像の ID
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
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
  // 楽観的 UI 更新：元ファイルのまま先に一覧へ出し、圧縮・IDB 保存は後から行う
  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || files.length === 0) return;
    setError(null);

    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    // 同じファイルを続けて選んでも onChange が発火するようにリセット
    if (inputRef.current) inputRef.current.value = "";
    if (imageFiles.length === 0) return;

    // 上限を超える分は最初から表示しない（IDB 側でも再チェックされる）
    const remaining = MAX_REFERENCE_IMAGES_PER_PROJECT - images.length;
    const targets = imageFiles.slice(0, Math.max(0, remaining));
    if (targets.length < imageFiles.length) {
      setError(new ReferenceImageLimitError().message);
    }
    if (targets.length === 0) return;

    const now = Date.now();
    const optimistic: ProjectReferenceImage[] = targets.map((file, i) => ({
      id: crypto.randomUUID(),
      projectId,
      name: file.name,
      type: file.type,
      size: file.size,
      blob: file,
      createdAt: now + i,
    }));
    setImages((prev) => [...prev, ...optimistic]);
    setPendingIds((prev) => new Set([...prev, ...optimistic.map((img) => img.id)]));
    setBusy(true);

    for (const [i, temp] of optimistic.entries()) {
      try {
        // 仮データと同じ ID で保存し、圧縮後のデータに差し替える
        const saved = await addReferenceImageIdb(projectId, targets[i], temp.id);
        setImages((prev) => prev.map((img) => (img.id === temp.id ? saved : img)));
      } catch (e) {
        // 失敗した分だけ一覧から取り除く
        setImages((prev) => prev.filter((img) => img.id !== temp.id));
        if (e instanceof ReferenceImageLimitError) {
          setError(e.message);
        } else {
          console.error(e);
          setError("画像の保存に失敗しました");
        }
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(temp.id);
          return next;
        });
      }
    }
    setBusy(false);
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

  // 楽観的 UI 更新：先に一覧から消し、IDB の削除に失敗したら元の位置に戻す
  const handleDelete = async (imageId: string) => {
    setError(null);
    const index = images.findIndex((img) => img.id === imageId);
    if (index === -1) return;
    const removed = images[index];
    setImages((prev) => prev.filter((img) => img.id !== imageId));
    try {
      await deleteReferenceImageIdb(imageId);
    } catch (e) {
      console.error(e);
      setImages((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removed);
        return next;
      });
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
          <ReferenceList images={images} pendingIds={pendingIds} onDelete={handleDelete} />
        </div>
      </div>
    </div>
  );
}
