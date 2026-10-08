// src/components/BadgeSettingsModal.tsx
import type { Badge } from "../logic/types";

type Props = {
  open: boolean;
  onClose: () => void;
  allBadges?: Badge[]; // システム全体のバッジ一覧
  selectedBadges: Badge[]; // 現在選択されているバッジ
  onToggleBadge: (badge: Badge) => void; // バッジ選択/解除のトグル関数
};

export default function BadgeSettingsModal({
  open,
  onClose,
  allBadges = [],
  selectedBadges,
  onToggleBadge,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-60 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 space-y-4 text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              表示バッジの選択
            </h3>
            <p className="text-xs text-slate-400">
              最大3つまで設定できます ({selectedBadges.length}/3)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* バッジ一覧 */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {allBadges.length > 0 ? (
            allBadges.map((badge) => {
              const isSelected = selectedBadges.some(
                (b) => b.id === badge.id
              );
              const isDisabled = !isSelected && selectedBadges.length >= 3;

              return (
                <div
                  key={badge.id}
                  onClick={() => !isDisabled && onToggleBadge(badge)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isSelected
                      ? "bg-sky-50 border-sky-300"
                      : isDisabled
                      ? "opacity-50 bg-slate-50 border-slate-200 cursor-not-allowed"
                      : "bg-white border-slate-200 hover:border-slate-300 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl select-none">{badge.icon}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {badge.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {badge.description}
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isDisabled}
                    readOnly
                    className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                </div>
              );
            })
          ) : (
            <p className="text-xs text-slate-400 text-center py-4">
              選択可能なバッジがありません
            </p>
          )}
        </div>

        {/* フッター */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            決定
          </button>
        </div>
      </div>
    </div>
  );
}