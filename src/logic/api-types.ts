import type { CalendarMemo, Commit, DaySchedule, Project,User } from "./types";

export type NewProjectInput = Omit<Project,"id" | "createdAt" | "completed">


//rails側で一意のuuidを付けるため、インプットはid無しで作る
//更新時はもとのtypesからインポートでおｋ（その場合、idもjsonから受け取ったものを適応してやる）


export type NewCommitInput = Omit<Commit, 'id'>;

export type NewDayScheduleInput= Omit<DaySchedule, 'id'>;

export type NewCalendarMemoInput= Omit<CalendarMemo,'id' | 'createdAt'>;

export type NewUserProfile = Omit<User,`id`|`icon`|`iconBlob`|`bio`|`bgmUrl`|`snsLinks`|`badges`|`createdAt`|`updatedAt`>;


// プロフィール更新（PATCH /user_profile）で送る内容。アイコンは multipart の uploadUserIcon で別に送る
export type UserProfileInput = Pick<User, "name" | "bio" | "bgmUrl" | "snsLinks">;


// API レスポンス（受け取り時に camelCase へ変換済み）のうち、フロントの型と値の形が異なるもの
export type ApiProjectRes = Omit<Project, "dueDate" | "memo" | "createdAt"> & {
  dueDate: string | null;
  memo: string | null;
  createdAt: string; // ISO 8601
};

export type ApiUserProfileRes = {
  id: number;
  name: string;
  bio: string | null;
  bgmUrl: string | null;
  snsLinks: string[] | null;
  icon: string | null; // Active Storage の相対パス（/rails/active_storage/...）
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
};
