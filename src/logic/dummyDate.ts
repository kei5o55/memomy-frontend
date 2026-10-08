// ダミーデータ例
import { Badge,User } from "./types";

export const MASTER_BADGES: Badge[] = [
  {
    id: "badge-1",
    name: "100時間突破",
    icon: "🔥",
    description: "累計作業時間が100時間を超えました",
    unlockedAt: 1700000000,
  },
  {
    id: "badge-2",
    name: "皆勤賞",
    icon: "⚡",
    description: "30日連続で作業ログを記録しました",
    unlockedAt: 1705000000,
  },
  {
    id: "badge-3",
    name: "初コミット",
    icon: "🎨",
    description: "最初の制作記録を記録しました",
    unlockedAt: 1690000000,
  },
  {
    id: "badge-4",
    name: "ナイトオウル",
    icon: "🌙",
    description: "深夜2時以降に合計10時間作業しました",
    // unlockedAt がないので未解放扱い
  },
];

export const localUser: User[] = [
  {
    id: "1",
    name: "InitialUser",
    icon:"",
    bio: "初期ユーザーだよぅ",
    bgmUrl: "https://soundcloud.com/bakuwara/oreranatotomodachi",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
  },{
    id: "2",
    name: "テストユーザ２",
    icon:"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    bio: "なんふぇ？",
    bgmUrl: "test",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
  }
];

export const initialuUser:User={
    id: "1",
    name: "InitialUser",
    icon:"",
    bio: "初期ユーザーだよぅ",
    bgmUrl: "https://soundcloud.com/bakuwara/oreranatotomodachi",
    createdAt: 1704067200000, // 2024-01-01T00:00:00.000Z
    updatedAt: 1709251200000, // 2024-03-01T00:00:00.000Z
}