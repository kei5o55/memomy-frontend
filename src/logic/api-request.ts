import type { NewCommitInput, NewDayScheduleInput, NewProjectInput, NewCalendarMemoInput, NewUserProfile } from "./api-types";
import type { Project, Commit, DaySchedule, CalendarMemo, User  } from "./types";
import type { ApiProjectRes } from "./api-types";
import { BASE_URL } from "./url";
import { readJson } from "./case";

//const BASE_URL = 'http://localhost:3001/api/v1';


// キーの命名規則：送信時はフロントの camelCase のまま送り（Rails 側で snake_case に変換）、
// 受け取り時は readJson で snake_case → camelCase に変換する


// ISO文字列 (または数値) の日時をミリ秒数値に揃える
const toCommit = (item: Commit): Commit => {
  const startedAtMs = typeof item.startedAt === 'number'
    ? item.startedAt
    : new Date(item.startedAt).getTime();

  const endedAtMs = typeof item.endedAt === 'number'
    ? item.endedAt
    : new Date(item.endedAt).getTime();

  // durationMs が null / NaN / undefined の場合は、ミリ秒の差分から自動計算
  const computedDuration =
    typeof item.durationMs === 'number' && !isNaN(item.durationMs)
      ? item.durationMs
      : endedAtMs - startedAtMs;

  return {
    ...item,
    startedAt: startedAtMs,
    endedAt: endedAtMs,
    durationMs: computedDuration,
    image: item.image ?? null,
  };
};

const toProject = (item: ApiProjectRes): Project => ({
  ...item,
  dueDate: item.dueDate ?? undefined,
  memo: item.memo ?? undefined,
  createdAt: new Date(item.createdAt).getTime(),
});

type ApiError = { errors?: string[]; error?: string; message?: string };

// エラーレスポンスからメッセージを組み立てる
const toErrorMessage = (data: ApiError): string =>
  Array.isArray(data.errors)
    ? data.errors.join('\n')
    : data.error || data.message || "予期せぬエラーが発生しました";


// コミットを取得する API
export const loadCommits = async (): Promise<Commit[]> => {
  try {
    console.log(BASE_URL);
    const response = await fetch(`${BASE_URL}/commits`);

    if (!response.ok) {
      throw new Error(`HTTPエラー! status: ${response.status}`);
    }

    const rawData = await readJson<Commit[]>(response);

    console.log("送られたデータ : ", rawData);

    const commits = rawData.map(toCommit);

    console.log("取得データ: ", commits);

    return commits;
  } catch (error) {
    console.error("コミット一覧の取得に失敗しました:", error);
    return [];
  }
};

export const createCommit = async (inputData: NewCommitInput): Promise<Commit | null> => {
  try {
    const formData = new FormData();

    formData.append('commit[projectId]', inputData.projectId);
    // ⭕️ 数値(ミリ秒)を ISO 8601 文字列 ("2026-09-09T10:00:00.000Z") に変換
    const startedAtIso = new Date(inputData.startedAt).toISOString();
    const endedAtIso = new Date(inputData.endedAt).toISOString();

    formData.append('commit[startedAt]', startedAtIso);
    formData.append('commit[endedAt]', endedAtIso);

    if (inputData.note) {
      formData.append('commit[note]', inputData.note);
    }

    if (inputData.image?.blob) {
      formData.append('commit[image]', inputData.image.blob, inputData.image.name);
    }

    console.log("送信する FormData の中身:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const response = await fetch(`${BASE_URL}/projects/${inputData.projectId}/commits`, {
      method: 'POST',
      body: formData,
    });

    const data = await readJson<Commit & ApiError>(response);

    if (!response.ok) {
      alert(`作成に失敗しました:\n${data.errors?.join('\n')}`);
      return null;
    }

    return toCommit(data);
  } catch (error) {
    console.error('通信エラー:', error);
    return null;
  }
};

export const deleteCommit = async (id:string): Promise<boolean> =>{
    try {
    const response = await fetch(`${BASE_URL}/commits/${id}`, {
      method: "DELETE", 
    });

    if (!response.ok) {
      console.error(`削除失敗: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ネットワークエラー！:", error);
    return false;
  }
}

// プロジェクトを取得する API
export const loadProjects = async (): Promise<Project[]> => {
  try {
    const response = await fetch(`${BASE_URL}/projects`);
    
    if (!response.ok) {
      throw new Error(`HTTPエラー! status: ${response.status}`);
    }

    const rawData = await readJson<ApiProjectRes[]>(response);

    return rawData.map(toProject);
  } catch (error) {
    console.error("エラー発生:", error);
    return [];
  }
};

// プロジェクトを新規作成する API
export const createProject = async (inputData: NewProjectInput): Promise<Project | null> => {
  try {
    const response = await fetch(`${BASE_URL}/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: { ...inputData, completed: false },
      }),
    });

    const data = await readJson<ApiProjectRes & ApiError>(response);

    if (!response.ok) {
      alert(`作成に失敗しました:\n${toErrorMessage(data)}`);
      return null;
    }

    return toProject(data);
  } catch (error) {
    console.error('通信エラー:', error);
    alert('サーバーとの通信に失敗しました');
    return null;
  }
};

