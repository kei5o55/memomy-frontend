import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { saveUserProfileIdb } from "../logic/storage-idb";
import { updateUserProfile, uploadUserIcon, deleteUserIcon } from "../logic/api-request";
import { ICON_MAX_BYTES, isAllowedIconType, resizeIconImage } from "../logic/icon-image";
import type { Badge, User } from "../logic/types";
import BadgeBoard from "./BadgeBoard";
import  BadgeSettingsModal  from "./BadgeSettingsModal";

const isApiMode = process.env.NEXT_PUBLIC_API_MODE === "true";

type Props = {
  open: boolean;
  onClose: () => void;
  currentUser: User; // 初期値として渡す既存のユーザーデータ
  allBadges?: Badge[]; // システム全体のバッジ一覧（未指定の場合は空配列）
  onSuccess: (updatedUser: User) => void; // 親コンポーネントへ送信する関数
};

export default function UserProfileModal({
  open,
  onClose,
  currentUser,
  allBadges = [],
  onSuccess,
}: Props) {
  // フォームの状態
  const [name, setName] = useState(currentUser?.name ?? "");
  const [bio, setBio] = useState(currentUser?.bio ?? "");
  const [bgmUrl, setBgmUrl] = useState(currentUser?.bgmUrl ?? "");

  // バッジ選択状態（最大3つ）
  const [selectedBadges, setSelectedBadges] = useState<Badge[]>(
    currentUser?.badges ?? []
  );

  // バッジ設定用のインナーモーダル表示フラグ
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);

  // 初期値：currentUser.snsLinks（なければ初期表示用に1つの空入力枠）
  const [snsLinks, setSnsLinks] = useState<string[]>(() =>
    currentUser?.snsLinks?.length ? currentUser.snsLinks : [""]
  );

  // 特定インデックスのURL変更
  const handleSnsLinkChange = (index: number, value: string) => {
    const updated = [...snsLinks];
    updated[index] = value;
    setSnsLinks(updated);
  };

  // 入力枠の追加（最大4つまで）
  const handleAddSnsLink = () => {
    if (snsLinks.length < 4) {
      setSnsLinks([...snsLinks, ""]);
    }
  };

  // 特定インデックスの枠を削除
  const handleRemoveSnsLink = (index: number) => {
    if (snsLinks.length === 1) {
      setSnsLinks([""]);
    } else {
      setSnsLinks(snsLinks.filter((_, i) => i !== index));
    }
  };

  // バッジの選択／解除トグル
  const toggleBadge = (badge: Badge) => {
    const isSelected = selectedBadges.some((b) => b.id === badge.id);
    if (isSelected) {
      setSelectedBadges(selectedBadges.filter((b) => b.id !== badge.id));
    } else {
      if (selectedBadges.length >= 3) return; // 3つ上限
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  // 画像選択用ステート
  const [iconFile, setIconFile] = useState<File | undefined>(undefined);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentUser?.icon ?? null
  );
  // 「削除」が押されたか（保存時にアイコンを消す）
  const [iconRemoved, setIconRemoved] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  // 画像選択時のプレビュー生成
  const handleIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じファイルを選び直しても onChange が発火するようにリセットする
    e.target.value = "";
    if (!file) return;

    if (!isAllowedIconType(file)) {
      alert("アイコンは PNG / JPEG / WebP / GIF のいずれかを選んでください");
      return;
    }

    if (iconFile && previewUrl) URL.revokeObjectURL(previewUrl);
    setIconFile(file);
    setIconRemoved(false);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // アイコンを外す（保存するまでは反映しない）
  const handleIconRemove = () => {
    if (iconFile && previewUrl) URL.revokeObjectURL(previewUrl);
    setIconFile(undefined);
    setIconRemoved(true);
    setPreviewUrl(null);
  };

  // ファイルを Promise で Base64 文字列に変換するヘルパー関数
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // フォーム送信処理
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const cleanedSnsLinks = snsLinks
        .map((url) => url.trim())
        .filter((url) => url !== "");

      let updatedUser: User;

      if (isApiMode) {
        // 【API モード】アイコンを先に保存する。形式・サイズのエラー時はプロフィールも保存せず、入力を残すためモーダルは閉じない
        // （失敗時のエラー表示は各 API 関数内で済んでいる）
        if (iconFile) {
          const { blob, filename } = await resizeIconImage(iconFile);
          if (blob.size > ICON_MAX_BYTES) {
            alert("アイコン画像は 2MB 以下にしてください");
            return;
          }
          if (!(await uploadUserIcon(blob, filename))) return;
        } else if (iconRemoved) {
          if (!(await deleteUserIcon())) return;
        }

        // name / bio / bgmUrl / snsLinks を Rails API へ保存（レスポンスには保存後のアイコンも含まれる）
        const saved = await updateUserProfile({
          name,
          bio,
          bgmUrl,
          snsLinks: cleanedSnsLinks,
        });
        if (!saved) return;

        // バッジはバックエンド未対応のため、当面は IndexedDB に保存する
        updatedUser = { ...saved, badges: selectedBadges };
        // アイコンはサーバーの値を正とするため IndexedDB には残さない
        await saveUserProfileIdb({ ...updatedUser, icon: undefined });
      } else {
        // 【ローカル/オフライン モード】すべて IndexedDB へ保存
        let iconResult = iconRemoved ? undefined : currentUser?.icon;
        if (iconFile) {
          iconResult = await convertFileToBase64(iconFile);
        }

        updatedUser = {
          ...currentUser,
          id: currentUser.id,
          icon: iconResult,
          name: name,
          bio: bio,
          bgmUrl: bgmUrl,
          snsLinks: cleanedSnsLinks,
          badges: selectedBadges, // 更新したバッジ配列を反映
          updatedAt: Date.now(),
        };
        await saveUserProfileIdb(updatedUser);
      }

      // 次にモーダルを開いて保存したときに同じ画像を再送しないよう、アイコンの選択状態を保存済みの値に戻す
      if (iconFile && previewUrl) URL.revokeObjectURL(previewUrl);
      setIconFile(undefined);
      setIconRemoved(false);
      setPreviewUrl(updatedUser.icon ?? null);

      onSuccess(updatedUser);
      onClose();
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6 my-8 text-slate-800 relative">
          {/* ヘッダー */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900">
              プロフィール編集
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* アイコン画像設定 ＆ バッジ設定エリア */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl">
              {/* アイコン選択部 */}
              <div className="flex items-center gap-3">
                <div className="relative w-16 h-16 rounded-full bg-white border border-slate-200 overflow-hidden shrink-0 grid place-items-center shadow-xs">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Icon Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-slate-400 text-xs">No Icon</span>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="cursor-pointer inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors shadow-2xs">
                      画像を変更
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleIconChange}
                        className="hidden"
                      />
                    </label>
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={handleIconRemove}
                        className="px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-rose-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                      >
                        削除
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    PNG, JPEG, WebP, GIF（2MB まで）
                  </p>
                </div>
              </div>

              {/* バッジ表示 ＆ 編集ボタン部 */}
              <div className="flex flex-col items-start sm:items-end gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                <span className="text-[11px] font-bold text-slate-500">
                  表示バッジ ({selectedBadges.length}/3)
                </span>
                
                <div className="flex items-center gap-1.5">
                  <BadgeBoard badges={selectedBadges} ></BadgeBoard>

                  {/* 編集ボタン */}
                  <button
                    type="button"
                    onClick={() => setIsBadgeModalOpen(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200/80 hover:bg-sky-100 rounded-xl transition-colors shrink-0 cursor-pointer"
                  >
                    編集
                  </button>
                  <BadgeSettingsModal
                    open={isBadgeModalOpen}
                    onClose={() => setIsBadgeModalOpen(false)}
                    allBadges={allBadges}
                    selectedBadges={selectedBadges}
                    onToggleBadge={toggleBadge}
                  />
                </div>
              </div>
            </div>

            {/* 名前 */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                ユーザー名 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="表示名を入力"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
            </div>

            {/* 自己紹介（bio） */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                自己紹介
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="自己紹介"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm resize-none"
              />
            </div>

            {/* 作業用BGM用リンク */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">
                作業用BGMリンク
              </label>
              <input
                type="url"
                value={bgmUrl}
                onChange={(e) => setBgmUrl(e.target.value)}
                placeholder="https://youtube.com/..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
              />
              <p className="text-xs text-slate-400">
                YouTubeやSoundCloudなどの共有リンク
              </p>
            </div>

            {/* SNSリンク（複数入力対応 / 最大4つ） */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  SNSリンク <span className="text-xs font-normal text-slate-400">（最大4つ）</span>
                </label>
                {snsLinks.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddSnsLink}
                    className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                  >
                    ＋ リンクを追加
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {snsLinks.map((url, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleSnsLinkChange(index, e.target.value)}
                      placeholder={
                        index === 0
                          ? "https://x.com/..."
                          : index === 1
                          ? "https://pixiv.net/..."
                          : "https://..."
                      }
                      className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all text-sm"
                    />
                    {(snsLinks.length > 1 || url !== "") && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSnsLink(index)}
                        className="p-2 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                        title="削除"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-400">
                X、pixiv、HPなどSNSのURL
              </p>
            </div>

            {/* フッターアクション */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="px-5 py-2.5 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "保存中..." : "保存する"}
              </button>
            </div>
          </form>
        </div>
      </div>

    </>
  );
}