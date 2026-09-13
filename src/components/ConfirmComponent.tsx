export default function ConfirmComponent(){
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
            onMouseDown={(e) => {
                // 背景クリックで閉じる
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-4">{title}</h2>
                <p className="mb-6">{message}</p>
                <div className="flex justify-end space-x-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    )
}