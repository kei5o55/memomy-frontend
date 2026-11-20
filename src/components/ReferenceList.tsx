"use client";

import { useEffect, useRef } from "react";
import type { ProjectReferenceImage } from "@/logic/types";

type Props = {
  images: ProjectReferenceImage[];
  // 渡さなければ削除ボタンを出さない（Timerpage など閲覧専用で使う想定）
  onDelete?: (imageId: string) => void;
};

// 参照画像を並べるリスト（ReferenceBoard と Timerpage で表示）
export default function ReferenceList({ images, onDelete }: Props) {
  if (images.length === 0) {
    return <p className="text-sm text-zinc-500">参考画像はまだありません</p>;
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {images.map((img) => (
        <ReferenceItem key={img.id} image={img} onDelete={onDelete} />
      ))}
    </ul>
  );
}

function ReferenceItem({
  image,
  onDelete,
}: {
  image: ProjectReferenceImage;
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
      <img ref={imgRef} alt={image.name} className="h-full w-full object-cover" />
      {onDelete && (
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
