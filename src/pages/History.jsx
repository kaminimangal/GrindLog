import { useState, useEffect } from 'react'
import { CATEGORIES, getCategoryById } from '../data'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  const today = new Date(); today.setHours(0,0,0,0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function History() {
  const { user } = useAuth()
  const [allEntries, setAllEntries] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) loadHistory() }, [user])

  async function loadHistory() {
    const { data } = await supabase.from('entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setAllEntries(data)
    setLoading(false)
  }

  const filtered = filter === 'all' ? allEntries : allEntries.filter(e => e.category_id === filter)
  const byDate = {}
  filtered.forEach(e => { if (!byDate[e.date]) byDate[e.date] = []; byDate[e.date].push(e) })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  return (
    <div className="ml-[240px] mt-14 p-8 max-w-[1200px]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">History</h1>
          <p className="text-text-muted text-sm mt-1">Everything you've logged, in order.</p>
        </div>
        <span className="text-xs text-text-muted">{filtered.length} entries</span>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')} className={"px-3 py-1.5 rounded text-xs font-medium transition-colors border " + (filter === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:bg-surface-low')}>All</button>
        {CATEGORIES.map(cat => (
          <button key={cat.id} onClick={() => setFilter(cat.id)} className="px-3 py-1.5 rounded text-xs font-medium transition-all border"
            style={filter === cat.id ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color } : { borderColor: '#1F2937', color: '#6B7280' }}>
            {cat.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : dates.length === 0 ? (
        <div className="border border-border rounded-lg p-16 text-center">
          <span className="material-symbols-outlined block mx-auto mb-3 text-text-muted" style={{fontSize:'40px'}}>history</span>
          <p className="text-text-primary font-medium mb-1">No entries yet</p>
          <p className="text-text-muted text-sm">Start logging on the Dashboard.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {dates.map(date => {
            const dayEntries = byDate[date]
            const dayMins = dayEntries.reduce((s, e) => s + (e.minutes || 0), 0)
            return (
              <div key={date}>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
                  <p className="text-sm font-semibold text-text-secondary">{fmtDate(date)}</p>
                  <span className="text-xs text-text-muted">{dayEntries.length} log{dayEntries.length !== 1 ? 's' : ''}{dayMins ? ' · ' + dayMins + ' min' : ''}</span>
                </div>
                <div className="space-y-2">
                  {dayEntries.map(entry => {
                    const cat = getCategoryById(entry.category_id)
                    const time = new Date(entry.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                    return (
                      <div key={entry.id} className="flex items-start gap-4 p-4 border-y border-r border-border rounded-r-lg bg-surface-low hover:bg-surface-high transition-colors" style={{ borderLeft: "3px solid " + cat.color }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.short}</span>
                            <span className="text-xs text-text-muted">· {time}</span>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">{entry.note}</p>
                        </div>
                        {entry.minutes && <span className="flex items-center gap-1 text-xs text-text-muted flex-shrink-0 mt-0.5"><span className="material-symbols-outlined" style={{fontSize:'13px'}}>schedule</span>{entry.minutes}m</span>}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
