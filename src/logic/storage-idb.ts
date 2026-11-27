import { openDB, type DBSchema } from "idb";
import type { Project, WorkSession, Commit, CalendarMemo, DaySchedule, User, ProjectReferenceImage } from "./types";
import { compressImage } from "./image-compress";
import {initialuUser} from "./dummyDate";

export const IDB_NAME = "worklog-db";
export const IDB_VERSION = 5; // referenceImages ストアを追加 (4 -> 5)

export const STORE_NAMES = {
  projects: "projects",
  sessions: "sessions",
  commits: "commits",
  calendarMemos: "calendarMemos",
  daySchedules: "daySchedules",
  userProfile: "userProfile", // 追加
  referenceImages: "referenceImages",
} as const;

// 1 プロジェクトあたりの参考画像の上限枚数
export const MAX_REFERENCE_IMAGES_PER_PROJECT = 10;

// ユーザープロフィールの固定キー（User.id は number なのでローカルユーザーは 0 で固定）
export const CURRENT_USER_KEY = 0;
// IDB_VERSION 3 以前のユーザープロフィールのキー
const LEGACY_CURRENT_USER_KEY = "current_user";

interface WorklogDB extends DBSchema {
  projects: {
    key: string;
    value: Project;
  };
  sessions: {
    key: string;
    value: WorkSession;
  };
  commits: {
    key: string;
    value: Commit;
  };
  calendarMemos: {
    key: string;
    value: CalendarMemo;
  };
  daySchedules: {
    key: string;
    value: DaySchedule;
  };
  userProfile: { // 追加
    key: number;
    value: User;
  };
  referenceImages: {
    key: string;
    value: ProjectReferenceImage;
    indexes: { "by-projectId": string };
  };
}

function normalizeString(s: unknown): string | undefined {
  if (typeof s !== "string") return undefined;
  const t = s.trim();
  return t ? t : undefined;
}

export function normalizeProject(p: Project): Project {
  const th =
    typeof p.targetHours === "number" &&
    Number.isFinite(p.targetHours) &&
    p.targetHours > 0
      ? p.targetHours
      : undefined;

  const pwm =
    typeof p.pomodoroWorkMinutes === "number" &&
    Number.isFinite(p.pomodoroWorkMinutes) &&
    p.pomodoroWorkMinutes > 0
      ? p.pomodoroWorkMinutes
      : undefined;

  const pbm =
    typeof p.pomodoroBreakMinutes === "number" &&
    Number.isFinite(p.pomodoroBreakMinutes) &&
    p.pomodoroBreakMinutes > 0
      ? p.pomodoroBreakMinutes
      : undefined;

  return {
    ...p,
    dueDate: normalizeString(p.dueDate),
    memo: normalizeString(p.memo),
    targetHours: th,
    pomodoroWorkMinutes: pwm,
    pomodoroBreakMinutes: pbm,
  };
}

function normalizeCalendarMemo(memo: CalendarMemo): CalendarMemo {
  return {
    id: memo.id,
    date: normalizeString(memo.date) ?? "",
    text: normalizeString(memo.text) ?? "",
    createdAt: typeof memo.createdAt === "number" ? memo.createdAt : Date.now(),
  };
}

function normalizeDaySchedule(s: DaySchedule): DaySchedule {
  return {
    id: s.id,
    date: normalizeString(s.date) ?? "",
    title: normalizeString(s.title) ?? "",
    startHour: typeof s.startHour === "number" ? Math.max(0, Math.min(23, s.startHour)) : 0,
    startMinute: typeof s.startMinute === "number" ? Math.max(0, Math.min(59, s.startMinute)) : 0,
    endHour: typeof s.endHour === "number" ? Math.max(0, Math.min(23, s.endHour)) : 0,
    endMinute: typeof s.endMinute === "number" ? Math.max(0, Math.min(59, s.endMinute)) : 0,
    color: normalizeString(s.color),
    projectId: normalizeString(s.projectId),
  };
}

// 旧形式のプロフィールに残っている可能性があるフィールド
type LegacyUserProfile = Omit<User, "id"> & {
  id: number | string;
  snsUrls?: string[];
  snsUrl?: string;
};

