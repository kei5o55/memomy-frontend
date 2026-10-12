"use client";
import { useEffect, useMemo, useRef, useState } from "react";

// サブタイマー：TimerPage のメインタイマーと同じ操作感で使える独立したタイマー。
// 状態はコンポーネント内だけで持ち、Commit の保存や IndexedDB への永続化は行わない。

type SubTimerStatus = "idle" | "running" | "paused";

type SubTimerProps = {
  title?: string;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  // Stop 時に経過時間を親へ渡す（将来メインタイマー側で使う想定）
  onStop?: (elapsedMs: number) => void;
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMs(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

function playSE(src: string) {
  const audio = new Audio(src);
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export default function SubTimer({
  title = "サブタイマー",
  pomodoroWorkMinutes = 25,
  pomodoroBreakMinutes = 5,
  onStop,
}: SubTimerProps) {
  const [status, setStatus] = useState<SubTimerStatus>("idle");
  // 一時停止分を差し引いた「仮想的な開始時刻」。経過時間 = (pausedAt ?? now) - startedAt
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());
  const [pomodoroEnabled, setPomodoroEnabled] = useState(false);

  useEffect(() => {
    if (status !== "running") return;
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, [status]);

  const elapsedMs = useMemo(() => {
    if (startedAt == null) return 0;
    return (pausedAt ?? now) - startedAt;
  }, [startedAt, pausedAt, now]);

  // ポモドーロは経過時間から算出する（一時停止中は経過時間が進まないので自動的に止まる）
  const workMs = pomodoroWorkMinutes * 60 * 1000;
  const breakMs = pomodoroBreakMinutes * 60 * 1000;
  const cycleMs = workMs + breakMs;

  const pomodoro = useMemo(() => {
    const cycleIndex = Math.floor(elapsedMs / cycleMs);
    const inCycle = elapsedMs % cycleMs;
    const isWork = inCycle < workMs;
    return {
      phase: isWork ? ("work" as const) : ("break" as const),
      remainingMs: isWork ? workMs - inCycle : cycleMs - inCycle,
      completed: cycleIndex + (isWork ? 0 : 1),
      // フェーズの通し番号（work=偶数, break=奇数）。切り替わり検知に使う
      phaseIndex: cycleIndex * 2 + (isWork ? 0 : 1),
    };
  }, [elapsedMs, cycleMs, workMs]);

  // フェーズが切り替わったら効果音を鳴らす
  const prevPhaseIndexRef = useRef(0);
  useEffect(() => {
    const prev = prevPhaseIndexRef.current;
    prevPhaseIndexRef.current = pomodoro.phaseIndex;
    if (!pomodoroEnabled || status !== "running") return;
    if (pomodoro.phaseIndex > prev) playSE("/sounds/se.mp3");
  }, [pomodoro.phaseIndex, pomodoroEnabled, status]);

  const start = () => {
    if (status !== "idle") return;
    const nowTs = Date.now();
    setNow(nowTs);
    setStartedAt(nowTs);
    setPausedAt(null);
    setStatus("running");
  };

  const pause = () => {
    if (status !== "running") return;
    const nowTs = Date.now();
    setNow(nowTs);
    setPausedAt(nowTs);
    setStatus("paused");
  };

  const resume = () => {
    if (status !== "paused" || startedAt == null || pausedAt == null) return;
    const nowTs = Date.now();
    setNow(nowTs);
    setStartedAt(nowTs - (pausedAt - startedAt));
    setPausedAt(null);
    setStatus("running");
  };

  const stop = () => {
    if (status === "idle") return;
    onStop?.(elapsedMs);
    setStartedAt(null);
    setPausedAt(null);
    setStatus("idle");
  };

  return (
    <section className="p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h3 className="text-sm font-bold text-zinc-700">{title}</h3>
        <div className="text-xs text-zinc-400 flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "running"
                ? "bg-emerald-500 animate-pulse"
                : status === "paused"
                ? "bg-amber-500"
                : "bg-zinc-300"
            }`}
          />
          {status === "idle" ? "Not running" : (
            <span className="font-semibold uppercase text-zinc-600">[{status}]</span>
          )}
        </div>
      </div>

      <div className="text-3xl font-mono font-bold tracking-tight text-zinc-900 tabular-nums mb-4">
        {formatMs(elapsedMs)}
      </div>

      {pomodoroEnabled && status !== "idle" && (
        <div className="mb-4 p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs text-zinc-600 space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">フェーズ:</span>
            <span
              className={`font-medium px-2 py-0.5 rounded ${
                pomodoro.phase === "work"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {pomodoro.phase === "work" ? "作業中" : "休憩中"}
            </span>
          </div>
          <div>
            残り時間:{" "}
            <span className="font-mono font-semibold">
              {formatMs(pomodoro.remainingMs)}
            </span>
          </div>
          <div>完了ポモドーロ数: {pomodoro.completed}</div>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="grid grid-cols-2 gap-1.5 mb-4">
        <button
          onClick={start}
          disabled={status !== "idle"}
          className="text-xs px-2 py-1.5 font-semibold text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Start
        </button>

        <button
          onClick={pause}
          disabled={status !== "running"}
          className="text-xs px-2 py-1.5 font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Pause
        </button>

        <button
          onClick={resume}
          disabled={status !== "paused"}
          className="text-xs px-2 py-1.5 font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 border border-zinc-300 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Resume
        </button>

        <button
          onClick={stop}
          disabled={status === "idle"}
          className="text-xs px-2 py-1.5 font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          Stop
        </button>
      </div>

      {/* ポモドーロ切り替え */}
      <div className="flex flex-col gap-1 text-xs">
        <label className="flex items-center gap-1.5 font-medium text-zinc-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={pomodoroEnabled}
            onChange={(e) => setPomodoroEnabled(e.target.checked)}
            disabled={status !== "idle"}
            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-zinc-300 cursor-pointer disabled:opacity-50"
          />
          ポモドーロを使う
        </label>

        <span className="text-zinc-400">
          (設定: {pomodoroWorkMinutes}分 / 休憩 {pomodoroBreakMinutes}分)
        </span>
      </div>
    </section>
  );
}
