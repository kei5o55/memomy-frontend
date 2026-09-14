import React from "react";

export type ConfirmMode = "project" | "commit" | "schedule" | "memo";

type Props = {
  mode: ConfirmMode;
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
};

export default function ConfirmModal({
  title,
  message,
  onConfirm,
  onClose,
  isLoading = false,
}: Props) {
  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isLoading) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-slate-800">{title}</h2>
        <p className="mb-6 text-slate-600 whitespace-pre-wrap">{message}</p>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isLoading ? <span>処理中...</span> : <span>実行する</span>}
          </button>
        </div>
      </div>
    </div>
  );
}