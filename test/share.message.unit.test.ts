import { describe, expect, test } from "vitest";
import {
  buildDailyShareText,
  buildDailySummary,
  buildXIntentUrl,
  formatDurationJa,
  toDateKey,
} from "@/logic/shareMessage";
import type { Commit, Project } from "@/logic/types";

// ローカル時刻で日時を作る（テスト実行環境のタイムゾーンに依存しないように）
const at = (y: number, mo: number, d: number, h = 12) => new Date(y, mo - 1, d, h).getTime();
const MIN = 60 * 1000;

const projects: Project[] = [
  { id: "p1", name: "COMITIA新刊", createdAt: 0, completed: false },
  { id: "p2", name: "イラスト練習", createdAt: 0, completed: false },
];

const commit = (id: string, projectId: string, startedAt: number, durationMs: number): Commit => ({
  id,
  projectId,
  startedAt,
  endedAt: startedAt + durationMs,
  durationMs,
});

describe("shareMessage", () => {
  test("toDateKey はローカル時刻の YYYY-MM-DD を返す", () => {
    expect(toDateKey(at(2026, 3, 5))).toBe("2026-03-05");
  });

  test.each([
    [0, "0分"],
    [15 * MIN, "15分"],
    [135 * MIN, "2時間15分"],
    [60 * MIN, "1時間0分"],
  ])("formatDurationJa(%i) は %s", (ms, expected) => {
    expect(formatDurationJa(ms)).toBe(expected);
  });

  describe("buildDailySummary", () => {
    test("指定日のコミットだけをプロジェクトごとに集計し、作業時間の長い順に並べる", () => {
      const commits = [
        commit("c1", "p1", at(2026, 10, 31, 9), 30 * MIN),
        commit("c2", "p2", at(2026, 10, 31, 13), 90 * MIN),
        commit("c3", "p1", at(2026, 10, 31, 20), 15 * MIN),
        commit("c4", "p1", at(2026, 10, 30, 20), 999 * MIN), // 前日
      ];

      const summary = buildDailySummary(commits, projects, "2026-10-31");

      expect(summary).toEqual({
        date: "2026-10-31",
        totalMs: 135 * MIN,
        commitCount: 3,
        projects: [
          { projectId: "p2", name: "イラスト練習", totalMs: 90 * MIN },
          { projectId: "p1", name: "COMITIA新刊", totalMs: 45 * MIN },
        ],
      });
    });

    test("プロジェクトが見つからないコミットは「削除済みのプロジェクト」として集計する", () => {
      const summary = buildDailySummary([commit("c1", "gone", at(2026, 10, 31), 10 * MIN)], projects, "2026-10-31");

      expect(summary.projects[0].name).toBe("削除済みのプロジェクト");
    });
  });

  describe("buildDailyShareText", () => {
    test("日付・合計・プロジェクト別の時間を並べる", () => {
      const summary = buildDailySummary(
        [commit("c1", "p1", at(2026, 10, 31), 45 * MIN), commit("c2", "p2", at(2026, 10, 31), 90 * MIN)],
        projects,
        "2026-10-31"
      );

      expect(buildDailyShareText(summary)).toBe(
        ["10/31 の作業記録", "合計 2時間15分（2 回）", "・イラスト練習：1時間30分", "・COMITIA新刊：45分"].join("\n")
      );
    });

    test("4 件目以降のプロジェクトは「ほか N 件」にまとめる", () => {
      const many: Project[] = ["a", "b", "c", "d", "e"].map((id) => ({ id, name: id, createdAt: 0, completed: false }));
      const commits = many.map((p, i) => commit(`c${i}`, p.id, at(2026, 10, 31), (10 - i) * MIN));

      const text = buildDailyShareText(buildDailySummary(commits, many, "2026-10-31"));

      expect(text).toContain("・c：");
      expect(text).not.toContain("・d：");
      expect(text.endsWith("ほか 2 件")).toBe(true);
    });

    test("作業が無い日は専用の文面にする", () => {
      expect(buildDailyShareText(buildDailySummary([], projects, "2026-10-31"))).toBe(
        "10/31 は作業記録がありませんでした。明日もがんばる！"
      );
    });
  });

  describe("buildXIntentUrl", () => {
    test("text・url・hashtags を URL エンコードして X の Intent URL を作る", () => {
      const url = new URL(buildXIntentUrl({ text: "10/31 の作業記録\n合計 2時間&", url: "https://memomy.net", hashtags: ["memomy", "絵"] }));

      expect(url.origin + url.pathname).toBe("https://x.com/intent/tweet");
      expect(url.searchParams.get("text")).toBe("10/31 の作業記録\n合計 2時間&");
      expect(url.searchParams.get("url")).toBe("https://memomy.net");
      expect(url.searchParams.get("hashtags")).toBe("memomy,絵");
    });

    test("url・hashtags を空にすると付けない", () => {
      const url = new URL(buildXIntentUrl({ text: "hi", url: "", hashtags: [] }));

      expect(url.searchParams.has("url")).toBe(false);
      expect(url.searchParams.has("hashtags")).toBe(false);
    });
  });
});
