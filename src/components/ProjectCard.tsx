import Link from "next/link";
import type { Project, Summary } from "../logic/types";

type Props = {
  project: Project;
  summary: Summary[];
  due: string;
  remain: number | null;
  imageUrl: string | null;
  imageId?: string;
  isRunning: boolean;
  isPaused: boolean;
  onRequestDelete: (project: Project) => void;
  onToggleComplete: (project: Project) => void;
  handleOpenDirectCommit: (project: Project) => void;
};

export default function ProjectCard({
  project,
  summary,
  due,
  remain,
  imageUrl,
  imageId,
  isRunning,
  isPaused,
  onRequestDelete,
  onToggleComplete,
  handleOpenDirectCommit,
}: Props) {
  return (
    <article
      className={`group relative bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4 ${
        project.completed
          ? "border-slate-200 bg-slate-50/60 opacity-80 hover:opacity-100"
          : "border-slate-200"
      }`}
    >
      {/* Top Bar: Name, Status & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center justify-between gap-3">
            {/* プロジェクト名 */}
            <h2
              className={`text-lg font-bold tracking-tight truncate ${
                project.completed
                  ? "line-through text-slate-400"
                  : "text-slate-900"
              }`}
            >
              {project.name}
            </h2>

            {/* 作業時間バッジ */}
            <span className="shrink-0 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 border border-slate-200/60">
              ⏱️ {summary.find((s) => s.projectId === project.id)?.totalMinutes ?? 0} 分
            </span>
          </div>

          {project.completed && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              ✓ 完了
            </span>
          )}

          {!project.completed && isRunning && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
              作業中
            </span>
          )}
          {!project.completed && isPaused && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              一時停止中
            </span>
          )}
        </div>

        <button
          onClick={() => onRequestDelete(project)}
          className="text-xs font-medium text-slate-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50 cursor-pointer ml-auto sm:ml-0"
          title="プロジェクトを削除"
        >
          削除
        </button>
      </div>

      {/* Details Meta */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        {due ? (
          <div className="flex items-center gap-1">
            <span className="font-medium text-slate-600">
              納期: {due}
            </span>
            {remain != null && !project.completed && (
              <span
                className={`font-semibold ${
                  remain < 0
                    ? "text-red-500"
                    : remain <= 3
                    ? "text-amber-600"
                    : "text-sky-600"
                }`}
              >
                （{remain < 0 ? `${Math.abs(remain)}日超過` : `あと${remain}日`}）
              </span>
            )}
          </div>
        ) : (
          <span className="text-slate-400">納期なし</span>
        )}

        <span className="text-slate-300">•</span>

        {project.pomodoroWorkMinutes && project.pomodoroBreakMinutes ? (
          <span>
            ポモドーロ: {project.pomodoroWorkMinutes}分 / 休憩 {project.pomodoroBreakMinutes}分
          </span>
        ) : (
          <span className="text-slate-400">ポモドーロ未設定</span>
        )}
      </div>

      {/* Main Content Area: Memo + Image */}
      <div className="flex flex-col sm:flex-row gap-4 items-start justify-between">
        <div className="flex-1 text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
          {project.memo ? (
            project.memo
          ) : (
            <span className="text-slate-400 italic text-xs">
              （メモはありません）
            </span>
          )}
        </div>

        {imageUrl && (
          <div className="shrink-0 w-full sm:w-auto">
            <Link href={`/commits/${imageId}`}>
            <img

              src={imageUrl}
              alt="latest commit"
              className="h-28 sm:h-32 w-full sm:w-48 object-cover rounded-xl border border-slate-200 shadow-sm"
            /></Link>
          </div>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="flex items-center gap-2.5">
          <Link
            href={`/project/${project.id}`}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition-colors"
          >
            詳細を見る
          </Link>
          {!project.completed && (
            <Link
              href={`/timer/${project.id}`}
              className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg shadow-sm transition-colors"
            >
              作業をはじめる
            </Link>
          )}
          {!project.completed && (
            <button
              onClick={() => handleOpenDirectCommit(project)}
              className="text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              ダイレクトコミット
            </button>
          )}
        </div>

        {/* 完了 / 戻す ボタン */}
        <button
          onClick={() => onToggleComplete(project)}
          className={`text-xs font-bold px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
            project.completed
              ? "bg-slate-200 hover:bg-slate-300 text-slate-700"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200"
          }`}
        >
          {project.completed ? (
            <>↩ 未完了に戻す</>
          ) : (
            <>✓ 完了にする</>
          )}
        </button>
      </div>
    </article>
  );
}
