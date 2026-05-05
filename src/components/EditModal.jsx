// src/components/EditModal.jsx
import { useState } from 'react'
import { CATEGORIES } from '../data'

// Props:
//   entry   — the entry object being edited
//   onSave  — async function(updatedData) called when user clicks Save
//   onClose — function() called when user cancels or clicks outside
export default function EditModal({ entry, onSave, onClose }) {
    const [note, setNote] = useState(entry.note)
    const [minutes, setMinutes] = useState(entry.minutes || '')
    const [categoryId, setCategoryId] = useState(entry.category_id)
    const [saving, setSaving] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!note.trim()) return
        setSaving(true)
        await onSave({
            id: entry.id,
            note: note.trim(),
            minutes: parseInt(minutes) || null,
            category_id: categoryId,
        })
        setSaving(false)
    }

    return (
        <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-surface-low border border-border rounded-xl p-6 w-full max-w-md"
                onClick={e => e.stopPropagation()}
            >
                <h3 className="text-base font-semibold text-text-primary mb-4">Edit Entry</h3>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                            Category
                        </label>
                        <select
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value)}
                            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                            Note
                        </label>
                        <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            rows={4}
                            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                            Minutes
                        </label>
                        <input
                            type="number"
                            value={minutes}
                            onChange={e => setMinutes(e.target.value)}
                            className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}