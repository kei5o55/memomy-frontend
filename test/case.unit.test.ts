import { describe, expect, test } from "vitest";
import { keysToCamel, readJson } from "@/logic/case";

describe("keysToCamel", () => {
  test("ネストしたオブジェクト・配列のキーを camelCase に変換する", () => {
    const input = {
      project_id: "p1",
      started_at: "2026-08-28T10:00:00.000Z",
      image_base64: null,
      day_schedules: [{ start_hour: 10, end_minute: 30 }],
      errors: ["name_is_blank"],
    };

    expect(keysToCamel(input)).toEqual({
      projectId: "p1",
      startedAt: "2026-08-28T10:00:00.000Z",
      imageBase64: null,
      daySchedules: [{ startHour: 10, endMinute: 30 }],
      errors: ["name_is_blank"], // 値は変換しない
    });
  });

  test("camelCase のキーやプリミティブはそのまま", () => {
    expect(keysToCamel({ durationMs: 1, note: "a" })).toEqual({ durationMs: 1, note: "a" });
    expect(keysToCamel("snake_value")).toBe("snake_value");
    expect(keysToCamel(null)).toBeNull();
  });
});

test("readJson はレスポンスのキーを camelCase に変換する", async () => {
  const response = new Response(JSON.stringify({ imported_projects_count: 2 }));
  expect(await readJson(response)).toEqual({ importedProjectsCount: 2 });
});
