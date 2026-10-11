import type { CalendarMemo, Commit, DaySchedule, Project,User } from "./types";

export type NewProjectInput = Omit<Project,"id" | "createdAt" | "completed">


//rails側で一意のuuidを付けるため、インプットはid無しで作る
//更新時はもとのtypesからインポートでおｋ（その場合、idもjsonから受け取ったものを適応してやる）


export type NewCommitInput = Omit<Commit, 'id' | 'durationMs'>;

export type NewDayScheduleInput= Omit<DaySchedule, 'id'>;

export type NewCalendarMemoInput= Omit<CalendarMemo,'id' | 'createdAt'>;

export type NewUserProfile = Omit<User,`id`|`icon`|`ionBlob`|`bio`|`bgmUrl`|`snsUrl`|`badges`|`createdAt`|`updatedAt`>;


// API レスポンス（受け取り時に camelCase へ変換済み）のうち、フロントの型と値の形が異なるもの
export type ApiProjectRes = Omit<Project, "dueDate" | "memo" | "createdAt"> & {
  dueDate: string | null;
  memo: string | null;
  createdAt: string; // ISO 8601
};
