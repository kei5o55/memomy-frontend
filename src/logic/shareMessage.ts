// src/logic/shareMessage.ts
// シェアメッセージ生成用ロジック（X Web Intent で 1 日の作業記録を共有する）
import type { Commit, Project } from "./types";

// X の投稿画面を開く Web Intent のエンドポイント（ログイン不要・API キー不要）
export const X_INTENT_URL = "https://x.com/intent/tweet";
export const SHARE_SITE_URL = "https://memomy.net";
export const SHARE_HASHTAGS = ["memomy"];
// 本文に並べるプロジェクトの最大数（X の文字数制限に収めるため）
const MAX_PROJECTS_IN_TEXT = 3;

export type DailyProjectSummary = {
  projectId: string;
  name: string;
  totalMs: number;
};

export type DailySummary = {
  date: string; // "YYYY-MM-DD"（ローカル時刻）
  totalMs: number;
  commitCount: number;
  projects: DailyProjectSummary[]; // 作業時間の長い順
};

// ローカル時刻の "YYYY-MM-DD"
export function toDateKey(ms: number): string {
  const d = new Date(ms);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// 例: 8100000 → "2時間15分" / 900000 → "15分"
export function formatDurationJa(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

/**
 * 指定日（作業の開始日で判定）のコミットをプロジェクトごとに集計する
 * TODO: 日付をまたぐ作業の扱い（開始日・終了日どちらに寄せるか／按分するか）を決める
 */
export function buildDailySummary(commits: Commit[], projects: Project[], date: string): DailySummary {
  const dayCommits = commits.filter((c) => toDateKey(c.startedAt) === date);
  const nameById = new Map(projects.map((p) => [p.id, p.name]));

  const msByProject = new Map<string, number>();
  for (const c of dayCommits) {
    msByProject.set(c.projectId, (msByProject.get(c.projectId) ?? 0) + (c.durationMs || 0));
  }

  const projectSummaries = [...msByProject.entries()]
    .map(([projectId, totalMs]) => ({
      projectId,
      name: nameById.get(projectId) ?? "削除済みのプロジェクト",
      totalMs,
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return {
    date,
    totalMs: projectSummaries.reduce((sum, p) => sum + p.totalMs, 0),
    commitCount: dayCommits.length,
    projects: projectSummaries,
  };
}

/**
 * 共有用の本文を組み立てる（URL・ハッシュタグは Intent のパラメータで別に付ける）
 * TODO: 文面のテンプレートを選べるようにする／X の文字数（日本語は 1 文字 2 カウント）を厳密に数える
 */
export function buildDailyShareText(summary: DailySummary): string {
  const [, month, day] = summary.date.split("-").map(Number);

  if (summary.commitCount === 0) {
    return `${month}/${day} は作業記録がありませんでした。明日もがんばる！`;
  }

  const lines = summary.projects
    .slice(0, MAX_PROJECTS_IN_TEXT)
    .map((p) => `・${p.name}：${formatDurationJa(p.totalMs)}`);
  const restCount = summary.projects.length - MAX_PROJECTS_IN_TEXT;
  if (restCount > 0) lines.push(`ほか ${restCount} 件`);

  return [
    `${month}/${day} の作業記録`,
    `合計 ${formatDurationJa(summary.totalMs)}（${summary.commitCount} 回）`,
    ...lines,""
  ].join("\n");
}

// X の投稿画面を開く Web Intent の URL を作る
export function buildXIntentUrl({
  text,
  url = SHARE_SITE_URL,
  hashtags = SHARE_HASHTAGS,
}: {
  text: string;
  url?: string;
  hashtags?: string[];
}): string {
  const params = new URLSearchParams({ text });
  if (url) params.set("url", url);
  if (hashtags.length > 0) params.set("hashtags", hashtags.join(","));
  return `${X_INTENT_URL}?${params.toString()}`;
}