// ユーザープロフィールの正規化ヘルパー
// 旧形式（id: "current_user"、snsUrls / snsUrl）のデータも新形式に変換する
function normalizeUserProfile(user: LegacyUserProfile): User {
  const { snsUrls, snsUrl, ...rest } = user;
  const snsLinks = (user.snsLinks ?? snsUrls ?? (snsUrl ? [snsUrl] : []))
    .map((link) => link.trim())
    .filter((link) => link !== "");

  return {
    ...rest,
    id: typeof user.id === "number" ? user.id : CURRENT_USER_KEY,
    name: normalizeString(user.name) ?? "No Name",
    bio: normalizeString(user.bio),
    bgmUrl: normalizeString(user.bgmUrl),
    snsLinks,
  };
}

export const dbPromise =
  typeof window !== "undefined"
    ? openDB<WorklogDB>(IDB_NAME, IDB_VERSION, {
        upgrade(db, oldVersion, _newVersion, tx) {
          if (!db.objectStoreNames.contains(STORE_NAMES.projects)) {
            db.createObjectStore(STORE_NAMES.projects, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_NAMES.sessions)) {
            db.createObjectStore(STORE_NAMES.sessions, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_NAMES.commits)) {
            db.createObjectStore(STORE_NAMES.commits, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_NAMES.calendarMemos)) {
            db.createObjectStore(STORE_NAMES.calendarMemos, { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains(STORE_NAMES.daySchedules)) {
            db.createObjectStore(STORE_NAMES.daySchedules, { keyPath: "id" });
          }
          // 追加: userProfileストアの作成
          if (!db.objectStoreNames.contains(STORE_NAMES.userProfile)) {
            db.createObjectStore(STORE_NAMES.userProfile, { keyPath: "id" });
          }
          // 4 -> 5: プロジェクトの参考画像（projectId で引けるようにインデックスを張る）
          if (!db.objectStoreNames.contains(STORE_NAMES.referenceImages)) {
            const store = db.createObjectStore(STORE_NAMES.referenceImages, { keyPath: "id" });
            store.createIndex("by-projectId", "projectId");
          }
          // 3 -> 4: "current_user" キーのプロフィールを number キー (0) に移し替える
          if (oldVersion === 3) {
            const store = tx.objectStore(STORE_NAMES.userProfile);
            // 旧キーは string なので、型定義 (key: number) を外して取得・削除する
            const legacyKey = LEGACY_CURRENT_USER_KEY as unknown as number;
            void store.get(legacyKey).then(async (legacy) => {
              if (!legacy) return;
              await store.put(normalizeUserProfile({ ...legacy, id: CURRENT_USER_KEY }));
              await store.delete(legacyKey);
            });
          }
        },
      })
    : Promise.resolve(null);

// ===== Projects =====
export async function loadProjectsIdb(): Promise<Project[]> {
  const db = await dbPromise;
  if (!db) return [];
  const items = await db.getAll(STORE_NAMES.projects);
  return items.map(normalizeProject);
}

export async function saveProjectsIdb(projects: Project[]): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(STORE_NAMES.projects, "readwrite");
  await tx.store.clear();
  for (const project of projects.map(normalizeProject)) {
    await tx.store.put(project);
  }
  await tx.done;
}

export async function clearProjectsIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.projects);
}

// ===== Sessions =====
export async function loadSessionsIdb(): Promise<WorkSession[]> {
  const db = await dbPromise;
  if (!db) return [];
  return db.getAll(STORE_NAMES.sessions);
}

export async function saveSessionsIdb(sessions: WorkSession[]): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(STORE_NAMES.sessions, "readwrite");
  await tx.store.clear();
  for (const session of sessions) {
    await tx.store.put(session);
  }
  await tx.done;
}

export async function clearSessionsIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.sessions);
}

// ===== Commits =====
export async function loadCommitsIdb(): Promise<Commit[]> {
  const db = await dbPromise;
  if (!db) return [];
  return db.getAll(STORE_NAMES.commits);
}

export async function saveCommitsIdb(commits: Commit[]): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(STORE_NAMES.commits, "readwrite");
  await tx.store.clear();
  for (const commit of commits) {
    await tx.store.put(commit);
  }
  await tx.done;
}

