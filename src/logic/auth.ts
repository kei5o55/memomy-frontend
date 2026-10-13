// src/logic/auth.ts
// API モードの JWT 認証。トークンは localStorage に保存し、apiFetch で全リクエストに付与する

import { BASE_URL } from "./url";

const TOKEN_KEY = "memomy_auth_token";
const LOGIN_PATH = "/login";

// ===== トークンの保存・取得（プライベートブラウズ等で localStorage が使えない場合は無視） =====
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // 保存できなくてもログイン処理自体は続ける
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // 何もしない
  }
}

// レスポンスの Authorization ヘッダー（"Bearer xxx"）からトークンを取り出して保存
function saveTokenFromResponse(res: Response): boolean {
  const token = res.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return false;
  saveToken(token);
  return true;
}

function redirectToLogin() {
  // IndexedDB モードにはログイン画面がないので遷移しない
  if (process.env.NEXT_PUBLIC_API_MODE !== "true") return;
  if (typeof window === "undefined") return;
  if (window.location.pathname === LOGIN_PATH) return;
  window.location.assign(LOGIN_PATH);
}

/**
 * fetch のラッパー。保存済みのトークンを Authorization ヘッダーに付与する。
 * 401 が返ったらトークンを破棄してログイン画面へ移動する（期限切れ・ログアウト済みのトークン）
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(input, { ...init, headers });

  if (res.status === 401) {
    clearToken();
    redirectToLogin();
  }
  return res;
}

export type AuthResult = { ok: true } | { ok: false; error: string };

// ===== ログイン / 新規登録 / ログアウト =====
export async function login(email: string, password: string): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email, password } }),
    });

    if (!res.ok) {
      return { ok: false, error: "メールアドレスまたはパスワードが違います" };
    }
    if (!saveTokenFromResponse(res)) {
      return { ok: false, error: "トークンを受け取れませんでした" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Login failed:", error);
    return { ok: false, error: "サーバーとの通信に失敗しました" };
  }
}

export type SignupInput = {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
};

export async function signup(input: SignupInput): Promise<AuthResult> {
  try {
    const res = await fetch(`${BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: input }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      const errors: string[] = data?.status?.errors ?? [];
      return { ok: false, error: errors.join(" / ") || "登録に失敗しました" };
    }
    if (!saveTokenFromResponse(res)) {
      return { ok: false, error: "トークンを受け取れませんでした" };
    }
    return { ok: true };
  } catch (error) {
    console.error("Signup failed:", error);
    return { ok: false, error: "サーバーとの通信に失敗しました" };
  }
}

// サーバー側で jti を更新してトークンを失効させる。通信に失敗してもローカルのトークンは破棄する
export async function logout(): Promise<void> {
  const token = getToken();
  try {
    if (token) {
      await fetch(`${BASE_URL}/logout`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } catch (error) {
    console.error("Logout failed:", error);
  } finally {
    clearToken();
  }
}
