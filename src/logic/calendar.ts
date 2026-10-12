import type { CalendarCell, CalendarMemo, Commit, Project } from "./types";

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// 作成日〜納期（当日を含む）の間にある日付なら進行中とみなす。納期未設定のプロジェクトは対象外
function isProjectInProgressOn(project: Project, date: string): boolean {
  if (!project.dueDate) return false;
  return formatDate(new Date(project.createdAt)) <= date && date <= project.dueDate;
}

function isCommitOnDate(commit: Commit, date: string): boolean {
  return formatDate(new Date(commit.startedAt)) === date;
}

export function buildCalendarCells(
  year: number,
  month: number,
  projects: Project[],
  memos: CalendarMemo[],
  commits: Commit[],
): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const startWeekDay = firstDay.getDay();
  const calendarStart = new Date(year, month, 1 - startWeekDay);

  const cells: CalendarCell[] = [];

  for (let i = 0; i < 42; i++) {
    const current = new Date(calendarStart);
    current.setDate(calendarStart.getDate() + i);

    const date = formatDate(current);



    const inProgressProjects = projects.filter((p) => isProjectInProgressOn(p, date));
    const dueProjects = projects.filter((p) => p.dueDate === date);

    const dayMemos = memos.filter((m) => m.date === date);
    const dayCommits = commits.filter((c) => isCommitOnDate(c, date));

    cells.push({
      date,
      isCurrentMonth: current.getMonth() === month,
      isCurrentDay: date === formatDate(new Date()),
      projects: inProgressProjects,
      dueProjects,
      memos: dayMemos,
      commits: dayCommits,
    });
  }

  return cells;
}
