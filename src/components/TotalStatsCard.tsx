// components/TotalStatsCard.tsx
"use client";

import { useMemo } from "react";
import type { Commit, Project } from "../logic/types";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatMsToDetailedString(ms: number) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);

  if (h === 0) {
    return `${m}分`;
  }
  return `${h}時間 ${pad2(m)}分`;
}

interface TotalStatsCardProps {
  commits: Commit[];
  projects: Project[];
  loading?: boolean;
}

export default function TotalStatsCard({
  commits,
  projects,
  loading = false,
}: TotalStatsCardProps) {
  // 統計データの計算
  const stats = useMemo(() => {
    if (!commits.length) {
      return {
        totalMs: 0,
        totalCommits: 0,
        activeProjectsCount: 0,
        lastActiveDate: null,
        imageCommitsCount: 0,
      };
    }

    const totalMs = commits.reduce((sum, c) => sum + c.durationMs, 0);
    const totalCommits = commits.length;
    
    // コミットが存在するプロジェクトのID集合
    //const activeProjectIds = new Set(commits.map((c) => c.projectId));
    const completedCount = projects.filter((p) => p.completed).length;

    // 画像付きコミット数
    const imageCommitsCount = commits.filter((c) => c.image?.blob).length;

    // 最終作業日
    const latestEndedAt = Math.max(...commits.map((c) => c.endedAt));
    const lastActiveDate = new Date(latestEndedAt).toLocaleDateString();

    return {
      totalMs,
      totalCommits,
      //activeProjectsCount: activeProjectIds.size,//コミットしたことあるプロジェクトの数（完了進行中問わず）
      completedProjectsCount:completedCount, 
      lastActiveDate,
      imageCommitsCount,
    };
  }, [commits,projects]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
          <div className="h-16 bg-slate-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <span className="text-[11px] font-semibold text-sky-600 uppercase tracking-wider block">
            Overall Analytics
          </span>
          <h2 className="text-base font-bold text-slate-900">全体の作業実績</h2>
        </div>

        {stats.lastActiveDate && (
          <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 rounded-full">
            最終作業: {stats.lastActiveDate}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 総作業時間 */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">
            総作業時間
          </span>
          <span className="text-xl sm:text-2xl font-bold text-sky-600 tracking-tight">
            {formatMsToDetailedString(stats.totalMs)}
          </span>
        </div>

        {/* 総コミット数 */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">
            総ルーズリーフ数
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {stats.totalCommits}{" "}
            <span className="text-xs font-normal text-slate-500">枚</span>
          </span>
        </div>

        {/* 稼働プロジェクト数 */}
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">
            完了プロジェクト
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {stats.completedProjectsCount}{" "}
            <span className="text-xs font-normal text-slate-500">
              / {projects.length} 個
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}