import type { NewCommitInput, NewDayScheduleInput, NewProjectInput, NewCalendarMemoInput, UserProfileInput } from "./api-types";
import type { Project, Commit, DaySchedule, CalendarMemo, Summary, User } from "./types";
import type { ApiProjectRes, ApiUserProfileRes } from "./api-types";
import { BASE_URL, HOST_URL } from "./url";
import { readJson } from "./case";
import { apiFetch } from "./auth";

//const BASE_URL = 'http://localhost:3001/api/v1';


// キーの命名規則：送信時はフロントの camelCase のまま送り（Rails 側で snake_case に変換）、
// 受け取り時は readJson で snake_case → camelCase に変換する

//apifetch()内でトークンを検証し、未認証の場合は/loginへ遷移する処理
//よって、page.tsxにおけるuseeffectなどで/loginへ遷移されるよ

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

const toUserProfile = (item: ApiUserProfileRes): User => ({
  ...item,
  bio: item.bio ?? undefined,
  bgmUrl: item.bgmUrl ?? undefined,
  snsLinks: item.snsLinks ?? [],
  // 相対パスで返るので HOST_URL と結合して <img src> にそのまま使える形にする
  icon: item.icon ? `${HOST_URL}${item.icon}` : undefined,
  createdAt: new Date(item.createdAt).getTime(),
  updatedAt: new Date(item.updatedAt).getTime(),
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
    const response = await apiFetch(`${BASE_URL}/commits`);

    if (!response.ok) {
      throw new Error(`HTTPエラー! status: ${response.status}`);
    }

    const rawData = await readJson<Commit[]>(response);

    console.log("komittoパースデータ : ", rawData);

    const commits = rawData.map(toCommit);

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
    // ⭕️ durationMs の計算 & 追加（inputData にあればそれを優先、無ければ差分から算出）
    const durationMs = inputData.durationMs 
      ? inputData.durationMs 
      : new Date(inputData.endedAt).getTime() - new Date(inputData.startedAt).getTime();

    // FormData は文字列にする必要があるため String() に変換
    formData.append('commit[durationMs]', String(durationMs));

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

    const response = await apiFetch(`${BASE_URL}/projects/${inputData.projectId}/commits`, {
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
    const response = await apiFetch(`${BASE_URL}/commits/${id}`, {
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
    const response = await apiFetch(`${BASE_URL}/projects`);
    
    if (!response.ok) {
      throw new Error(`HTTPエラー! status: ${response.status}`);
    }
    console.log("projectのres:",response)

    const rawData = await readJson<ApiProjectRes[]>(response);

    console.log("projectのrawData:",rawData)

    return rawData.map(toProject);
  } catch (error) {
    console.error("エラー発生:", error);
    return [];
  }
};

// プロジェクトを新規作成する API
export const createProject = async (inputData: NewProjectInput): Promise<Project | null> => {
  try {
    const response = await apiFetch(`${BASE_URL}/projects`, {
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
    const response = await apiFetch(`${BASE_URL}/projects/${inputData.id}`,{
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
    const response = await apiFetch(`${BASE_URL}/projects/${id}`, {
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
    const response = await apiFetch(`${BASE_URL}/day_schedules`);

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
    const response = await apiFetch(`${BASE_URL}/day_schedules`, {
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
    
    const response = await apiFetch(`${BASE_URL}/calendar_memos`);
    
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
    const response = await apiFetch(`${BASE_URL}/day_schedules/${id}`,{
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
    const response = await apiFetch(`${BASE_URL}/calendar_memos`, {
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
    const response = await apiFetch(`${BASE_URL}/calendar_memos/${id}`, {
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

//Idごとにサマリを取得（他loadと一緒で、現在は全プロジェクトを参照。将来的にユーザ別）
export const allProjectSummary = async (): Promise<Summary[]> => {
  try{ 

    const response = await apiFetch(`${BASE_URL}/summary/project`);
    if(!response.ok){
      console.error(`httpエラー: ${response.status}`);
    };

    const rawData = await readJson<Summary[]>(response);
    console.log(`サマリパース後のデータ: `,rawData)

    return rawData;

  }catch(error){
    console.log("エラー：",error)
    return [];
  }
};

/*単体projectのサマリ集計（これ使わない説)
export const projectSummary = async (id:string): Promise<Summary | null> => {
  try{
    const response = await apiFetch(`${BASE_URL}/summary/project_id/${id}`);
    if(!response.ok){
      console.error(`httpエラー:${response.status}`);
    };

    const rawData = await readJson<Summary>(response);
    console.log(`サマリ後のデータ:`,rawData);

    return rawData;
  }catch(error){
    console.log("エラー：",error);
    return null;
  }
}*/

//将来的に作る予定ユーザ別のサマリ（totalStatusCardの部分での表示情報を全てバックエンドで）
/*export const userSummary = async ():Promise<UserSummary> =>{

};*/

// ===== ユーザープロフィール（ログイン中ユーザー自身） =====

// ユーザープロフィールを取得する API
export const loadUserProfile = async (): Promise<User | null> => {
  try {
    const response = await apiFetch(`${BASE_URL}/user_profile`);

    if (!response.ok) {
      console.error(`Userデータ取得エラー: status ${response.status}`);
      return null;
    }

    return toUserProfile(await readJson<ApiUserProfileRes>(response));
  } catch (error) {
    console.error("API通信エラー:", error);
    return null;
  }
};

// ユーザープロフィールを更新する API（送らなかった項目は変更されない）
export const updateUserProfile = async (inputData: UserProfileInput): Promise<User | null> => {
  try {
    const response = await apiFetch(`${BASE_URL}/user_profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userProfile: {
          name: inputData.name,
          bio: inputData.bio,
          bgmUrl: inputData.bgmUrl,
          snsLinks: inputData.snsLinks,
        },
      }),
    });

    const data = await readJson<ApiUserProfileRes & ApiError>(response);

    if (!response.ok) {
      alert(`プロフィールの更新に失敗しました:\n${toErrorMessage(data)}`);
      return null;
    }

    return toUserProfile(data);
  } catch (error) {
    console.error("API通信エラー:", error);
    alert("サーバーとの通信に失敗しました");
    return null;
  }
};

// アイコン画像をアップロードする API（既にアイコンがあれば差し替え）。更新後のプロフィールを返す
// multipart で送るため Content-Type は指定しない（ブラウザが boundary 付きで設定する）
export const uploadUserIcon = async (image: Blob, filename: string): Promise<User | null> => {
  try {
    const formData = new FormData();
    formData.append("userIcon[image]", image, filename);

    const response = await apiFetch(`${BASE_URL}/user_profile/icon`, {
      method: "PUT",
      body: formData,
    });

    const data = await readJson<ApiUserProfileRes & ApiError>(response);

    if (!response.ok) {
      alert(`アイコンの保存に失敗しました:\n${toErrorMessage(data)}`);
      return null;
    }

    return toUserProfile(data);
  } catch (error) {
    console.error("API通信エラー:", error);
    alert("サーバーとの通信に失敗しました");
    return null;
  }
};

// アイコン画像を削除する API（アイコンが無い場合も成功扱い）
export const deleteUserIcon = async (): Promise<boolean> => {
  try {
    const response = await apiFetch(`${BASE_URL}/user_profile/icon`, {
      method: "DELETE",
    });

    if (!response.ok) {
      console.error(`アイコン削除失敗: ${response.status} ${response.statusText}`);
      alert("アイコンの削除に失敗しました");
      return false;
    }

    return true;
  } catch (error) {
    console.error("API通信エラー:", error);
    alert("サーバーとの通信に失敗しました");
    return false;
  }
};
