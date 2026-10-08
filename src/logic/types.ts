// src/logic/types.ts



export type IconImage = {//railsのアクティブストレージでurlを受け取ってアイコンにしたい
  width: number;
  height: number;
  url: string;
};

export type Badge = {
  id: string;
  name: string;        // 例: "100時間突破", "皆勤賞", "初コミット"
  icon: string;        // 例: "🔥", "🎨", "⚡" などの絵文字や画像URL
  description: string; // 例: "累計作業時間が100時間を超えました"
  unlockedAt?: number; // 獲得日時 (オプショナル: 獲得判定用)
};

export type User = {
  id: string;
  name: string;
  icon?: string;
  iconBlob?: Blob | File;
  bio?: string;
  bgmUrl?: string; // 作業BGMリンク用
  snsUrls?: string[];//SNSのリンク用（Twitter・個人サイトなど複数モテるように）
  badges?: Badge[];
  createdAt?: number;
  updatedAt?: number;
};

export type Project = {
  id: string;
  name: string;
  dueDate?: string; // "YYYY-MM-DD"
  memo?: string;
  createdAt: number;
  targetHours?: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  completed:boolean;
};



export type WorkSessionStatus = "running" | "paused";

export type TimerMode = "idle" | "work" | "break";

export type WorkSession = {
  id: string;
  projectId: string;
  startedAt: number;
  endedAt?: number;
  note: string;
  status: WorkSessionStatus;
  timerMode?: TimerMode;
  pomodoroCount?: number;
  pomodoroWorkMinutes?: number;
  pomodoroBreakMinutes?: number;
  pausedAt?: number;
};

export type CommitImage = {
  name: string;
  type: string;
  size: number;
  blob: Blob;
};

export type Commit = {
  id: string;
  projectId: string;
  startedAt: number;
  endedAt: number;
  durationMs: number;
  note?: string;
  image?: CommitImage | null;
};

// 日付セルに置く個人メモ
export type CalendarMemo = {
  id: string;
  date: string; // "YYYY-MM-DD"
  text: string;//タイトル
  detail?: string;//本文
  createdAt: number;
};

export type DaySchedule = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  startHour: number; // 0~23
  startMinute: number;
  endHour: number;
  endMinute: number;
  color?: string;
  projectId?: string;
};



// カレンダー描画用に組み立てたセルデータ
export type CalendarCell = {
  date: string; // "YYYY-MM-DD"
  isCurrentMonth: boolean;
  isCurrendDay: boolean;
  projects?: Project[]; // その日に進行中のプロジェクト
  dueProjects: Project[]; // 納期がその日のプロジェクト
  memos: CalendarMemo[];
  commits: Commit[];
  schedules?: DaySchedule[];
};

export const localUser: User[] = [
  {
    id: "1",
    name: "InitialUser",
    icon:"",
    bio: "初期ユーザーだよぅ",
    bgmUrl: "https://soundcloud.com/bakuwara/oreranatotomodachi",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
  },{
    id: "2",
    name: "テストユーザ２",
    icon:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    bio: "なんふぇ？",
    bgmUrl: "test",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
  }
];

export const initialuUser:User={
    id: "1",
    name: "InitialUser",
    icon:"",
    bio: "初期ユーザーだよぅ",
    bgmUrl: "https://soundcloud.com/bakuwara/oreranatotomodachi",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
}
