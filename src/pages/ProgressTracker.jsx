import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../context/CategoryContext'
import HeatmapCalendar from '../components/HeatmapCalendar'

// Custom tooltip shown when hovering over a bar in the chart
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1F1924] border border-border rounded px-3 py-2 text-xs">
        <p className="text-text-muted mb-1">{label}</p>
        <p className="text-primary font-semibold">{payload[0].value} min</p>
      </div>
    )
  }
  return null
}

export default function ProgressTracker() {
  const { user } = useAuth()

  // Get the user's real categories from Supabase (via CategoryContext cache)
  // getCategoryById → used for the "Top Category" stat card
  // userCategories → used for the Skill Breakdown section
  const { activeCategories: userCategories, getCategoryById } = useCategories()

  // dateRange is UI state — stays as useState (not server data)
  const [dateRange, setDateRange] = useState('30days')

  // ── READ: Fetch ALL entries with React Query ────────────
  // No date filter here — we fetch everything and filter in JS.
  // The dateRange buttons change the JS filter, not the query itself.
  // queryKey is 'all-entries' (distinct from Dashboard's 'entries' cache
  // which only fetches today's entries).
  const { data: allEntries = [], isLoading: loading } = useQuery({
    queryKey: ['all-entries', user?.id],
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

  // ── Date range helpers ──────────────────────────────────
  function getRangeStart(range) {
    const now = new Date()
    if (range === '7days') { const d = new Date(); d.setDate(now.getDate() - 7); return [d, 7] }
    if (range === '30days') { const d = new Date(); d.setDate(now.getDate() - 30); return [d, 30] }
    if (range === '90days') { const d = new Date(); d.setDate(now.getDate() - 90); return [d, 90] }
    return [null, 90]
  }

  const [rangeStart, numDays] = getRangeStart(dateRange)

  // Filter entries to the selected date range
  const filteredEntries = rangeStart
    ? allEntries.filter(e => new Date(e.date + 'T00:00:00') >= rangeStart)
    : allEntries

  // ── STAT 1: Total hours ─────────────────────────────────
  const totalMins = filteredEntries.reduce((s, e) => s + (e.minutes || 0), 0)
  const totalHours = (totalMins / 60).toFixed(1)

  // ── STAT 2: Top category ────────────────────────────────
  // getCategoryById now comes from useCategories() — reads real Supabase data
  const catMins = {}
  filteredEntries.forEach(e => {
    catMins[e.category_id] = (catMins[e.category_id] || 0) + (e.minutes || 0)
  })
  const topCatId = Object.entries(catMins).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topCat = topCatId ? getCategoryById(topCatId) : null

  // ── STAT 3: Streak ──────────────────────────────────────
  const uniqueDates = [...new Set(allEntries.map(e => e.date))]
    .sort((a, b) => b.localeCompare(a))
  let streak = 0
  let checkDate = new Date(); checkDate.setHours(0, 0, 0, 0)
  for (let dateStr of uniqueDates) {
    const entryDate = new Date(dateStr + 'T00:00:00')
    const diff = Math.round((checkDate - entryDate) / 86400000)
    if (diff === 0 || diff === 1) { streak++; checkDate = entryDate }
    else break
  }

  // ── STAT 4: Weekly consistency ──────────────────────────
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - i)
    return d.toISOString().slice(0, 10)
  })
  const daysWithEntries = last7Days.filter(day =>
    allEntries.some(e => e.date === day)
  ).length
  const consistency = Math.round((daysWithEntries / 7) * 100)

  // ── CHART DATA: Activity per day ────────────────────────
  const realChartData = [...Array(numDays)].map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (numDays - 1 - i))
    const dateStr = d.toISOString().slice(0, 10)
    const dayMins = allEntries
      .filter(e => e.date === dateStr)
      .reduce((s, e) => s + (e.minutes || 0), 0)
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      mins: dayMins,
    }
  })
  const maxMins = Math.max(...realChartData.map(d => d.mins), 0)

  // ── SKILL BREAKDOWN ─────────────────────────────────────
  // KEY FIX: was CATEGORIES.map(...) — showed all 9 hard-coded categories.
  // Now uses userCategories.map(...) — shows only the user's real categories.
  // If they have "Frontend", "Backend", "Design" — those appear here, not DSA etc.
  const skillData = userCategories.map(cat => {
    const mins = filteredEntries
      .filter(e => e.category_id === cat.id)
      .reduce((s, e) => s + (e.minutes || 0), 0)
    return { ...cat, hours: (mins / 60).toFixed(1), mins }
  }).filter(s => s.mins > 0).sort((a, b) => b.mins - a.mins)
  const maxSkillMins = skillData[0]?.mins || 1

  // ── MILESTONES ──────────────────────────────────────────
  const totalEntries = allEntries.length
  const completeCount = allEntries.filter(e => e.status === 'complete').length
  const milestones = [
    {
      icon: '📝',
      title: `${totalEntries} Total Logs`,
      desc: totalEntries >= 50
        ? 'Incredible consistency. You are building a real habit.'
        : `${50 - totalEntries} more to hit 50 logs!`,
    },
    {
      icon: '✅',
      title: `${completeCount} Tasks Completed`,
      desc: completeCount > 0
        ? 'You follow through. That separates you from 90% of people.'
        : 'Mark your first entry as complete on the dashboard!',
    },
    {
      icon: '🔥',
      title: `${streak} Day Streak`,
      desc: streak >= 7
        ? 'A week straight! Consistency is your superpower.'
        : streak > 0
          ? `${7 - streak} more days to hit a 7-day streak!`
          : 'Log today to start your streak!',
    },
  ]

  // ── DEEP INSIGHT: peak focus hour ──────────────────────
  const hourCounts = {}
  allEntries.forEach(e => {
    const hour = new Date(e.created_at).getHours()
    hourCounts[hour] = (hourCounts[hour] || 0) + 1
  })
  const topHour = Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const topHourLabel = topHour
    ? `${topHour % 12 || 12}:00 ${topHour >= 12 ? 'PM' : 'AM'}`
    : null

  // ── Early returns ───────────────────────────────────────
  if (loading) return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8 text-text-muted text-sm">
      Loading your stats...
    </div>
  )

  if (allEntries.length === 0) return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">
      <div className="border border-border rounded-lg p-16 text-center">
        <span className="material-symbols-outlined block mx-auto mb-3 text-text-muted" style={{ fontSize: '40px' }}>monitoring</span>
        <p className="text-text-primary font-medium mb-1">No data yet</p>
        <p className="text-text-muted text-sm">Start logging on the Dashboard and your stats will appear here.</p>
      </div>
    </div>
  )

  return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Progress Tracker</h1>
          <p className="text-text-muted text-sm mt-1">Your real stats from your real grind.</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="border border-border rounded-lg p-5 bg-surface-low">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Total Hours</p>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>schedule</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">
            {totalHours}<span className="text-text-muted text-sm font-normal ml-1">h</span>
          </p>
          <p className="text-xs text-text-muted mt-1">{totalEntries} log entries</p>
        </div>

        <div className="border border-border rounded-lg p-5 bg-surface-low">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Top Category</p>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>code</span>
          </div>
          <p className="text-sm md:text-xl font-semibold truncate" style={{ color: topCat?.color || '#eadfee' }}>
            {topCat?.label || '—'}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {topCat ? (catMins[topCat.id] / 60).toFixed(1) + 'h logged' : ''}
          </p>
        </div>

        <div className="border border-border rounded-lg p-5 bg-surface-low">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Weekly Consistency</p>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>bolt</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">{consistency}%</p>
          <div className="w-full h-1 bg-border rounded-full overflow-hidden mt-2">
            <div className="h-full bg-[#F59E0B] rounded-full" style={{ width: consistency + '%' }} />
          </div>
        </div>

        <div className="border border-border rounded-lg p-5 bg-surface-low">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Current Streak</p>
            <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>local_fire_department</span>
          </div>
          <p className="text-2xl font-semibold text-text-primary">
            {streak}<span className="text-text-muted text-sm font-normal ml-1">{streak === 1 ? 'day' : 'days'}</span>
          </p>
          <p className="text-xs text-text-muted mt-1">
            {streak >= 7 ? '🔥 On fire!' : streak > 0 ? 'Keep going!' : 'Log today!'}
          </p>
        </div>
      </div>

      {/* Heatmap */}
      <div className="border border-border rounded-lg p-6 bg-surface-low mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Activity Heatmap</h2>
          <span className="text-xs text-text-muted">Last 12 months</span>
        </div>
        <HeatmapCalendar entries={allEntries} />
      </div>

      {/* Activity chart */}
      <div className="border border-border rounded-lg p-6 bg-surface-low mb-6">
        <div className="flex flex-col gap-3 mb-4">
          <h2 className="text-base font-semibold text-text-primary">
            Focus Distribution — Last {numDays} Days
          </h2>
          <div className="flex gap-2 flex-wrap">
            {[
              { id: '7days', label: 'Last 7 days' },
              { id: '30days', label: 'Last 30 days' },
              { id: '90days', label: 'Last 90 days' },
            ].map(range => (
              <button
                key={range.id}
                onClick={() => setDateRange(range.id)}
                className={`px-3 py-1.5 rounded text-xs font-medium border transition-all ${dateRange === range.id
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-text-muted hover:bg-surface-low'
                  }`}
              >
                🗓️ {range.label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Minutes per day
          </div>
        </div>

        {totalMins === 0 ? (
          <p className="text-text-muted text-sm text-center py-8">
            No minutes logged yet. Add time spent when logging!
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={realChartData}
              barSize={numDays === 7 ? 20 : numDays === 90 ? 5 : 14}
              margin={{ left: -20, right: 0, top: 4, bottom: 0 }}
            >
              <XAxis
                dataKey="date"
                tick={{ fill: '#6B7280', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={numDays === 7 ? 0 : numDays === 90 ? 9 : 6}
              />
              <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(147,51,234,0.08)' }} />
              <Bar dataKey="mins" radius={[2, 2, 0, 0]}>
                {realChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.mins === maxMins && maxMins > 0 ? '#9333EA' : '#2e2832'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Skill Breakdown + Milestones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="border border-border rounded-lg p-6 bg-surface-low">
          <h2 className="text-base font-semibold text-text-primary mb-5">Skill Breakdown</h2>
          {skillData.length === 0 ? (
            <p className="text-text-muted text-sm">No data yet.</p>
          ) : (
            <div className="space-y-4">
              {skillData.map(skill => (
                <div key={skill.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: skill.color }} />
                      <span className="text-sm text-text-secondary">{skill.label}</span>
                    </div>
                    <span className="text-sm font-medium text-text-muted">{skill.hours}h</span>
                  </div>
                  <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(skill.mins / maxSkillMins) * 100}%`,
                        backgroundColor: skill.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border border-border rounded-lg p-6 bg-surface-low">
            <h2 className="text-base font-semibold text-text-primary mb-4">Milestones</h2>
            <div className="space-y-3">
              {milestones.map(m => (
                <div
                  key={m.title}
                  className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-surface-high transition-colors"
                >
                  <div className="w-9 h-9 bg-surface-high rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{m.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>lightbulb</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Deep Insight</p>
            </div>
            {topHourLabel ? (
              <p className="text-sm text-text-secondary leading-relaxed">
                You log most entries around{' '}
                <span className="text-text-primary font-medium">{topHourLabel}</span>.
                That's your peak focus window — protect it. 🔥
              </p>
            ) : (
              <p className="text-sm text-text-secondary">
                Log more entries and we'll find your peak productive hours!
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
