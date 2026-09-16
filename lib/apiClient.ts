// lib/apiClient.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';
const STORAGE_KEY = 'app_basic_auth';

// 保存されている Basic 認証用のヘッダーを取得
export function getAuthHeader(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const authCredentials = localStorage.getItem(STORAGE_KEY);
  if (!authCredentials) return {};
  return { Authorization: `Basic ${authCredentials}` };
}

// 資格情報を保存
export function saveAuthCredentials(user: string, pass: string) {
  const credentials = btoa(`${user}:${pass}`);
  localStorage.setItem(STORAGE_KEY, credentials);
}

// 資格情報を削除（ログアウト）
export function clearAuthCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

// API ヘルスチェック 兼 認証検証関数
export async function checkApiHealth(customAuth?: string): Promise<boolean> {
  if (!API_BASE_URL) return false;

  const authHeader = customAuth
    ? { Authorization: `Basic ${customAuth}` }
    : getAuthHeader();

  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
      method: 'GET',
      headers: {
        ...authHeader,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    return res.ok; // 200 OK なら認証成功
  } catch (error) {
    console.warn('API Health Check failed:', error);
    return false;
  }
}