export const updateProject = async (inputData:Project): Promise<Project | null> =>{
  try{
    const response = await fetch(`${BASE_URL}/projects/${inputData.id}`,{
      method:"PATCH",
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: {
          name: inputData.name,
          dueDate: inputData.dueDate,
          completed: inputData.completed ?? false,
          memo: inputData.memo,
          targetHours: inputData.targetHours,
          pomodoroWorkMinutes: inputData.pomodoroWorkMinutes,
          pomodoroBreakMinutes: inputData.pomodoroBreakMinutes,
        },
      }),
    });

    if (!response.ok) {
      console.error("Project update failed:", response.status, response.statusText);
      return null;
    }

    // 💡 成功時はレスポンスの JSON データを返す
    return toProject(await readJson<ApiProjectRes>(response));
  } catch (error) {
    console.error("Error in updateProject:", error);
    return null;
  }
};

export const deleteProject = async (id:string): Promise<boolean> => {
    try {
    const response = await fetch(`${BASE_URL}/projects/${id}`, {
      method: "DELETE", 
    });

    if (!response.ok) {
      console.error(`削除失敗: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ネットワークエラー！:", error);
    return false;
  }
}

export const loadDaySchedules = async (): Promise<DaySchedule[]> => {
  try {
    const response = await fetch(`${BASE_URL}/day_schedules`);

    if (!response.ok) {
      throw new Error(`httpエラー status: ${response.status}`);
    }

    return await readJson<DaySchedule[]>(response);
  } catch (error) {
    console.error("error ： ", error);
    return [];
  }
};

export const createDaySchedule = async (inputData: NewDayScheduleInput): Promise<DaySchedule | null> => {
  try {
    const response = await fetch(`${BASE_URL}/day_schedules`, {
      method: `POST`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        daySchedule: inputData,
      }),
    });

    const data = await readJson<DaySchedule & ApiError>(response);

    if (!response.ok) {
      alert(`作成に失敗しました:\n${toErrorMessage(data)}`);
      return null;
    }

    return data;
  } catch (error) {
    console.error("API通信エラー:", error);
    return null;
  }
};

export const loadCalendarMemos = async (): Promise<CalendarMemo[]> => {
  try {
    
    const response = await fetch(`${BASE_URL}/calendar_memos`);
    
    if (!response.ok) {
      throw new Error(`エラー: status: ${response.status}`);
    }

    return await readJson<CalendarMemo[]>(response);
  } catch (error) {
    console.error("error: ", error);
    return [];
  }
};

export const deleteDaySchedule = async (id:string): Promise<boolean> =>{
  try{
    const response = await fetch(`${BASE_URL}/day_schedules/${id}`,{
      method: "DELETE",
    });

    if(!response.ok){
       console.error(`削除失敗: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ネットワークエラー！:", error);
    return false;
  }
};

export const createCalendarMemo = async (inputData: NewCalendarMemoInput): Promise<CalendarMemo | null> => {
  try {
    const response = await fetch(`${BASE_URL}/calendar_memos`, {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        calendarMemo: inputData,
      }),
    });

    const data = await readJson<CalendarMemo & ApiError>(response);

    if (!response.ok) {
      alert(`作成に失敗しました:\n${toErrorMessage(data)}`);
      return null;
    }

    return data;

  } catch (error) {
    console.error("API通信エラー:", error);
    return null;
  }
};

export const deleteCalendarMemo = async (id: string): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}/calendar_memos/${id}`, {
      method: "DELETE", 
    });

    if (!response.ok) {
      console.error(`削除失敗: ${response.status} ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("ネットワークエラー！:", error);
    return false;
  }
};


/*
export const createUser = async(inputData: NewUserProfile):Promise<User | null> => {//初期登録時の
  try{
    const response =await fetch(`${BASE_URL}/user_profile`);

    if(!response.ok){
      console.log(`Userデータ取得エラー :status${response.status}`);
    }
    return null;
  }catch(error){
    console.error("API通信エラー:", error);
    return null;
  }
}

export const loadUserProfile = async ():Promise<User | null>=>{//ログイン成功時などの処理かも
  try{
    const response =await fetch(`${BASE_URL}/user_profile`);

    if(!response.ok){
      console.log(`Userデータ取得エラー :status${response.status}`);
    }
    return null;
  }catch(error){
    console.error("API通信エラー:", error);
    return null;//nullが帰ると上手く言ってないってコト
  }
};

export const updateUserProfile = async (inputData:User): Promise<User | null>=>{//ユーザ情報更新のリクエスト
  try{
    const response =await fetch(`${BASE_URL}/user_profile`);
    return null;
  }catch(error){
    console.error("API通信エラー:", error);
    return null;
  }
}*/