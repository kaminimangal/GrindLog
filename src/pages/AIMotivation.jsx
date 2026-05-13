// src/pages/AIMotivation.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// Each prediction card
function PredictionCard({ year, text, color }) {
    return (
        <div
            className="border border-border rounded-lg p-5 bg-surface-low"
            style={{ borderTop: `3px solid ${color}` }}
        >
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color }}>
                {year}
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{text}</p>
        </div>
    )
}

// Skeleton loader — shows while waiting for AI response
function Skeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-surface-high rounded-lg" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-surface-high rounded-lg" />
                <div className="h-32 bg-surface-high rounded-lg" />
                <div className="h-32 bg-surface-high rounded-lg" />
            </div>
            <div className="h-20 bg-surface-high rounded-lg" />
            <div className="h-20 bg-surface-high rounded-lg" />
        </div>
    )
}

export default function AIMotivation() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    async function getAIAnalysis() {
        setLoading(true)
        setError('')
        setResult(null)

        try {
            // Get session — could be null if expired
            const { data: { session } } = await supabase.auth.getSession()

            // ← DEFENSIVE CHECK: if no session, tell the user clearly
            if (!session) {
                setError('Your session has expired. Please sign out and sign back in.')
                setLoading(false)
                return
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-motivation`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                }
            )

            const data = await response.json()

            if (!response.ok || data.error) {
                setError(data.error || 'Something went wrong. Try again.')
            } else {
                setResult(data)
            }

        } catch (err) {
            // ← catches any unexpected crash (network down, JSON parse fail, etc.)
            console.error('AI analysis error:', err)
            setError('Something went wrong. Check your connection and try again.')
        } finally {
            // ← finally ALWAYS runs — even if there was an error or early return
            setLoading(false)
        }
    }

    return (
        <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">

            {/* Header */}
            <div className="flex items-start justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>
                            auto_awesome
                        </span>
                        <p className="text-primary text-sm font-medium">Powered by Groq AI</p>
                    </div>
                    <h1 className="text-2xl font-semibold text-text-primary">AI Motivation</h1>
                    <p className="text-text-muted text-sm mt-1">
                        Your logs analysed. Your future predicted. Based on your actual grind.
                    </p>
                </div>

                <button
                    onClick={getAIAnalysis}
                    disabled={loading}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white px-4 py-2.5 rounded text-sm font-semibold transition-all active:scale-[0.99] flex-shrink-0"
                >
                    {loading ? (
                        <span className="material-symbols-outlined animate-spin" style={{ fontSize: '16px' }}>
                            progress_activity
                        </span>
                    ) : (
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                            auto_awesome
                        </span>
                    )}
                    {loading ? 'Analysing...' : result ? 'Refresh Analysis' : 'Analyse My Grind'}
                </button>
            </div>

            {/* Empty state — no analysis yet */}
            {!loading && !result && !error && (
                <div className="border border-dashed border-border rounded-xl p-16 text-center">
                    <span
                        className="material-symbols-outlined block mx-auto mb-4 text-primary"
                        style={{ fontSize: '48px' }}
                    >
                        psychology
                    </span>
                    <h2 className="text-lg font-semibold text-text-primary mb-2">
                        Ready to see your future?
                    </h2>
                    <p className="text-text-muted text-sm max-w-sm mx-auto leading-relaxed mb-6">
                        Groq will read every log you've written, find your patterns, and tell you
                        exactly where you're headed in 1, 3, and 5 years — based on your real data.
                    </p>
                    <button
                        onClick={getAIAnalysis}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded text-sm font-semibold transition-all"
                    >
                        Analyse My Grind
                    </button>
                </div>
            )}

            {/* Loading skeleton */}
            {loading && <Skeleton />}

            {/* Error state */}
            {error && (
                <div className="flex items-start gap-3 border border-red-400/30 bg-red-400/10 rounded-lg p-5">
                    <span className="material-symbols-outlined text-red-400 flex-shrink-0" style={{ fontSize: '20px' }}>
                        error
                    </span>
                    <div>
                        <p className="text-sm font-semibold text-red-400 mb-1">Analysis failed</p>
                        <p className="text-sm text-text-muted">{error}</p>
                    </div>
                </div>
            )}

            {/* AI Results */}
            {result && !loading && (
                <div className="space-y-6">

                    {/* Motivation message */}
                    <div className="border border-primary/30 bg-primary/5 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>
                                bolt
                            </span>
                            <p className="text-xs font-bold uppercase tracking-widest text-primary">
                                Your assessment
                            </p>
                        </div>
                        <p className="text-text-primary text-base leading-relaxed">{result.motivation}</p>
                    </div>

                    {/* Pattern + Peak hour */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="border border-border rounded-lg p-5 bg-surface-low">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontSize: '18px' }}>
                                    schedule
                                </span>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                    Peak focus window
                                </p>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">{result.peakHour}</p>
                        </div>

                        <div className="border border-border rounded-lg p-5 bg-surface-low">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[#14B8A6]" style={{ fontSize: '18px' }}>
                                    insights
                                </span>
                                <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                                    Work pattern
                                </p>
                            </div>
                            <p className="text-sm text-text-secondary leading-relaxed">{result.pattern}</p>
                        </div>
                    </div>

                    {/* 5-year predictions */}
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
                            Career trajectory — if you stay consistent
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <PredictionCard year="1 year from now" text={result.prediction_1yr} color="#9333EA" />
                            <PredictionCard year="3 years from now" text={result.prediction_3yr} color="#3B82F6" />
                            <PredictionCard year="5 years from now" text={result.prediction_5yr} color="#10B981" />
                        </div>
                    </div>

                    {/* Disclaimer */}
                    <p className="text-xs text-text-muted text-center">
                        Analysis based on your last 30 log entries and active goals.
                        Refresh anytime after logging new entries.
                    </p>
                </div>
            )}
        </div>
    )
}