"use client";

import { useState } from "react";
import type { Commit, Project, DaySchedule } from "../../logic/types";

type Props = {
  schedules: DaySchedule[];
  commits: Commit[];
  projects: Project[];
  onDeleteSchedule: (id: string) => void;
};

type HourlySlot = {
  hour: number;
  timeString: string;
  schedules: DaySchedule[];
  commits: Commit[];
};

function formatTime(h: number, m: number): string {
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// ミリ秒タイムスタンプから "HH:MM" 文字列を生成するヘルパー関数
function formatTimestamp(ms: number): string {
  const d = new Date(ms);
  return formatTime(d.getHours(), d.getMinutes());
}

// 1時間あたりの行の高さ(px)。予定バーの位置計算にも使う
const ROW_HEIGHT = 44;
// 行と予定バーで共通のカラム構成（時刻 | 予定 | 作業ログ）
const GRID_COLS = "grid grid-cols-[3rem_minmax(0,2fr)_minmax(0,3fr)] gap-3 px-2";

function startOfDayMinutes(s: DaySchedule): number {
  return s.startHour * 60 + s.startMinute;
}

function endOfDayMinutes(s: DaySchedule): number {
  const end = s.endHour * 60 + s.endMinute;
  // 終了が開始以前（不正データ）の場合は最低30分として扱う
  return end > startOfDayMinutes(s) ? end : startOfDayMinutes(s) + 30;
}

type ScheduleBlock = {
  schedule: DaySchedule;
  top: number;
  height: number;
  col: number;
  cols: number;
};

// 予定を時間軸上のバーに変換する。重なる予定は横に並べる
function layoutSchedules(schedules: DaySchedule[]): ScheduleBlock[] {
  const sorted = [...schedules].sort(
    (a, b) => startOfDayMinutes(a) - startOfDayMinutes(b) || endOfDayMinutes(b) - endOfDayMinutes(a)
  );

  const blocks: ScheduleBlock[] = [];
  let cluster: ScheduleBlock[] = [];
  let colEnds: number[] = []; // 各列の最後の予定の終了時刻
  let clusterEnd = -1;

  const flush = () => {
    cluster.forEach((b) => (b.cols = colEnds.length));
    blocks.push(...cluster);
    cluster = [];
    colEnds = [];
  };

  for (const s of sorted) {
    const start = startOfDayMinutes(s);
    const end = Math.min(endOfDayMinutes(s), 24 * 60);
    if (start >= clusterEnd) flush();

    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = end;
    clusterEnd = Math.max(clusterEnd, end);

    cluster.push({
      schedule: s,
      top: (start / 60) * ROW_HEIGHT,
      height: Math.max(((end - start) / 60) * ROW_HEIGHT, 18),
      col,
      cols: 1,
    });
  }
  flush();

  return blocks;
}

export default function DayScheduleTimeline({
  schedules,
  commits,
  projects,
  onDeleteSchedule
}: Props) {
  const [selectedSlot, setSelectedSlot] = useState<HourlySlot | null>(null);

  // 0時〜23時の24スロットを生成
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const scheduleBlocks = layoutSchedules(schedules);

  const slots: HourlySlot[] = hours.map((hour) => {
    // その時間帯（hour:00 〜 hour+1:00）と重なる予定
    const slotSchedules = schedules.filter(
      (s) => startOfDayMinutes(s) < (hour + 1) * 60 && endOfDayMinutes(s) > hour * 60
    );

    // その時間の作業ログ（startedAt 〜 endedAt の時間内にこの hour が含まれるか）
    const slotCommits = commits.filter((c) => {
      const startH = new Date(c.startedAt).getHours();
      const endH = new Date(c.endedAt).getHours();
      return startH <= hour && endH >= hour;
    });

    return {
      hour,
      timeString: `${hour.toString().padStart(2, "0")}:00`,
      schedules: slotSchedules,
      commits: slotCommits,
    };
  });

  const handleDeleteDaySchedule = async (id: string) => {
    // 親の削除関数を実行
    onDeleteSchedule?.(id);

    // モーダル側も同期
    if (selectedSlot) {
      setSelectedSlot({
        ...selectedSlot,
        schedules: selectedSlot.schedules.filter((s) => s.id !== id),
      });
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-gray-100 bg-gray-50/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
          タイムライン
        </h4>
        <span className="text-[10px] text-gray-400">枠クリックで詳細を表示</span>
      </div>

      {/* 24時間表示エリア */}
      <div className="max-h-[480px] overflow-y-auto pr-1">
        <div className="relative" style={{ height: ROW_HEIGHT * 24 }}>
          {/* 1時間ごとの行（背景グリッド + 作業ログ） */}
          {slots.map((slot) => {
            const visibleCommits = slot.commits.slice(0, 2);
            const hiddenCount = slot.commits.length - visibleCommits.length;

            return (
              <div
                key={slot.hour}
                onClick={() => setSelectedSlot(slot)}
                className={`group ${GRID_COLS} cursor-pointer items-center border-t border-gray-100 transition hover:bg-white`}
                style={{ height: ROW_HEIGHT }}
              >
                {/* 時間 */}
                <div className="self-start pt-0.5 font-mono text-xs font-medium text-gray-400 group-hover:text-indigo-600">
                  {slot.timeString}
                </div>

                {/* 予定バーは下のオーバーレイで描画するため空けておく */}
                <div />

                {/* 作業ログ（緑バッジ + 開始・終了時刻） */}
                <div className="flex min-w-0 items-center gap-1.5 overflow-hidden text-xs">
                  {slot.commits.length > 0 ? (
                    <>
                      {visibleCommits.map((c) => {
                        const proj = projects.find((p) => p.id === c.projectId);
                        const startStr = formatTimestamp(c.startedAt);
                        const endStr = formatTimestamp(c.endedAt);

                        return (
                          <span
                            key={c.id}
                            className="inline-flex min-w-0 shrink items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20"
                          >
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                            <span className="truncate">
                              {proj ? `[${proj.name}] ` : ""}
                              {c.note || "作業ログ"}
                            </span>
                            <span className="shrink-0 opacity-75 text-[10px]">
                              ({startStr}-{endStr})
                            </span>
                          </span>
                        );
                      })}
                      {hiddenCount > 0 && (
                        <span className="shrink-0 text-[10px] text-emerald-700">+{hiddenCount}件</span>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-300 opacity-0 group-hover:opacity-100 text-xs">—</span>
                  )}
                </div>
              </div>
            );
          })}

          {/* 予定バー（時間をまたいでも1本のラインとして表示） */}
          <div className={`pointer-events-none absolute inset-0 ${GRID_COLS}`}>
            <div />
            <div className="relative">
              {scheduleBlocks.map(({ schedule: s, top, height, col, cols }) => {
                const timeLabel = `${formatTime(s.startHour, s.startMinute)}-${formatTime(s.endHour, s.endMinute)}`;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSlot(slots[s.startHour])}
                    title={`${s.title} (${timeLabel})`}
                    className="pointer-events-auto absolute cursor-pointer overflow-hidden rounded-md px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs transition hover:brightness-110"
                    style={{
                      top: top + 1,
                      height: height - 2,
                      left: `calc(${(col / cols) * 100}% + 1px)`,
                      width: `calc(${100 / cols}% - 2px)`,
                      backgroundColor: s.color || "#6366f1",
                    }}
                  >
                    <div className="truncate">📅 {s.title}</div>
                    {height >= ROW_HEIGHT * 0.75 && (
                      <div className="truncate text-[10px] font-normal opacity-80">{timeLabel}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      {selectedSlot && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-xs"
          onMouseDown={(e) => {
            // 背景クリックで閉じる
            if (e.target === e.currentTarget) setSelectedSlot(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-bold text-gray-900">
                {selectedSlot.timeString} 時間帯の詳細
              </h3>
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* 予定 */}
              <div>
                <h5 className="text-xs font-bold uppercase text-indigo-600 mb-1.5">予定</h5>
                {selectedSlot.schedules.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">予定はありません</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSlot.schedules.map((s) => (
                      <div key={s.id} className="group relative rounded-lg border border-indigo-100 bg-indigo-50/50 p-2.5 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="font-bold text-indigo-950">{s.title}</div>
                            <div className="text-indigo-600/80 text-[11px] mt-0.5">
                              {formatTime(s.startHour, s.startMinute)} 〜 {formatTime(s.endHour, s.endMinute)}
                            </div>
                          </div>

                          {/* 削除ボタン */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDaySchedule(s.id)
                            }}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors"
                            title="予定を削除"
                          >
                            {/* Lucide や Heroicons 等のゴミ箱アイコン、または SVG */}
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 作業記録 */}
              <div>
                <h5 className="text-xs font-bold uppercase text-emerald-600 mb-1.5">作業記録</h5>
                {selectedSlot.commits.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">作業ログはありません</p>
                ) : (
                  <div className="space-y-1.5">
                    {selectedSlot.commits.map((c) => {
                      const proj = projects.find((p) => p.id === c.projectId);
                      const startStr = formatTimestamp(c.startedAt);
                      const endStr = formatTimestamp(c.endedAt);

                      return (
                        <div key={c.id} className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5 text-xs">
                          {proj && <div className="font-semibold text-emerald-900">[{proj.name}]</div>}
                          <div className="text-emerald-800">{c.note || "メモ無し"}</div>
                          <div className="text-emerald-600/80 text-[11px] mt-0.5 font-mono">
                            ⏱ {startStr} 〜 {endStr}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setSelectedSlot(null)}
                className="rounded-lg bg-gray-100 px-4 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}