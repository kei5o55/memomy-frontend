"use client";

import { useEffect, useRef } from "react";
import type { ProjectReferenceImage } from "@/logic/types";

type Props = {
  images: ProjectReferenceImage[];
  // 保存中の画像の ID（薄く表示し、削除ボタンを出さない）
  pendingIds?: Set<string>;
  // 渡さなければ削除ボタンを出さない（Timerpage など閲覧専用で使う想定）
  onDelete?: (imageId: string) => void;
};

// 参照画像を並べるリスト（ReferenceBoard と Timerpage で表示）
export default function ReferenceList({ images, pendingIds, onDelete }: Props) {
  if (images.length === 0) {
    return <p className="text-sm text-zinc-500">参考画像はまだありません</p>;
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((img) => (
        <ReferenceItem
          key={img.id}
          image={img}
          pending={pendingIds?.has(img.id) ?? false}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}

function ReferenceItem({
  image,
  pending,
  onDelete,
}: {
  image: ProjectReferenceImage;
  pending: boolean;
  onDelete?: (imageId: string) => void;
}) {
  const imgRef = useRef<HTMLImageElement>(null);

  // Blob から object URL を作って img に設定し、アンマウント時（または blob 変更時）に解放する
  useEffect(() => {
    const url = URL.createObjectURL(image.blob);
    if (imgRef.current) imgRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [image.blob]);

  return (
    <li className="group relative aspect-square overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
      {/* blob URL のため next/image ではなく img を使う */}
      <img
        ref={imgRef}
        alt={image.name}
        className={`h-full w-full object-cover transition-opacity ${pending ? "opacity-50" : ""}`}
      />
      {pending && (
        <span className="absolute inset-x-0 bottom-0 bg-black/50 py-0.5 text-center text-xs text-white">
          保存中...
        </span>
      )}
      {onDelete && !pending && (
        <button
          type="button"
          onClick={() => onDelete(image.id)}
          className="absolute right-1 top-1 cursor-pointer rounded-full bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
          aria-label={`${image.name} を削除`}
        >
          削除
        </button>
      )}
    </li>
  );
}
