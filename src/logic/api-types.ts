import type { CalendarMemo, Commit, DaySchedule, Project } from "./types";

export type NewProjectInput = Omit<Project,"id" | "createdAt" | "completed">


//rails側で一意のuuidを付けるため、インプットはid無しで作る
//更新時はもとのtypesからインポートでおｋ（その場合、idもjsonから受け取ったものを適応してやる）


export type NewCommitInput = Omit<Commit, 'id' | 'durationMs'>;

export type NewDayScheduleInput= Omit<DaySchedule, 'id'>;

export type NewCalendarMemoInput= Omit<CalendarMemo,'id' | 'createdAt'>;

export type ApiDayScheduleRes = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  start_hour: number; // 0~23
  start_minute: number;
  end_hour: number;
  end_minute: number;
}

export type ApiProjectResponse = {
  id: string;
  name: string;
  due_date: string | null;
  memo: string | null;
  created_at: string;
  target_hours?: number;
  pomodoro_work_minutes?: number;
  pomodoro_break_minutes?: number;
  completed: boolean;
};

export type ApiCalendarMemosRes ={
    id: string,
    date: string,
    text: string,
    created_at: number
}


