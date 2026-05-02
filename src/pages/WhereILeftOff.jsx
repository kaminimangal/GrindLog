import { useEffect, useState } from 'react'
import { getCategoryById, CATEGORIES } from '../data'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function LeftOffCard({ entry }) {
  const cat = getCategoryById(entry.category_id)
  const timeAgo = (() => {
    const d = new Date(entry.created_at)
    const now = new Date()
    const diff = Math.floor((now - d) / 86400000)
    const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (diff === 0) return 'Today · ' + timeStr
    if (diff === 1) return 'Yesterday · ' + timeStr
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' · ' + timeStr
  })()

  return (
    <div className="flex flex-col justify-between p-6 bg-surface-low hover:bg-surface-high transition-all border-y border-r border-border rounded-r-lg group" style={{ borderLeft: "4px solid " + cat.color }}>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.short}</span>
          </div>
          <span className="text-[11px] text-text-muted">{timeAgo}</span>
        </div>
        <p className="text-text-secondary text-sm leading-relaxed mb-6">{entry.note}</p>
      </div>
      <div className="flex justify-end">
        <button
          className="text-xs font-semibold px-4 py-1.5 border border-border text-text-secondary transition-all rounded"
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = cat.color; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = cat.color }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; e.currentTarget.style.borderColor = '' }}
        >
          Continue →
        </button>
      </div>
    </div>
  )
}

export default function WhereILeftOff() {
  const { user } = useAuth()
  const [lastEntries, setLastEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) loadLastEntries()
  }, [user])

  async function loadLastEntries() {
    const { data } = await supabase.from('entries').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) {
      // Get last entry per category
      const seen = {}
      const last = []
      data.forEach(e => { if (!seen[e.category_id]) { seen[e.category_id] = true; last.push(e) } })
      setLastEntries(last)
    }
    setLoading(false)
  }

  return (
    <div className="ml-[240px] mt-14 p-8 max-w-[1200px]">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-text-primary mb-1">Pick up where you stopped</h1>
        <p className="text-text-muted text-sm">Your last entry in each topic</p>
      </div>

      {loading ? (
        <div className="text-text-muted text-sm">Loading...</div>
      ) : lastEntries.length === 0 ? (
        <div className="border border-border rounded-lg p-16 text-center">
          <span className="material-symbols-outlined block mx-auto mb-3 text-text-muted" style={{fontSize:'40px'}}>bookmark</span>
          <p className="text-text-primary font-medium mb-1">Nothing here yet</p>
          <p className="text-text-muted text-sm">Log some work on the Dashboard and it'll appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-5">
          {lastEntries.map(entry => <LeftOffCard key={entry.id} entry={entry} />)}
        </div>
      )}
    </div>
  )
}
