"use client";

import { useEffect, useMemo, useState } from "react";
import type { NewProjectInput } from "../logic/api-types";
import CreateProjectModal from "../components/CreateProjectModal";
import type { Project, Commit, WorkSession,Summary } from "../logic/types";
import ConfirmModal from "../components/ConfirmModal";
import CalendarBoard from "../components/calendar/CalendarBoard"
import CommitModal, { type DraftCommit } from "../components/CommitModal"; 
import ProjectCard from "../components/ProjectCard";
import {
  loadProjectsIdb,
  saveProjectsIdb,
  loadCommitsIdb,
  loadSessionsIdb,
  deleteProjectDb,
  addCommitIdb,
} from "../logic/storage-idb";
import { HOST_URL } from "@/logic/url";//http://localhost:3001 まで(api/v1とかはない)理由：rails/からのアクティブレコードのパスを作りたいかわ

const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

import { loadProjects, createProject, loadCommits, createCommit, deleteProject, updateProject, allProjectSummary } from "../logic/api-request";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "../logic/auth";

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function daysUntil(dueDate: string) {
  const [y, m, d] = dueDate.split("-").map(Number);
  const due = new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
  const now = Date.now();
  const diffMs = due - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

// 今日（0:00以降）の累計時間を算出ヘルパー
function calcTodayTotalMs(commits: Commit[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayMs = startOfToday.getTime();

  return commits
    .filter((c) => c.endedAt >= todayMs)
    .reduce((acc, c) => acc + (c.durationMs || 0), 0);
}

export default function ProjectsDashboard() {
  const router = useRouter();
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const [projects, setProjects] = useState<Project[]>([]);
  const [commitsAll, setCommitsAll] = useState<Commit[]>([]);
  const [summary,setSummary] = useState<Summary[]>([]);
  const [loading, setLoading] = useState(true);

  // ダイレクトコミット用State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftCommit, setDraftCommit] = useState<DraftCommit | null>(null);
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // 削除確認モーダル用の State
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const [sessionsAll, setSessionsAll] = useState<WorkSession[]>([]);
  const [hasMounted] = useState(true);

  // 表示するタブ（active: 進行中, completed: 完了済み）
  const [activeTab, setActiveTab] = useState<"calender" | "active" | "completed">("active");

  const refresh = async () => {
    const [nextProjects, nextCommits, nextSessions, nextSummary] = await Promise.all([//
      isApiMode ? loadProjects() : loadProjectsIdb(),
      isApiMode ? loadCommits() : loadCommitsIdb(),
      loadSessionsIdb(), // Sessions はモードに関わらず常に IndexedDB から取得
      // サマリは API のみ提供。ローカルモードでは存在しない API を待たないようスキップする
      isApiMode ? allProjectSummary() : Promise.resolve<Summary[]>([]),
    ]);
    console.log("nextSummary:",nextSummary);
    setProjects(nextProjects);//一つでもなにかおかしい事あったら再リロードみたいにしてもいいかもしれ
    setCommitsAll(nextCommits);
    setSessionsAll(nextSessions);
    setSummary(nextSummary);
  };

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        await refresh();
      } catch (error) {
        console.error("Failed to load initial data:", error);
      } finally {
        // 読み込みに失敗してもローディング表示のまま止まらないようにする
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  // ダイレクトコミットモーダルを開く処理
  const handleOpenDirectCommit = (project: Project) => {
    const now = Date.now();
    const defaultMinutes = 30; // デフォルトで30分の作業としてセット

    const projectCommits = commitsAll.filter((c) => c.projectId === project.id);
    const todayMs = calcTodayTotalMs(projectCommits);
    const totalMs = projectCommits.reduce((acc, c) => acc + (c.durationMs || 0), 0);
    const recentNotes = projectCommits
      .map((c) => c.note)
      .filter((n): n is string => Boolean(n && n.trim()))
      .slice(-3);

    setTargetProjectId(project.id);
    setDraftCommit({
      projectId: project.id,
      projectName: project.name,
      endedAt: now,
      startedAt: now - defaultMinutes * 60 * 1000,
      durationMs:defaultMinutes * 60 * 1000 - now,
      note: "",
      commitNumber: projectCommits.length + 1,
      todayTotalMs: todayMs,
      projectTotalMs: totalMs,
      recentNotes: recentNotes,
      image: null,
    });

    setIsModalOpen(true);
  };

  const sorted = useMemo(() => {
    const copy = [...projects];

    copy.sort((a, b) => {
      const ad = a.dueDate?.trim() ? a.dueDate.trim() : "";
      const bd = b.dueDate?.trim() ? b.dueDate.trim() : "";

      if (ad && bd) return ad.localeCompare(bd);
      if (ad && !bd) return -1;
      if (!ad && bd) return 1;
      return b.createdAt - a.createdAt;
    });

    return copy;
  }, [projects]);

  // タブで「進行中」と「完了済み」を分類
  const filteredProjects = useMemo(() => {
    return sorted.filter((p) =>
      activeTab === "completed" ? p.completed : !p.completed
    );
  }, [sorted, activeTab]);

  // 件数カウント
  const counts = useMemo(() => {
    const completed = projects.filter((p) => p.completed).length;
    const active = projects.length - completed;
    return { active, completed };
  }, [projects]);

  const latestCommitMap = useMemo(() => {
    const map = new Map<string, Commit>();
    const isApiMode = process.env.NEXT_PUBLIC_API_MODE === 'true';

    for (const c of commitsAll) {
      const hasImage = isApiMode
        ? typeof c.image === 'string' || Boolean(c.image?.blob)
        : Boolean(c.image?.blob);

      if (hasImage) {
        const prev = map.get(c.projectId);
        if (!prev || prev.endedAt < c.endedAt) {
          map.set(c.projectId, c);
        }
      }
    }

    return map;
  }, [commitsAll]);

  function getImageUrl(commit: Commit) {
    const isApiMode = process.env.NEXT_PUBLIC_API_MODE === 'true';

    if (commit.image?.blob) {
      return URL.createObjectURL(commit.image.blob);
    }

    if (isApiMode && typeof commit.image === 'string') {
      return `${HOST_URL}/${commit.image}`;
    }

    return null;
  }

  const onCreate = async (input: NewProjectInput) => {
    const name = input.name.trim();
    if (!name) return;

    const targetHours =
      input.targetHours && Number.isFinite(input.targetHours) && input.targetHours > 0
        ? input.targetHours
        : undefined;

    const pomodoroWorkMinutes =
      input.pomodoroWorkMinutes && Number.isFinite(input.pomodoroWorkMinutes) && input.pomodoroWorkMinutes > 0
        ? input.pomodoroWorkMinutes
        : undefined;

    const pomodoroBreakMinutes =
      input.pomodoroBreakMinutes && Number.isFinite(input.pomodoroBreakMinutes) && input.pomodoroBreakMinutes > 0
        ? input.pomodoroBreakMinutes
        : undefined;

    const sanitizedInput: NewProjectInput = {
      ...input,
      name,
      dueDate: input.dueDate?.trim() || undefined,
      memo: input.memo?.trim() || undefined,
      targetHours: input.targetHours,
      pomodoroWorkMinutes: input.pomodoroWorkMinutes,
      pomodoroBreakMinutes: input.pomodoroBreakMinutes
    };

    const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

    if (isApiMode) {
      try {
        const created = await createProject(sanitizedInput);
        if (!created) return;
        const nextProjects = await loadProjects();
        setProjects(nextProjects);
        setIsCreateOpen(false);
      } catch (error) {
        console.error("プロジェクトの作成に失敗しました:", error);
      }
    } else {
      const p: Project = {
        id: uid(),
        name,
        dueDate: sanitizedInput.dueDate,
        memo: sanitizedInput.memo,
        targetHours,
        pomodoroWorkMinutes,
        pomodoroBreakMinutes,
        completed: false,
        createdAt: Date.now(),
      };

      const nextProjects = [p, ...projects];
      setProjects(nextProjects);
      await saveProjectsIdb(nextProjects);
      setIsCreateOpen(false);
    }
  };

  const onToggleComplete = async (project: Project) => {
    const nextStatus = !project.completed;
    const actionLabel = nextStatus ? "完了" : "未完了（進行中）に戻す";

    if (!confirm(`「${project.name}」を${actionLabel}状態に変更しますか？`)) {
      return;
    }

    const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

    const updatedTargetProject: Project = {
      ...project,
      completed: nextStatus,
    };

    const nextProjects = projects.map((p) =>
      p.id === project.id ? updatedTargetProject : p
    );

    if (isApiMode) {
      const updated = await updateProject(updatedTargetProject);
      if (!updated) {
        alert("ステータスの更新に失敗しました");
        setProjects(projects);
      } else {
        const nexProjects = await loadProjects();
        setProjects(nexProjects);
      }
    } else {
      await saveProjectsIdb(nextProjects);
    }
  };

  // 削除ボタン押下時: モーダルを開くために削除対象を設定
  const onRequestDelete = (project: Project) => {
    setDeleteTarget(project);
  };

  // モーダル側で確定ボタンが押された時の実行関数
  // モーダル側で確定ボタンが押された時の実行関数
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    setLoading(true);

    const id = deleteTarget.id;
    const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

    try {
      if (isApiMode) {
        const success = await deleteProject(id);

        if (!success) {
          alert("プロジェクトの削除に失敗しました。時間をおいて再度お試しください。");
          return;
        }
      } else {
        await deleteProjectDb(id);
      }

      // API / IndexedDB どちらでも、成功したら画面上から削除
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setLoading(false);
    }
  };

  if (!hasMounted) {
    return null;
  }

  return (
    <main className="max-w-4xl mx-auto min-h-screen px-4 py-8 space-y-8 font-sans text-slate-800 antialiased">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            memomy
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {isApiMode
              ? "データはサーバーに保存されます"
              : "データはブラウザ（IndexedDB）に保存されます"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/users"
            className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 py-2 px-3.5 rounded-xl shadow-sm transition-colors"
          >
            ← userpageへ
          </Link>
          {isApiMode && (
            <button
              onClick={handleLogout}
              className="text-xs font-semibold text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 py-2 px-3.5 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              ログアウト
            </button>
          )}
          <button
            onClick={() => setIsCreateOpen(true)}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span className="text-lg leading-none">+</span> 新規プロジェクト
          </button>
        </div>
      </header>

      {/* Projects List Header & Tabs */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("active")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "active"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              進行中
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === "active"
                    ? "bg-white text-sky-950"
                    : "bg-slate-200 text-slate-400"
                }`}
              >
                {counts.active}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("completed")}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "completed"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              完了済み
              <span
                className={`px-2 py-0.5 text-xs rounded-full ${
                  activeTab === "completed"
                    ? "bg-emerald-800 text-emerald-100"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {counts.completed}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("calender")} 
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                activeTab === "calender"
                  ? "bg-emerald-700 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              カレンダー
            </button>
          </div>
        </div>

        {/*projectカードリスト領域 */}
        {loading ? (
          <div className="flex items-center justify-center p-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 text-slate-400 font-medium text-sm">
            データを読み込み中...
          </div>
        ) : activeTab === "calender" ? (
            <CalendarBoard />
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50">
            <p className="text-slate-500 font-medium">
              {activeTab === "active"
                ? "進行中のプロジェクトはありません。"
                : "完了済みのプロジェクトはありません。"}
            </p>
            {activeTab === "active" && (
              <p className="text-xs text-slate-400 mt-1">
                右上の「+ 新規プロジェクト」ボタンから作成を始めましょう！
              </p>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredProjects.map((p) => {
              const due = p.dueDate?.trim() ? p.dueDate.trim() : "";
              const remain = due ? daysUntil(due) : null;
              const latest = latestCommitMap.get(p.id);
              const imageUrl = latest ? getImageUrl(latest) : null;
              const imageId =latest?.id;//コミットのid
              const activeSession = sessionsAll.find(
                (s) => s.projectId === p.id && s.endedAt == null
              );
              const isRunning = activeSession?.status === "running";
              const isPaused = activeSession?.status === "paused";

              return (
                <ProjectCard
                  key={p.id}
                  project={p}
                  summary={summary}
                  due={due}
                  remain={remain}
                  imageUrl={imageUrl}
                  imageId={imageId}
                  isRunning={isRunning}
                  isPaused={isPaused}
                  onRequestDelete={onRequestDelete}
                  onToggleComplete={onToggleComplete}
                  handleOpenDirectCommit={handleOpenDirectCommit}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* 新規作成モーダル */}
      <CreateProjectModal
        key={isCreateOpen ? "open" : "closed"}
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={onCreate}
      />

      {/* 削除確認モーダル */}
      <ConfirmModal 
        open={Boolean(deleteTarget)}
        title="プロジェクトの削除"
        message={`「${deleteTarget?.name || ""}」を削除してもよろしいですか？\nこの操作は取り消せません。`}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={loading}
      />

      {/* ダイレクトコミットモーダル */}
      <CommitModal
        open={isModalOpen}
        mode="direct"
        draft={draftCommit}
        onChange={setDraftCommit}
        onCancel={() => {
          setIsModalOpen(false);
          setDraftCommit(null);
          setTargetProjectId(null);
        }}
        onSave={async () => {
          if (!draftCommit || !targetProjectId) return;

          const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

          if (isApiMode) {
            try {
              const created = await createCommit({
                projectId: targetProjectId,
                startedAt: draftCommit.startedAt,
                endedAt: draftCommit.endedAt,
                durationMs:draftCommit.endedAt - draftCommit.startedAt,
                note: draftCommit.note,
                image: draftCommit.image
                  ? {
                      name: draftCommit.image.name,
                      type: draftCommit.image.type,
                      size: draftCommit.image.size,
                      blob: draftCommit.image.file,
                    }
                  : undefined,
              });

              if (!created) return;
            } catch (error) {
              console.error("コミットの作成に失敗しました:", error);
              return;
            }
          } else {
            await addCommitIdb({
              id: uid(),
              projectId: targetProjectId,
              startedAt: draftCommit.startedAt,
              endedAt: draftCommit.endedAt,
              durationMs: draftCommit.endedAt - draftCommit.startedAt,
              note: draftCommit.note,
              image: draftCommit.image
                ? {
                    name: draftCommit.image.name,
                    type: draftCommit.image.type,
                    size: draftCommit.image.size,
                    blob: draftCommit.image.file,
                  }
                : null,
            });
          }

          setIsModalOpen(false);
          setDraftCommit(null);
          setTargetProjectId(null);
          await refresh();
        }}
        onSaveAndContinue={() => {}}
      />

      <div className="space-y-6 pt-4 border-t border-slate-200" />
    </main>
  );
}