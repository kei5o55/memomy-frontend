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

// 1時間あたりの行の高さ(px)。予定・作業ログのバーの位置計算にも使う
const ROW_HEIGHT = 44;
// バーの最小の高さ(px)。短すぎて文字が読めなくなるのを防ぐ
const MIN_BLOCK_HEIGHT = 18;
const DAY_MINUTES = 24 * 60;
// 行とバーのオーバーレイで共通のカラム構成（時刻 | 予定 | 作業ログ）
const GRID_COLS = "grid grid-cols-[3rem_minmax(0,2fr)_minmax(0,3fr)] gap-3 px-2";

function startOfDayMinutes(s: DaySchedule): number {
  return s.startHour * 60 + s.startMinute;
}

function endOfDayMinutes(s: DaySchedule): number {
  const end = s.endHour * 60 + s.endMinute;
  // 終了が開始以前（不正データ）の場合は最低30分として扱う
  return end > startOfDayMinutes(s) ? end : startOfDayMinutes(s) + 30;
}

function commitStartMinutes(c: Commit): number {
  const d = new Date(c.startedAt);
  return d.getHours() * 60 + d.getMinutes();
}

function commitEndMinutes(c: Commit): number {
  const start = new Date(c.startedAt);
  const end = new Date(c.endedAt);
  // 日付をまたいだ作業ログはその日の 24:00 で打ち切る
  if (end.toDateString() !== start.toDateString()) return DAY_MINUTES;
  return Math.max(end.getHours() * 60 + end.getMinutes(), commitStartMinutes(c) + 1);
}

type Block<T> = {
  item: T;
  top: number;
  height: number;
  col: number;
  cols: number;
};

// 開始・終了（分）を持つ要素を時間軸上のバーに変換する。重なる要素は横に並べる
function layoutBlocks<T>(
  items: T[],
  getStart: (item: T) => number,
  getEnd: (item: T) => number
): Block<T>[] {
  // 最小の高さで描画したときの見た目上の終了時刻で重なりを判定する
  const minMinutes = (MIN_BLOCK_HEIGHT / ROW_HEIGHT) * 60;
  const ranges = items
    .map((item) => {
      const start = getStart(item);
      const end = Math.min(getEnd(item), DAY_MINUTES);
      return { item, start, end, visualEnd: Math.max(end, start + minMinutes) };
    })
    .sort((a, b) => a.start - b.start || b.end - a.end);

  const blocks: Block<T>[] = [];
  let cluster: Block<T>[] = [];
  let colEnds: number[] = []; // 各列の最後の要素の終了時刻
  let clusterEnd = -1;

  const flush = () => {
    cluster.forEach((b) => (b.cols = colEnds.length));
    blocks.push(...cluster);
    cluster = [];
    colEnds = [];
  };

  for (const { item, start, end, visualEnd } of ranges) {
    if (start >= clusterEnd) flush();

    let col = colEnds.findIndex((e) => e <= start);
    if (col === -1) col = colEnds.length;
    colEnds[col] = visualEnd;
    clusterEnd = Math.max(clusterEnd, visualEnd);

    cluster.push({
      item,
      top: (start / 60) * ROW_HEIGHT,
      height: Math.max(((end - start) / 60) * ROW_HEIGHT, MIN_BLOCK_HEIGHT),
      col,
      cols: 1,
    });
  }
  flush();

  return blocks;
}

// バーの横位置（重なり時は列ごとに分割）
function blockStyle(block: Block<unknown>) {
  return {
    top: block.top + 1,
    height: block.height - 2,
    left: `calc(${(block.col / block.cols) * 100}% + 1px)`,
    width: `calc(${100 / block.cols}% - 2px)`,
  };
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

  const scheduleBlocks = layoutBlocks(schedules, startOfDayMinutes, endOfDayMinutes);
  const commitBlocks = layoutBlocks(commits, commitStartMinutes, commitEndMinutes);

  const slots: HourlySlot[] = hours.map((hour) => {
    const slotStart = hour * 60;
    const slotEnd = (hour + 1) * 60;

    // その時間帯（hour:00 〜 hour+1:00）と重なる予定・作業ログ
    const slotSchedules = schedules.filter(
      (s) => startOfDayMinutes(s) < slotEnd && endOfDayMinutes(s) > slotStart
    );
    const slotCommits = commits.filter(
      (c) => commitStartMinutes(c) < slotEnd && commitEndMinutes(c) > slotStart
    );

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
          {/* 1時間ごとの行（背景グリッド） */}
          {slots.map((slot) => (
            <div
              key={slot.hour}
              onClick={() => setSelectedSlot(slot)}
              className={`group ${GRID_COLS} cursor-pointer border-t border-gray-100 transition hover:bg-white`}
              style={{ height: ROW_HEIGHT }}
            >
              {/* 時間 */}
              <div className="pt-0.5 font-mono text-xs font-medium text-gray-400 group-hover:text-indigo-600">
                {slot.timeString}
              </div>
            </div>
          ))}

          {/* 予定・作業ログのバー（時間をまたいでも1本のラインとして表示） */}
          <div className={`pointer-events-none absolute inset-0 ${GRID_COLS}`}>
            <div />

            {/* 予定 */}
            <div className="relative">
              {scheduleBlocks.map((block) => {
                const s = block.item;
                const timeLabel = `${formatTime(s.startHour, s.startMinute)}-${formatTime(s.endHour, s.endMinute)}`;

                return (
                  <div
                    key={s.id}
                    onClick={() => setSelectedSlot(slots[s.startHour])}
                    title={`${s.title} (${timeLabel})`}
                    className="pointer-events-auto absolute cursor-pointer overflow-hidden rounded-md px-2 py-0.5 text-[11px] font-semibold text-white shadow-xs transition hover:brightness-110"
                    style={{ ...blockStyle(block), backgroundColor: s.color || "#6366f1" }}
                  >
                    <div className="truncate">📅 {s.title}</div>
                    {block.height >= ROW_HEIGHT * 0.75 && (
                      <div className="truncate text-[10px] font-normal opacity-80">{timeLabel}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 作業ログ */}
            <div className="relative">
              {commitBlocks.map((block) => {
                const c = block.item;
                const proj = projects.find((p) => p.id === c.projectId);
                const label = `${proj ? `[${proj.name}] ` : ""}${c.note || "作業ログ"}`;
                const timeLabel = `${formatTimestamp(c.startedAt)}-${formatTimestamp(c.endedAt)}`;

                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedSlot(slots[new Date(c.startedAt).getHours()])}
                    title={`${label} (${timeLabel})`}
                    className="pointer-events-auto absolute cursor-pointer overflow-hidden rounded-md border-l-[3px] border-emerald-500 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800 ring-1 ring-inset ring-emerald-600/20 transition hover:bg-emerald-100"
                    style={blockStyle(block)}
                  >
                    <div className="truncate">{label}</div>
                    {block.height >= ROW_HEIGHT * 0.75 && (
                      <div className="truncate text-[10px] font-normal opacity-75">{timeLabel}</div>
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