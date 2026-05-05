// src/components/ConfirmModal.jsx

export default function ConfirmModal({ message, onConfirm, onCancel }) {
    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onCancel}
        >
            <div
                className="bg-surface-low border border-border rounded-xl p-6 w-full max-w-sm"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start gap-4 mb-5">
                    <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center flex-shrink-0">
                        <span
                            className="material-symbols-outlined text-red-400"
                            style={{ fontSize: '20px' }}
                        >
                            warning
                        </span>
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-text-primary">Delete this entry?</h3>
                        <p className="text-sm text-text-muted mt-1">{message}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded text-sm font-semibold transition-colors"
                    >
                        Yes, delete
                    </button>
                </div>
            </div>
        </div>
    )
}