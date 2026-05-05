// src/components/OnboardingModal.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES } from '../data'

export default function OnboardingModal({ onComplete }) {
    const { user } = useAuth()
    const [step, setStep] = useState(1)
    const [displayName, setDisplayName] = useState(
        user?.user_metadata?.full_name?.split(' ')[0] || ''
    )
    const [selectedCats, setSelectedCats] = useState(['dsa'])
    const [note, setNote] = useState('')
    const [saving, setSaving] = useState(false)

    function toggleCat(id) {
        setSelectedCats(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        )
    }

    async function handleFinish() {
        if (!note.trim()) return
        setSaving(true)

        if (displayName.trim()) {
            await supabase.auth.updateUser({
                data: { full_name: displayName.trim() }
            })
        }

        const today = new Date().toISOString().slice(0, 10)
        await supabase.from('entries').insert({
            user_id: user.id,
            category_id: selectedCats[0] || 'dsa',
            note: note.trim(),
            date: today,
        })

        setSaving(false)
        onComplete()
    }

    const steps = ['Welcome', 'Your Focus', 'First Log']

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-surface-low border border-border rounded-2xl w-full max-w-md overflow-hidden">

                {/* Progress bar */}
                <div className="flex">
                    {steps.map((s, i) => (
                        <div
                            key={i}
                            className="flex-1 h-1 transition-all duration-300"
                            style={{ backgroundColor: i < step ? '#9333EA' : '#1F2937' }}
                        />
                    ))}
                </div>

                <div className="p-7">
                    <p className="text-xs text-text-muted uppercase tracking-widest mb-6">
                        Step {step} of {steps.length} — {steps[step - 1]}
                    </p>

                    {/* Step 1: Welcome */}
                    {step === 1 && (
                        <div>
                            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mb-5">
                                <span className="material-symbols-outlined text-white" style={{ fontSize: '24px' }}>
                                    bolt
                                </span>
                            </div>
                            <h2 className="text-xl font-semibold text-text-primary mb-2">
                                Welcome to GrindLog
                            </h2>
                            <p className="text-text-muted text-sm mb-6 leading-relaxed">
                                The only app that tracks your grind and predicts your future.
                                Let's get you set up in 60 seconds.
                            </p>
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                                    What should we call you?
                                </label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                    placeholder="Your first name"
                                    autoFocus
                                    className="w-full bg-bg border border-border rounded px-3 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Pick categories */}
                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary mb-2">
                                What are you working on?
                            </h2>
                            <p className="text-text-muted text-sm mb-5">
                                Pick the areas you want to track. You can change this anytime.
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.id}
                                        onClick={() => toggleCat(cat.id)}
                                        className="flex items-center gap-3 p-3 rounded-lg border text-left transition-all"
                                        style={{
                                            borderColor: selectedCats.includes(cat.id) ? cat.color : '#1F2937',
                                            backgroundColor: selectedCats.includes(cat.id) ? `${cat.color}15` : 'transparent',
                                        }}
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: cat.color }}
                                        />
                                        <span className="text-xs font-medium text-text-secondary truncate">
                                            {cat.label}
                                        </span>
                                        {selectedCats.includes(cat.id) && (
                                            <span
                                                className="material-symbols-outlined ml-auto flex-shrink-0"
                                                style={{ fontSize: '14px', color: cat.color }}
                                            >
                                                check_circle
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: First log */}
                    {step === 3 && (
                        <div>
                            <h2 className="text-xl font-semibold text-text-primary mb-2">
                                Log your first entry
                            </h2>
                            <p className="text-text-muted text-sm mb-5">
                                What are you working on right now? Where will you pick up from?
                            </p>
                            <div className="mb-3">
                                <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                                    Category
                                </label>
                                <select
                                    value={selectedCats[0] || 'dsa'}
                                    onChange={e => setSelectedCats([e.target.value])}
                                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                                >
                                    {CATEGORIES.filter(c => selectedCats.includes(c.id)).map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                                    What did you just do or what are you starting?
                                </label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Starting Binary Search problems on LeetCode. At problem #704."
                                    rows={4}
                                    autoFocus
                                    className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary resize-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex gap-3 mt-6">
                        {step > 1 && (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="border border-border text-text-muted px-4 py-2.5 rounded text-sm hover:bg-surface-high transition-colors"
                            >
                                Back
                            </button>
                        )}
                        {step < 3 ? (
                            <button
                                onClick={() => setStep(s => s + 1)}
                                disabled={step === 2 && selectedCats.length === 0}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white py-2.5 rounded text-sm font-semibold transition-all"
                            >
                                Continue →
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={!note.trim() || saving}
                                className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white py-2.5 rounded text-sm font-semibold transition-all flex items-center justify-center gap-2"
                            >
                                {saving && (
                                    <span className="material-symbols-outlined animate-spin" style={{ fontSize: '14px' }}>
                                        progress_activity
                                    </span>
                                )}
                                {saving ? 'Setting up...' : "Let's grind 🔥"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