export async function addCommitIdb(commit: Commit): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.put(STORE_NAMES.commits, commit);
}

export async function getCommitByIdIdb(
  commitId: string,
): Promise<Commit | null> {
  const db = await dbPromise;
  if (!db) return null;
  return (await db.get(STORE_NAMES.commits, commitId)) ?? null;
}

export async function getCommitIdb(
  projectId: string,
  commitId: string,
): Promise<Commit | null> {
  const db = await dbPromise;
  if (!db) return null;
  const commit = await db.get(STORE_NAMES.commits, commitId);
  if (!commit || commit.projectId !== projectId) return null;
  return commit;
}

export async function clearCommitsIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.commits);
}

// ===== Calendar Memos =====
export async function loadCalendarMemosIdb(): Promise<CalendarMemo[]> {
  const db = await dbPromise;
  if (!db) return [];
  const items = await db.getAll(STORE_NAMES.calendarMemos);
  return items
    .map(normalizeCalendarMemo)
    .filter((m: CalendarMemo) => m.date && m.text);
}

export async function saveCalendarMemosIdb(
  memos: CalendarMemo[],
): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(STORE_NAMES.calendarMemos, "readwrite");
  await tx.store.clear();
  for (const memo of memos.map(normalizeCalendarMemo)) {
    await tx.store.put(memo);
  }
  await tx.done;
}

export async function addCalendarMemoIdb(memo: CalendarMemo): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.put(STORE_NAMES.calendarMemos, normalizeCalendarMemo(memo));
}

export async function updateCalendarMemoIdb(
  updated: CalendarMemo,
): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.put(STORE_NAMES.calendarMemos, normalizeCalendarMemo(updated));
}

export async function deleteCalendarMemoIdb(memoId: string): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.delete(STORE_NAMES.calendarMemos, memoId);
}

export async function clearCalendarMemosIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.calendarMemos);
}

export async function deleteProjectDb(id: string): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(
    [STORE_NAMES.projects, STORE_NAMES.referenceImages],
    "readwrite",
  );
  await tx.objectStore(STORE_NAMES.projects).delete(id);
  // プロジェクトに紐づく参考画像も一緒に消す
  const refIndex = tx.objectStore(STORE_NAMES.referenceImages).index("by-projectId");
  for (const key of await refIndex.getAllKeys(id)) {
    await tx.objectStore(STORE_NAMES.referenceImages).delete(key);
  }
  await tx.done;
}


// ===== Day Schedules =====
export async function loadDaySchedulesIdb(): Promise<DaySchedule[]> {
  const db = await dbPromise;
  if (!db) return [];
  const items = await db.getAll(STORE_NAMES.daySchedules);
  return items
    .map(normalizeDaySchedule)
    .filter((s: DaySchedule) => s.date && s.title);
}

export async function saveDaySchedulesIdb(
  schedules: DaySchedule[],
): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(STORE_NAMES.daySchedules, "readwrite");
  await tx.store.clear();
  for (const schedule of schedules.map(normalizeDaySchedule)) {
    await tx.store.put(schedule);
  }
  await tx.done;
}

export async function addDayScheduleIdb(schedule: DaySchedule): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.put(STORE_NAMES.daySchedules, normalizeDaySchedule(schedule));
}

export async function updateDayScheduleIdb(
  updated: DaySchedule,
): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.put(STORE_NAMES.daySchedules, normalizeDaySchedule(updated));
}

export async function deleteDayScheduleIdb(scheduleId: string): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.delete(STORE_NAMES.daySchedules, scheduleId);
}

export async function clearDaySchedulesIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.daySchedules);
}

// ===== User Profile (追加) =====
export async function loadUserProfileIdb(): Promise<User> {
  const db = await dbPromise;
  if (!db) return initialuUser;
  const user = await db.get(STORE_NAMES.userProfile, CURRENT_USER_KEY);
  return user ? normalizeUserProfile(user) : initialuUser;
}

export async function saveUserProfileIdb(user: User): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const normalized = normalizeUserProfile({
    ...user,
    id: CURRENT_USER_KEY, // キーを固定して保存
  });
  await db.put(STORE_NAMES.userProfile, normalized);
}

