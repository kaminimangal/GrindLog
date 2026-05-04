import { useEffect, useState } from 'react'
import { CATEGORIES, getCategoryById } from '../data'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

// Issue 6 fix — timezone safe timeAgo
function timeAgo(createdAt) {
  const d = new Date(createdAt)
  const now = new Date()
  const diffMs = now - d
  const diffDays = Math.floor(diffMs / 86400000)
  const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (diffDays === 0) return 'Today · ' + timeStr
  if (diffDays === 1) return 'Yesterday · ' + timeStr
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + timeStr
}

function LeftOffCard({ entry, onMarkComplete }) {
  const cat = getCategoryById(entry.category_id)
  const navigate = useNavigate()

  // Issue 2 fix — Continue button navigates to dashboard with category
  function handleContinue() {
    navigate('/', { state: { preselectedCat: entry.category_id } })
  }

  return (
    <div
      className="flex flex-col justify-between p-6 bg-surface-low hover:bg-surface-high transition-all border-y border-r border-border rounded-r-lg"
      style={{ borderLeft: "4px solid " + cat.color }}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>
              {cat.short}
            </span>
          </div>
          <span className="text-[11px] text-text-muted">{timeAgo(entry.created_at)}</span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{entry.note}</p>
      </div>

      <div className="flex items-center justify-between gap-3">
        {/* Mark complete button */}
        <button
          onClick={() => onMarkComplete(entry.id)}
          className="flex items-center gap-1 text-xs text-text-muted hover:text-green-400 border border-border hover:border-green-400/50 px-3 py-1.5 rounded transition-all"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
          Done
        </button>

        {/* Continue button */}
        <button
          onClick={handleContinue}
          className="text-xs font-semibold px-4 py-1.5 border border-border text-text-secondary transition-all rounded"
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = cat.color
            e.currentTarget.style.color = '#fff'
            e.currentTarget.style.borderColor = cat.color
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = ''
            e.currentTarget.style.color = ''
            e.currentTarget.style.borderColor = ''
          }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default function WhereILeftOff() {
  const { user } = useAuth()
  const [allEntries, setAllEntries] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  async function loadActiveEntries() {
    const { data } = await supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    if (data) setAllEntries(data)
    setLoading(false)
  }

  useEffect(() => {
    if (user) loadActiveEntries()
  }, [user])



  async function handleMarkComplete(id) {
    await supabase.from('entries').update({ status: 'complete' }).eq('id', id)
    setAllEntries(allEntries.filter(e => e.id !== id))
  }

  // Issue 5 fix — filter by category
  const filtered = filter === 'all'
    ? allEntries
    : allEntries.filter(e => e.category_id === filter)

  // Get only categories that have active entries
  const activeCatIds = [...new Set(allEntries.map(e => e.category_id))]
  const activeCategories = CATEGORIES.filter(c => activeCatIds.includes(c.id))

  // Issue 4 fix — count summary
  const catCount = activeCatIds.length

  return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8 ">
      {/* Header with count summary */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">
          Pick up where you stopped
        </h1>
        <p className="text-text-muted text-sm">
          {allEntries.length} active{' '}
          <span className="text-text-muted">·</span>{' '}
          {catCount} {catCount === 1 ? 'category' : 'categories'}
        </p>
      </div>

      {/* Issue 5 fix — filter bar */}
      {!loading && allEntries.length > 0 && (
        <div className="flex gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${filter === 'all'
              ? 'bg-primary text-white border-primary'
              : 'border-border text-text-muted hover:bg-surface-low'
              }`}
          >
            All ({allEntries.length})
          </button>
          {activeCategories.map(cat => {
            const count = allEntries.filter(e => e.category_id === cat.id).length
            return (
              <button
                key={cat.id}
                onClick={() => setFilter(cat.id)}
                className="px-3 py-1.5 rounded text-xs font-medium border transition-all"
                style={filter === cat.id
                  ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color }
                  : { borderColor: '#1F2937', color: '#6B7280' }
                }
              >
                {cat.label} ({count})
              </button>
            )
          })}
        </div>
      )}

      {loading ? (
        <div className="text-text-muted text-sm">Loading...</div>
      ) : filtered.length === 0 && allEntries.length === 0 ? (
        <div className="border border-border rounded-lg p-16 text-center">
          <span className="material-symbols-outlined block mx-auto mb-3 text-text-muted" style={{ fontSize: '40px' }}>
            bookmark
          </span>
          <p className="text-text-primary font-medium mb-1">Nothing active yet</p>
          <p className="text-text-muted text-sm">Log some work on the Dashboard and it'll appear here.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
          No active entries in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(entry => (
            <LeftOffCard
              key={entry.id}
              entry={entry}
              onMarkComplete={handleMarkComplete}
            />
          ))}
        </div>
      )}
    </div>
  )
}