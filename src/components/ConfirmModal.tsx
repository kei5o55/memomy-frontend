type Props = {
  open:boolean;
  title: string;
  message: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
  isLoading?: boolean;
};


/*<ConfirmModal 
    open={Boolean(deleteTarget)}
    title="プロジェクトの削除"
    message={`「${deleteTarget?.name || ""}」を削除してもよろしいですか？\nこの操作は取り消せません。`}
    onClose={() => setDeleteTarget(null)}
    onConfirm={handleConfirmDelete}
   />*/

export default function ConfirmModal({
  open,
  title,
  message,
  onConfirm,
  onClose,
  isLoading = false,
}: Props) {
  if (!open) return null; // 非表示時は null を返す

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm rounded-2xl grid place-items-center p-4 overflow-y-auto"
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
            className="px-4 py-2 cursor-pointer bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="px-4 py-2 bg-rose-600  cursor-pointer text-white rounded hover:bg-rose-700 disabled:opacity-50 transition-colors flex items-center space-x-2"
          >
            {isLoading ? <span>処理中...</span> : <span>削除する</span>}
          </button>
        </div>
      </div>
    </div>
  );
}