export async function clearUserProfileIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.userProfile);
}

// ===== Project Reference Images =====
// 上限枚数を超えて追加しようとしたときのエラー
export class ReferenceImageLimitError extends Error {
  constructor() {
    super(`参考画像は 1 プロジェクトにつき最大 ${MAX_REFERENCE_IMAGES_PER_PROJECT} 枚までです`);
    this.name = "ReferenceImageLimitError";
  }
}

// プロジェクトの参考画像を古い順に取得
export async function loadReferenceImagesIdb(
  projectId: string,
): Promise<ProjectReferenceImage[]> {
  const db = await dbPromise;
  if (!db) return [];
  const items = await db.getAllFromIndex(
    STORE_NAMES.referenceImages,
    "by-projectId",
    projectId,
  );
  return items.sort((a, b) => a.createdAt - b.createdAt);
}

// プロジェクトの参考画像の枚数
export async function countReferenceImagesIdb(projectId: string): Promise<number> {
  const db = await dbPromise;
  if (!db) return 0;
  return db.countFromIndex(STORE_NAMES.referenceImages, "by-projectId", projectId);
}

/**
 * 参考画像を圧縮して追加する
 * - 上限枚数に達している場合は ReferenceImageLimitError を投げる
 * - 圧縮（非同期の DOM 処理）はトランザクション外で先に行う
 *   （IDB のトランザクションは IDB 以外の await を挟むと自動で閉じてしまうため）
 */
export async function addReferenceImageIdb(
  projectId: string,
  file: File,
  // 楽観的 UI 更新で先に表示した仮データと同じ ID で保存したいときに渡す
  id: string = crypto.randomUUID(),
): Promise<ProjectReferenceImage> {
  const db = await dbPromise;
  if (!db) throw new Error("IndexedDB が利用できません");

  // 圧縮前に枚数を確認して、無駄な圧縮処理を避ける
  if ((await countReferenceImagesIdb(projectId)) >= MAX_REFERENCE_IMAGES_PER_PROJECT) {
    throw new ReferenceImageLimitError();
  }

  const compressed = await compressImage(file);
  const image: ProjectReferenceImage = {
    id,
    projectId,
    name: compressed.name,
    type: compressed.type,
    size: compressed.size,
    blob: compressed,
    createdAt: Date.now(),
  };

  // 圧縮中に別タブなどから追加された場合に備えて、書き込みと同じトランザクションで再確認する
  const tx = db.transaction(STORE_NAMES.referenceImages, "readwrite");
  const count = await tx.store.index("by-projectId").count(projectId);
  if (count >= MAX_REFERENCE_IMAGES_PER_PROJECT) {
    tx.abort();
    await tx.done.catch(() => {});
    throw new ReferenceImageLimitError();
  }
  await tx.store.put(image);
  await tx.done;

  return image;
}

export async function deleteReferenceImageIdb(imageId: string): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.delete(STORE_NAMES.referenceImages, imageId);
}

export async function clearReferenceImagesIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  await db.clear(STORE_NAMES.referenceImages);
}

// ===== Global Reset =====
export async function clearAllStorageIdb(): Promise<void> {
  const db = await dbPromise;
  if (!db) return;
  const tx = db.transaction(
    [
      STORE_NAMES.projects,
      STORE_NAMES.sessions,
      STORE_NAMES.commits,
      STORE_NAMES.calendarMemos,
      STORE_NAMES.daySchedules,
      STORE_NAMES.userProfile, // 追加
      STORE_NAMES.referenceImages,
    ],
    "readwrite",
  );

  await tx.objectStore(STORE_NAMES.projects).clear();
  await tx.objectStore(STORE_NAMES.sessions).clear();
  await tx.objectStore(STORE_NAMES.commits).clear();
  await tx.objectStore(STORE_NAMES.calendarMemos).clear();
  await tx.objectStore(STORE_NAMES.daySchedules).clear();
  await tx.objectStore(STORE_NAMES.userProfile).clear(); // 追加
  await tx.objectStore(STORE_NAMES.referenceImages).clear();

  await tx.done;
}