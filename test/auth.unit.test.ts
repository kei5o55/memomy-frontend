import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { apiFetch, clearToken, getToken, login, logout } from "@/logic/auth";

const TOKEN_KEY = "memomy_auth_token";

function mockFetch(response: Response) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("auth", () => {
  beforeEach(() => {
    clearToken();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("apiFetch は保存済みトークンを Authorization ヘッダーに付ける", async () => {
    localStorage.setItem(TOKEN_KEY, "abc");
    const fetchMock = mockFetch(new Response("[]", { status: 200 }));

    await apiFetch("http://api.test/projects", { headers: { "Content-Type": "application/json" } });

    const headers = fetchMock.mock.calls[0][1].headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer abc");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  test("apiFetch は 401 を受けるとトークンを破棄する", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    mockFetch(new Response(null, { status: 401 }));

    const res = await apiFetch("http://api.test/projects");

    expect(res.status).toBe(401);
    expect(getToken()).toBeNull();
  });

  test("IndexedDB モードでは 401 を受けてもログイン画面へ遷移しない", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "false");
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, pathname: "/", assign });
    mockFetch(new Response(null, { status: 401 }));

    await apiFetch("http://api.test/projects");

    expect(assign).not.toHaveBeenCalled();
  });

  test("API モードでは 401 を受けるとログイン画面へ遷移する", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_MODE", "true");
    const assign = vi.fn();
    vi.stubGlobal("location", { ...window.location, pathname: "/", assign });
    mockFetch(new Response(null, { status: 401 }));

    await apiFetch("http://api.test/projects");

    expect(assign).toHaveBeenCalledWith("/login");
  });

  test("login 成功時はレスポンスヘッダーのトークンを保存する", async () => {
    mockFetch(new Response("{}", { status: 200, headers: { Authorization: "Bearer new-token" } }));

    const result = await login("a@example.com", "password123");

    expect(result.ok).toBe(true);
    expect(getToken()).toBe("new-token");
  });

  test("login 失敗時はトークンを保存しない", async () => {
    mockFetch(new Response("{}", { status: 401 }));

    const result = await login("a@example.com", "wrong");

    expect(result.ok).toBe(false);
    expect(getToken()).toBeNull();
  });

  test("logout は通信に失敗してもトークンを破棄する", async () => {
    localStorage.setItem(TOKEN_KEY, "abc");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    vi.spyOn(console, "error").mockImplementation(() => {});

    await logout();

    expect(getToken()).toBeNull();
  });
});
