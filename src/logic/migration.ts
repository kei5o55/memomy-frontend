// logic/migration.ts
import { loadCommitsIdb, loadProjectsIdb } from "./storage-idb";
import { readJson } from "./case";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export interface MigrationResult {
  success: boolean;
  importedProjectsCount: number;
  importedCommitsCount: number;
  error?: string;
}

function toIsoString(val: number | string | Date | undefined | null): string | null {
  if (!val) return null;
  const date = new Date(val);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

/**
 * IndexedDB のデータを JSON 形式に変換し、Rails バックエンドへ一括送信する
 */
export async function migrateIdbToPostgres(): Promise<MigrationResult> {
  try {
    const [projects, commits] = await Promise.all([
      loadProjectsIdb(),
      loadCommitsIdb(),
    ]);

    if (projects.length === 0 && commits.length === 0) {
      return { success: true, importedProjectsCount: 0, importedCommitsCount: 0 };
    }

    // 画像 (Blob) を Base64 形式に変換してペイロードに含める処理
    const serializedCommits = await Promise.all(
      commits.map(async (commit) => {
        let imageBase64: string | null = null;

        if (commit.image?.blob instanceof Blob) {
          imageBase64 = await blobToBase64(commit.image.blob);
        }

        return {
          id: commit.id,
          projectId: commit.projectId,
          durationMs: commit.durationMs,
          // 💡 数値を ISO 8601 文字列に変換
          endedAt: toIsoString(commit.endedAt),
          note: commit.note || null,
          imageBase64,
        };
      })
    );

    const payload = {
        projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        memo: p.memo || null,
        pomodoroWorkMinutes: p.pomodoroWorkMinutes ?? null,
        pomodoroBreakMinutes: p.pomodoroBreakMinutes ?? null,
        // 💡 数値を ISO 8601 文字列に変換
        createdAt: toIsoString(p.createdAt) || new Date().toISOString(),
        })),
        commits: serializedCommits,
    };

    const res = await fetch(`${BASE_URL}/api/v1/sync/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `HTTP Error: ${res.status}`);
    }

    const data = await readJson<{ importedProjectsCount: number; importedCommitsCount: number }>(res);
    return {
      success: true,
      importedProjectsCount: data.importedProjectsCount,
      importedCommitsCount: data.importedCommitsCount,
    };
  } catch (err: unknown) {
    console.error("Migration failed:", err);
    return {
      success: false,
      importedProjectsCount: 0,
      importedCommitsCount: 0,
      //error: err.message || "未知のエラーが発生しました",
    };
  }
}

// Blob を Base64 文字列に変換するヘルパー関数
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // "data:image/png;base64,..." から Base64 本体部分を取り出す場合は調整
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}