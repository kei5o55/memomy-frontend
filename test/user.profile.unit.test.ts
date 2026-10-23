import { afterEach, describe, expect, test, vi } from "vitest";
import { deleteUserIcon, loadUserProfile, updateUserProfile, uploadUserIcon } from "@/logic/api-request";

// Rails からのレスポンス（snake_case のまま）
const railsProfile = {
  id: 123456789,
  name: "自分",
  bio: null,
  bgm_url: "https://example.com/bgm",
  sns_links: ["https://x.com/foo"],
  icon: null,
  created_at: "2026-10-01T00:00:00.000Z",
  updated_at: "2026-10-02T00:00:00.000Z",
};

function mockFetch(body: unknown, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } })
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("user profile API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("loadUserProfile", () => {
    test("レスポンスを User 型（camelCase・ミリ秒・null→undefined）に変換する", async () => {
      mockFetch(railsProfile);

      const user = await loadUserProfile();

      expect(user).toEqual({
        id: 123456789,
        name: "自分",
        bio: undefined,
        bgmUrl: "https://example.com/bgm",
        snsLinks: ["https://x.com/foo"],
        icon: undefined,
        createdAt: Date.parse("2026-10-01T00:00:00.000Z"),
        updatedAt: Date.parse("2026-10-02T00:00:00.000Z"),
      });
    });

    test("sns_links が null なら空配列にする", async () => {
      mockFetch({ ...railsProfile, sns_links: null });

      const user = await loadUserProfile();

      expect(user?.snsLinks).toEqual([]);
    });

    test("icon の相対パスは HOST_URL と結合した URL にする", async () => {
      mockFetch({ ...railsProfile, icon: "/rails/active_storage/blobs/icon.png" });

      const user = await loadUserProfile();

      expect(user?.icon).toMatch(/\/rails\/active_storage\/blobs\/icon\.png$/);
    });

    test("GET /user_profile を呼ぶ", async () => {
      const fetchMock = mockFetch(railsProfile);

      await loadUserProfile();

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/api\/v1\/user_profile$/);
      expect(init.method ?? "GET").toBe("GET");
    });

    test("失敗時は null を返す", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({}, 500);

      expect(await loadUserProfile()).toBeNull();
    });

    test("通信エラー時は null を返す", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      expect(await loadUserProfile()).toBeNull();
    });
  });

  describe("updateUserProfile", () => {
    test("userProfile をルートキーにして camelCase で PATCH する", async () => {
      const fetchMock = mockFetch({ ...railsProfile, name: "新しい名前" });

      const user = await updateUserProfile({
        name: "新しい名前",
        bio: "自己紹介",
        bgmUrl: "https://example.com/bgm",
        snsLinks: ["https://x.com/foo"],
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/api\/v1\/user_profile$/);
      expect(init.method).toBe("PATCH");
      expect(JSON.parse(init.body)).toEqual({
        userProfile: {
          name: "新しい名前",
          bio: "自己紹介",
          bgmUrl: "https://example.com/bgm",
          snsLinks: ["https://x.com/foo"],
        },
      });
      expect(user?.name).toBe("新しい名前");
    });

    test("snsLinks の空配列はそのまま送る（リンクの全削除）", async () => {
      const fetchMock = mockFetch({ ...railsProfile, sns_links: [] });

      await updateUserProfile({ name: "自分", snsLinks: [] });

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.userProfile.snsLinks).toEqual([]);
    });

    test("バリデーションエラー時は null を返しメッセージを表示する", async () => {
      const alertMock = vi.fn();
      vi.stubGlobal("alert", alertMock);
      mockFetch({ errors: ["Name can't be blank"] }, 422);

      const user = await updateUserProfile({ name: "" });

      expect(user).toBeNull();
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("Name can't be blank"));
    });

    test("通信エラー時は null を返す", async () => {
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      expect(await updateUserProfile({ name: "自分" })).toBeNull();
    });
  });
  describe("uploadUserIcon", () => {
    const png = new Blob(["png"], { type: "image/png" });

    test("FormData の userIcon[image] にファイルを入れて PUT する", async () => {
      const fetchMock = mockFetch({ ...railsProfile, icon: "/rails/active_storage/blobs/icon.png" });

      await uploadUserIcon(png, "icon.png");

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/api\/v1\/user_profile\/icon$/);
      expect(init.method).toBe("PUT");
      expect(init.body).toBeInstanceOf(FormData);
      const file = (init.body as FormData).get("userIcon[image]") as File;
      expect(file.name).toBe("icon.png");
      expect(file.type).toBe("image/png");
      // multipart の boundary はブラウザに付けさせるため、Content-Type は指定しない
      expect(new Headers(init.headers).has("Content-Type")).toBe(false);
    });

    test("更新後のプロフィールを返し、icon は HOST_URL と結合した URL になる", async () => {
      mockFetch({ ...railsProfile, icon: "/rails/active_storage/blobs/icon.png" });

      const user = await uploadUserIcon(png, "icon.png");

      expect(user?.name).toBe("自分");
      expect(user?.icon).toMatch(/\/rails\/active_storage\/blobs\/icon\.png$/);
    });

    test("バリデーションエラー時は null を返しメッセージを表示する", async () => {
      const alertMock = vi.fn();
      vi.stubGlobal("alert", alertMock);
      mockFetch({ errors: ["Image は 2MB 以下にしてください"] }, 422);

      expect(await uploadUserIcon(png, "icon.png")).toBeNull();
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("Image は 2MB 以下にしてください"));
    });

    test("通信エラー時は null を返す", async () => {
      vi.stubGlobal("alert", vi.fn());
      vi.spyOn(console, "error").mockImplementation(() => {});
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));

      expect(await uploadUserIcon(png, "icon.png")).toBeNull();
    });
  });

  describe("deleteUserIcon", () => {
    test("DELETE /user_profile/icon を呼び、204 なら true を返す", async () => {
      const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
      vi.stubGlobal("fetch", fetchMock);

      expect(await deleteUserIcon()).toBe(true);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(/\/api\/v1\/user_profile\/icon$/);
      expect(init.method).toBe("DELETE");
    });

    test("失敗時は false を返しメッセージを表示する", async () => {
      const alertMock = vi.fn();
      vi.stubGlobal("alert", alertMock);
      vi.spyOn(console, "error").mockImplementation(() => {});
      mockFetch({}, 500);

      expect(await deleteUserIcon()).toBe(false);
      expect(alertMock).toHaveBeenCalled();
    });
  });
});
