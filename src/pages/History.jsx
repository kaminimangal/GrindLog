import { useState } from 'react'
// ✅ FIX 1: import React Query hooks — History was the only page NOT using them
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCategories } from '../context/CategoryContext'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import EditModal from '../components/EditModal'
import ConfirmModal from '../components/ConfirmModal'

const PAGE_SIZE = 25

function fmtDate(str) {
  const d = new Date(str + 'T00:00:00')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((today - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function History() {
  const { user } = useAuth()
  const { getCategoryById } = useCategories()

  // ✅ FIX 1: queryClient lets us invalidate other pages' caches after mutations
  // Before this fix, deleting an entry in History never updated the sidebar count
  const queryClient = useQueryClient()

  // ── Pagination state (UI only — useState is correct here) ──
  const [page, setPage] = useState(0)

  // ── Filters (UI only — useState is correct here) ────────
  const [filter, setFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [dateRange, setDateRange] = useState('all')

  // ── Edit / Delete modal state ────────────────────────────
  const [editingEntry, setEditingEntry] = useState(null)
  const [deleteId, setDeleteId] = useState(null)

  // ✅ FIX 1: React Query replaces useState([]) + useEffect + loadHistory()
  const { data: allEntries = [], isLoading: loading } = useQuery({
    queryKey: ['history-entries', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  const visibleCount = PAGE_SIZE * (page + 1)
  const hasMore = allEntries.length > visibleCount
  function loadMore() { setPage(p => p + 1) }

  // ✅ FIX 1: useMutation for delete — replaces raw async + setState
  // KEY: now invalidates entry-count (sidebar), totalDays, and streak too
  // Before: sidebar count was NEVER updated when deleting from History
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('entries').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history-entries', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['entry-count', user?.id] })  // sidebar
      queryClient.invalidateQueries({ queryKey: ['totalDays', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['streak', user?.id] })
      setDeleteId(null)
    },
  })

  // ✅ FIX 1: useMutation for edit
  const editMutation = useMutation({
    mutationFn: async (updated) => {
      const { data, error } = await supabase
        .from('entries')
        .update({ note: updated.note, minutes: updated.minutes, category_id: updated.category_id })
        .eq('id', updated.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['history-entries', user?.id] })
      setEditingEntry(null)
    },
  })

  function handleDelete(id) { setDeleteId(id) }
  function confirmDelete() { deleteMutation.mutate(deleteId) }
  function handleEdit(updated) { editMutation.mutate(updated) }

  function getRangeStart(range) {
    const now = new Date()
    if (range === '7days') { const d = new Date(); d.setDate(now.getDate() - 7); return d }
    if (range === '30days') { const d = new Date(); d.setDate(now.getDate() - 30); return d }
    if (range === '90days') { const d = new Date(); d.setDate(now.getDate() - 90); return d }
    return null
  }

  const rangeStart = getRangeStart(dateRange)
  const filtered = allEntries
    .filter(e => filter === 'all' || e.category_id === filter)
    .filter(e => statusFilter === 'all' || e.status === statusFilter)
    .filter(e => search === '' || e.note.toLowerCase().includes(search.toLowerCase()))
    .filter(e => !rangeStart || new Date(e.date + 'T00:00:00') >= rangeStart)

  const visibleFiltered = filtered.slice(0, visibleCount)
  const byDate = {}
  visibleFiltered.forEach(e => {
    if (!byDate[e.date]) byDate[e.date] = []
    byDate[e.date].push(e)
  })
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  const totalMins = allEntries.reduce((s, e) => s + (e.minutes || 0), 0)
  const totalHours = (totalMins / 60).toFixed(1)
  const totalDays = new Set(allEntries.map(e => e.date)).size
  const completeCount = allEntries.filter(e => e.status === 'complete').length
  const activeCount = allEntries.filter(e => e.status === 'active').length
  const catMins = {}
  allEntries.forEach(e => { catMins[e.category_id] = (catMins[e.category_id] || 0) + (e.minutes || 0) })
  const topCatId = Object.entries(catMins).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topCat = topCatId ? getCategoryById(topCatId) : null
  const activeCatIds = [...new Set(allEntries.map(e => e.category_id))]

  return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">History</h1>
          <p className="text-text-muted text-sm mt-1">Everything you've logged, in order.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search entries..."
              className="bg-surface-low border border-border text-xs px-3 py-2 pl-8 rounded w-56 focus:outline-none focus:border-primary text-text-secondary placeholder-text-muted transition-colors"
            />
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" style={{ fontSize: '16px' }}>search</span>
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
              </button>
            )}
          </div>
          <span className="text-xs text-text-muted">{filtered.length} entries</span>
        </div>
      </div>

      {allEntries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="border border-border rounded-lg px-4 py-3 bg-surface-low">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Total Hours</p>
            <p className="text-text-primary text-xl font-semibold">{totalHours}<span className="text-text-muted text-xs font-normal ml-1">h</span></p>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 bg-surface-low">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Days Logged</p>
            <p className="text-text-primary text-xl font-semibold">{totalDays}<span className="text-text-muted text-xs font-normal ml-1">days</span></p>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 bg-surface-low">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Top Category</p>
            <p className="text-sm md:text-xl font-semibold truncate" style={{ color: topCat?.color || '#eadfee' }}>{topCat?.label || '—'}</p>
          </div>
          <div className="border border-border rounded-lg px-4 py-3 bg-surface-low">
            <p className="text-text-muted text-[10px] uppercase tracking-widest mb-1">Progress</p>
            <p className="text-text-primary text-xl font-semibold">{completeCount}<span className="text-text-muted text-xs font-normal ml-1">done · {activeCount} active</span></p>
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        {['all', 'active', 'complete'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all capitalize ${statusFilter === s
              ? s === 'complete' ? 'bg-green-500 text-white border-green-500' : s === 'active' ? 'bg-blue-500 text-white border-blue-500' : 'bg-primary text-white border-primary'
              : 'border-border text-text-muted hover:bg-surface-low'}`}>
            {s === 'all' ? '📋 All' : s === 'active' ? '🔵 Active' : '✅ Complete'}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-3 flex-wrap items-center">
        {[{ id: 'all', label: 'All time' }, { id: '7days', label: 'Last 7 days' }, { id: '30days', label: 'Last 30 days' }, { id: '90days', label: 'Last 90 days' }].map(range => (
          <button key={range.id} onClick={() => setDateRange(range.id)}
            className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${dateRange === range.id ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:bg-surface-low'}`}>
            {range.id === 'all' ? '📅' : '🗓️'} {range.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${filter === 'all' ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:bg-surface-low'}`}>
          All
        </button>
        {activeCatIds.map(catId => {
          const cat = getCategoryById(catId)
          if (cat.label === 'Unknown') return null
          return (
            <button key={catId} onClick={() => setFilter(catId)}
              className="px-3 py-1.5 rounded text-xs font-medium transition-all border"
              style={filter === catId ? { backgroundColor: cat.color, color: '#fff', borderColor: cat.color } : { borderColor: '#1F2937', color: '#6B7280' }}>
              {cat.label}
            </button>
          )
        })}
      </div>

      {(search || filter !== 'all' || statusFilter !== 'all' || dateRange !== 'all') && (
        <div className="flex items-center gap-2 mb-4 text-xs text-text-muted">
          <span>Showing {filtered.length} results</span>
          <button onClick={() => { setSearch(''); setFilter('all'); setStatusFilter('all'); setDateRange('all') }}
            className="text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>close</span>
            Clear all filters
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : dates.length === 0 ? (
        <div className="border border-border rounded-lg p-16 text-center">
          <span className="material-symbols-outlined block mx-auto mb-3 text-text-muted" style={{ fontSize: '40px' }}>history</span>
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
                      <div key={entry.id}
                        className="flex group items-start gap-2 md:gap-4 p-3 md:p-4 border-y border-r border-border rounded-r-lg bg-surface-low hover:bg-surface-high transition-colors"
                        style={{ borderLeft: '3px solid ' + cat.color }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: cat.color }}>{cat.short_label}</span>
                            <span className="text-xs text-text-muted">· {time}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${entry.status === 'complete' ? 'bg-green-400/10 text-green-400 border-green-400/20' : 'bg-blue-400/10 text-blue-400 border-blue-400/20'}`}>
                              {entry.status === 'complete' ? '✅ Complete' : '🔵 Active'}
                            </span>
                          </div>
                          <p className="text-sm text-text-secondary leading-relaxed">{entry.note}</p>
                        </div>
                        {entry.minutes && (
                          <span className="hidden md:flex items-center gap-1 text-xs text-text-muted flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>schedule</span>
                            {entry.minutes}m
                          </span>
                        )}
                        <button onClick={() => setEditingEntry(entry)} className="opacity-100 md:opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all flex-shrink-0">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                        </button>
                        <button onClick={() => handleDelete(entry.id)} className="opacity-100 md:opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0">
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <button onClick={loadMore} className="flex items-center gap-2 border border-border text-text-muted hover:text-text-primary hover:bg-surface-low px-6 py-2.5 rounded text-sm transition-all">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>expand_more</span>
                Load more entries
              </button>
            </div>
          )}

          {!hasMore && allEntries.length >= PAGE_SIZE && (
            <p className="text-center text-xs text-text-muted py-4">All {allEntries.length} entries loaded</p>
          )}
        </div>
      )}

      {editingEntry && <EditModal entry={editingEntry} onSave={handleEdit} onClose={() => setEditingEntry(null)} />}
      {deleteId && <ConfirmModal message="This entry will be permanently deleted and cannot be recovered." onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />}
    </div>
  )
}
