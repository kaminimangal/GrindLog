import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCategories } from '../context/CategoryContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EditModal from '../components/EditModal'
import ConfirmModal from '../components/ConfirmModal'
import { useStreak } from '../hooks/useStreak'

// ─────────────────────────────────────────────
// Sub-components (unchanged)
// ─────────────────────────────────────────────

function StatCard({ label, value, unit }) {
  return (
    <div className="border border-border rounded-lg px-6 py-4 bg-surface-low">
      <p className="text-text-muted text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className="text-text-primary text-2xl font-semibold">
        {value} <span className="text-text-muted text-sm font-normal">{unit}</span>
      </p>
    </div>
  )
}

function EntryCard({ entry, onDelete, onStatusChange, onEdit, getCategoryById }) {
  const cat = getCategoryById(entry.category_id)
  const time = new Date(entry.created_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
  const isComplete = entry.status === 'complete'

  return (
    <div
      className="border-y border-r border-border rounded-r-lg p-5 bg-surface-low hover:bg-surface-high transition-colors group"
      style={{ borderLeft: '4px solid ' + (isComplete ? '#374151' : cat.color) }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>
            {cat.short_label}
          </span>
          <span className="text-text-muted text-xs">· {time}</span>
          {isComplete && (
            <span className="text-[10px] bg-green-400/10 text-green-400 border border-green-400/20 px-2 py-0.5 rounded-full">
              Complete
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {entry.minutes && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>schedule</span>
              {entry.minutes}m
            </span>
          )}
          <button
            onClick={() => onStatusChange(entry.id, isComplete ? 'active' : 'complete')}
            title={isComplete ? 'Mark as active' : 'Mark as complete'}
            className={`text-xs px-2 py-1 rounded border transition-all ${isComplete
              ? 'border-green-400/30 text-green-400 hover:bg-green-400/10'
              : 'border-border text-text-muted hover:border-green-400/50 hover:text-green-400'
              }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
              {isComplete ? 'check_circle' : 'radio_button_unchecked'}
            </span>
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="opacity-100 md:opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="opacity-100 md:opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
          </button>
        </div>
      </div>
      <p className="text-text-secondary text-sm leading-relaxed">{entry.note}</p>
    </div>
  )
}

// ─────────────────────────────────────────────
// Main Dashboard
// ─────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth()
  const today = new Date().toISOString().slice(0, 10)

  // ── queryClient lets us trigger invalidations from inside mutation callbacks ──
  // We get it from the context set up by QueryClientProvider in main.jsx.
  // Think of it as a remote control for the global cache.
  const queryClient = useQueryClient()

  // ── Form state (local UI state — NOT server state, so useState is correct here) ──
  const [note, setNote] = useState('')
  const [minutes, setMinutes] = useState('')
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const charCount = note.length
  const maxChars = 300

  // ── Edit / Delete modal state (also local UI state) ──
  const [editingEntry, setEditingEntry] = useState(null)
  const [deleteId, setDeleteId] = useState(null)
  // AFTER — default to the first active category's ID, or empty string while loading:
  const [selectedCat, setSelectedCat] = useState('')
  const { activeCategories, getCategoryById, isLoading: catsLoading } = useCategories()

  // And add this effect directly below to set it once categories load:
  useEffect(() => {
    if (activeCategories.length > 0 && !selectedCat) {
      setSelectedCat(activeCategories[0].id)
    }
  }, [activeCategories])


  // ── SERVER STATE: Today's entries ──────────────────────────────────────
  // useQuery replaces the useState + useEffect + loadTodayEntries() pattern.
  // The queryKey ['entries', user?.id, today] means:
  //   - 'entries' is the namespace
  //   - user?.id scopes it to this user (safe even if user is null)
  //   - today scopes it to today's date
  // At midnight, 'today' changes, so a new fetch automatically triggers.
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', user?.id, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  // ── SERVER STATE: Total unique days tracked ────────────────────────────
  const { data: totalDays = 0 } = useQuery({
    queryKey: ['totalDays', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('date')
        .eq('user_id', user.id)
      if (error) throw error
      return new Set(data.map(e => e.date)).size
    },
    enabled: !!user,
  })

  // ── SERVER STATE: Streak ───────────────────────────────────────────────
  // useStreak is now a proper React Query hook internally.
  // No more streakKey! We just pass user and React Query manages the rest.
  const { streak } = useStreak(user)

  // ─────────────────────────────────────────────
  // Mutations
  // ─────────────────────────────────────────────

  // ── LOG a new entry ───────────────────────────────────────────────────
  // useMutation handles the async write. The key insight is onSuccess:
  // we invalidate THREE query keys — entries, totalDays, and streak.
  // React Query will refetch all three in the background automatically.
  // The UI updates without a single manual setState call for server data.
  const logMutation = useMutation({
    mutationFn: async ({ categoryId, noteText, mins }) => {
      const { data, error } = await supabase
        .from('entries')
        .insert({
          user_id: user.id,
          category_id: categoryId,
          note: noteText,
          minutes: mins || null,
          date: today,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // This is the replacement for streakKey and manual loadTotalDays() calls.
      // Invalidating a key tells React Query: "this data is now stale, refetch it."
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, today] })
      queryClient.invalidateQueries({ queryKey: ['totalDays', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['streak', user?.id] })
      setNote('')
      setMinutes('')
      setSuccessMsg('✅ Logged! Keep grinding.')
      setTimeout(() => setSuccessMsg(''), 2000)
    },
    onError: () => {
      setFormError('Something went wrong. Please try again.')
    },
  })

  // ── DELETE an entry ───────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, today] })
      queryClient.invalidateQueries({ queryKey: ['totalDays', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['streak', user?.id] })
      setDeleteId(null)
    },
  })

  // ── CHANGE STATUS of an entry ─────────────────────────────────────────
  const statusMutation = useMutation({
    mutationFn: async ({ id, newStatus }) => {
      const { error } = await supabase
        .from('entries')
        .update({ status: newStatus })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, today] })
    },
  })

  // ── EDIT an entry ─────────────────────────────────────────────────────
  const editMutation = useMutation({
    mutationFn: async (updated) => {
      const { data, error } = await supabase
        .from('entries')
        .update({
          note: updated.note,
          minutes: updated.minutes,
          category_id: updated.category_id,
        })
        .eq('id', updated.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries', user?.id, today] })
      setEditingEntry(null)
    },
  })

  // ─────────────────────────────────────────────
  // Event handlers (now just call the mutations)
  // ─────────────────────────────────────────────

  function handleLog(e) {
    e.preventDefault()
    if (!note.trim()) {
      setFormError('Write what you did before logging!')
      return
    }
    if (note.length > maxChars) {
      setFormError(`Note is too long! Keep it under ${maxChars} characters.`)
      return
    }
    if (minutes && (parseInt(minutes) < 1 || parseInt(minutes) > 600)) {
      setFormError('Minutes should be between 1 and 600!')
      return
    }
    setFormError('')
    logMutation.mutate({ categoryId: selectedCat, noteText: note.trim(), mins: parseInt(minutes) })
  }

  function handleDelete(id) {
    setDeleteId(id)
  }

  function confirmDelete() {
    deleteMutation.mutate(deleteId)
  }

  function handleStatusChange(id, newStatus) {
    statusMutation.mutate({ id, newStatus })
  }

  function handleEdit(updated) {
    editMutation.mutate(updated)
  }

  // ─────────────────────────────────────────────
  // Derived display values (computed from cached data, not state)
  // ─────────────────────────────────────────────

  const displayName =
    user?.user_metadata?.full_name?.split(' ')[0] ||
    user?.email?.split('@')[0] ||
    'there'
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })

  const totalMins = entries.reduce((s, e) => s + (e.minutes || 0), 0)
  const catCounts = {}
  entries.forEach(e => {
    catCounts[e.category_id] = (catCounts[e.category_id] || 0) + (e.minutes || 0)
  })
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const totalForDist = topCats.reduce((s, [, m]) => s + m, 0)

  // ─────────────────────────────────────────────
  // Render (identical to before — only data sources changed)
  // ─────────────────────────────────────────────

  return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">

      {/* ── Header row ── */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-8 gap-4">
        <div>
          <p className="text-primary text-sm font-medium mb-1">{dateLabel}</p>
          <h1 className="text-3xl font-semibold text-text-primary">
            {greeting}, {displayName}
          </h1>
          <p className="text-text-muted text-sm mt-2">
            {entries.length === 0
              ? 'Start strong today. One entry changes everything.'
              : entries.length <= 2
                ? 'Good start! Keep the momentum going.'
                : "You're on fire today! 🔥 This is how careers change."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
          <StatCard label="Logs today" value={entriesLoading ? '—' : entries.length} />
          <StatCard label="Minutes studied" value={totalMins || '—'} unit={totalMins ? 'm' : ''} />
          <StatCard label="Days tracked" value={totalDays} />
          <StatCard label="🔥 Streak" value={streak} unit={streak === 1 ? 'day' : 'days'} />
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Quick Log form */}
        <div className="border border-border rounded-lg p-6 bg-surface-low">
          <h2 className="text-base font-semibold text-text-primary mb-5">Quick Log</h2>
          <form onSubmit={handleLog} className="space-y-4">
            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">Category</label>
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors"
              >
                {activeCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-text-muted uppercase tracking-widest">Details</label>
                <span className={`text-xs ${charCount > maxChars ? 'text-red-400' : 'text-text-muted'}`}>
                  {charCount} / {maxChars}
                </span>
              </div>
              <textarea
                value={note}
                onChange={e => { setNote(e.target.value); if (e.target.value.trim()) setFormError('') }}
                placeholder="What did you accomplish? Where did you stop?"
                rows={4}
                className={`w-full bg-bg border rounded px-3 py-2 text-sm text-text-primary
                  placeholder-text-muted focus:outline-none transition-colors resize-none
                  ${charCount > maxChars ? 'border-red-400' : 'border-border focus:border-primary'}`}
              />
            </div>

            <div>
              <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                Time spent (min)
              </label>
              <input
                type="number"
                value={minutes}
                onChange={e => { setMinutes(e.target.value); setFormError('') }}
                placeholder="e.g. 45"
                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            {successMsg && (
              <p className="text-green-400 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check_circle</span>
                {successMsg}
              </p>
            )}

            {formError && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>error</span>
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={logMutation.isPending || charCount > maxChars}
              className="w-full bg-white hover:bg-gray-100 disabled:opacity-60 text-black font-semibold py-2.5 rounded text-sm transition-all active:scale-[0.99]"
            >
              {/* logMutation.isPending replaces the old `saving` useState boolean */}
              {logMutation.isPending ? 'Saving...' : 'Log It'}
            </button>
          </form>
        </div>

        {/* Today's Entries list */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Today's Entries</h2>
            <span className="text-xs text-text-muted">
              {entries.length} log{entries.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {entriesLoading ? (
              <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
                Loading...
              </div>
            ) : entries.length === 0 ? (
              <div className="border border-border rounded-lg p-10 text-center text-text-muted text-sm">
                <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '32px' }}>
                  edit_note
                </span>
                No entries yet today. Log something above!
              </div>
            ) : (
              entries.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onEdit={entry => setEditingEntry(entry)}
                  getCategoryById={getCategoryById}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── Focus Distribution bar ── */}
      {topCats.length > 0 && (
        <div className="border border-border rounded-lg p-6 mt-6 bg-surface-low">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary">Focus Distribution</h2>
            <span className="text-xs text-text-muted">Today</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden flex mb-3">
            {topCats.map(([catId, mins]) => {
              const cat = getCategoryById(catId)
              return (
                <div
                  key={catId}
                  className="h-full"
                  style={{ width: (mins / totalForDist) * 100 + '%', backgroundColor: cat.color }}
                />
              )
            })}
          </div>
          <div className="flex gap-6 flex-wrap">
            {topCats.map(([catId, mins]) => {
              const cat = getCategoryById(catId)
              return (
                <div key={catId} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-text-muted">
                    {cat.label} ({Math.round((mins / totalForDist) * 100)}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {editingEntry && (
        <EditModal
          entry={editingEntry}
          onSave={handleEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {deleteId && (
        <ConfirmModal
          message="This entry will be permanently deleted and cannot be recovered."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  )
}