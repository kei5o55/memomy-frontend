// src/components/BadgeBoard.tsx
import type { Badge } from "../logic/types";

type Props = {
  badges?: Badge[];
  className?: string; // 呼び出し側で hidden lg:flex などを追加できるようにする
};

export default function BadgeBoard({ badges = [], className = "" }: Props) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {badges.length > 0 ? (
        badges.slice(0, 3).map((badge) => (
          <div
            key={badge.id}
            className="relative group flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg shadow-2xs hover:border-sky-300 hover:shadow-xs transition-all cursor-default"
          >
            <span className="text-base select-none">{badge.icon}</span>
            {/*バッジ名はいったん非表示（UIの崩れとかの関係で）<span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">
              {badge.name}
            </span>*/}

            {/* ホバー時のツールチップ */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 w-max max-w-[180px] p-2 bg-slate-900 text-white text-[10px] rounded-lg shadow-lg pointer-events-none transition-opacity">
              <p className="font-semibold text-sky-300">{badge.name}</p>
              <p className="text-slate-300 leading-tight mt-0.5">
                {badge.description}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium px-2 py-1 bg-white border border-slate-200 rounded-lg">
          <span className="text-sm">🏆</span>
          <span>バッジ未設定</span>
        </div>
      )}
    </div>
  );
}