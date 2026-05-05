import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, getCategoryById } from '../data'
import { useStreak } from '../hooks/useStreak'

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Goals() {
  const { user } = useAuth()
  const { streak, loggedThisWeek, totalEntries } = useStreak(user)

  const [goals, setGoals] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  // New goal modal state
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('dsa')
  const [newDeadline, setNewDeadline] = useState('')
  const [saving, setSaving] = useState(false)

  // New task inline form
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Med')

  const todayIndex = (new Date().getDay() + 6) % 7

  useEffect(() => {
    if (user) {
      loadGoals()
      loadTasks()
    }
  }, [user])

  // ── Data loading ────────────────────────────────────────
  async function loadGoals() {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) console.error('loadGoals error:', error.message)
    if (data) setGoals(data)
    setLoading(false)
  }

  async function loadTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) console.error('loadTasks error:', error.message)
    if (data) setTasks(data)
  }

  // ── Goal CRUD ───────────────────────────────────────────
  async function handleCreateGoal(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: newTitle.trim(),
        category_id: newCategoryId,
        deadline: newDeadline || null,
        progress: 0,
        milestones_done: 0,
        milestones_total: 0,
      })
      .select()
      .single()

    if (error) console.error('createGoal error:', error.message)
    if (data) {
      setGoals([data, ...goals]) // prepend so it appears at top immediately
      setNewTitle('')
      setNewCategoryId('dsa')
      setNewDeadline('')
      setShowNewGoal(false)
    }
    setSaving(false)
  }

  async function handleDeleteGoal(id) {
    await supabase.from('goals').delete().eq('id', id)
    setGoals(goals.filter(g => g.id !== id))
    // Tasks with goal_id = id become orphaned (goal_id set to null by DB)
    // So we remove them from view too for a clean experience
    setTasks(tasks.filter(t => t.goal_id !== id))
  }

  // ── Task CRUD ───────────────────────────────────────────
  async function handleCreateTask(e) {
    e.preventDefault()
    if (!newTaskText.trim()) return

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        text: newTaskText.trim(),
        priority: newTaskPriority,
        done: false,
      })
      .select()
      .single()

    if (error) console.error('createTask error:', error.message)
    if (data) {
      setTasks([...tasks, data])
      setNewTaskText('')
      setNewTaskPriority('Med')
      setShowNewTask(false)
    }
  }

  async function handleToggleTask(task) {
    const newDone = !task.done
    const { error } = await supabase
      .from('tasks')
      .update({ done: newDone })
      .eq('id', task.id)

    if (error) console.error('toggleTask error:', error.message)
    else setTasks(tasks.map(t => t.id === task.id ? { ...t, done: newDone } : t))
  }

  async function handleDeleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
    setTasks(tasks.filter(t => t.id !== id))
  }

  // ── Week label for header ───────────────────────────────
  const weekStart = new Date()
  const diffToMon = weekStart.getDay() === 0 ? 6 : weekStart.getDay() - 1
  weekStart.setDate(weekStart.getDate() - diffToMon)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  const weekLabel =
    weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' – ' +
    weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  // ── Real achievements ───────────────────────────────────
  const achievements = []
  if (totalEntries >= 1) achievements.push({ title: 'First log! The journey begins.', icon: '🌱' })
  if (totalEntries >= 10) achievements.push({ title: '10 logs completed!', icon: '⚡' })
  if (totalEntries >= 50) achievements.push({ title: '50 logs — serious grinder!', icon: '🔥' })
  if (streak >= 7) achievements.push({ title: '7-day streak achieved!', icon: '🏆' })
  if (streak >= 14) achievements.push({ title: '14-day streak — unstoppable!', icon: '💎' })
  if (achievements.length === 0) {
    achievements.push({ title: 'Log your first entry to unlock achievements!', icon: '🎯' })
  }

  return (
    <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8">

      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-8 gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Goal Strategy</h1>
          <p className="text-text-muted text-sm mt-1">
            Define, track, and execute your high-level objectives.
          </p>
        </div>
        <button
          onClick={() => setShowNewGoal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm font-semibold transition-all active:scale-[0.99] flex-shrink-0"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* ── LEFT: Objectives + Tasks ── */}
        <div className="col-span-2 space-y-8">

          {/* Active Objectives */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: '20px' }}>bolt</span>
              <h2 className="text-lg font-semibold text-text-primary">Active Objectives</h2>
            </div>

            {loading ? (
              <p className="text-text-muted text-sm">Loading goals...</p>
            ) : goals.length === 0 ? (
              <div className="border border-dashed border-border rounded-lg p-12 text-center">
                <span className="material-symbols-outlined block mx-auto mb-2 text-text-muted" style={{ fontSize: '36px' }}>flag</span>
                <p className="text-text-muted text-sm">No goals yet. Click "New Goal" above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {goals.map(goal => {
                  const cat = getCategoryById(goal.category_id)
                  const deadlineLabel = goal.deadline
                    ? new Date(goal.deadline + 'T00:00:00').toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })
                    : 'No deadline'

                  return (
                    <div
                      key={goal.id}
                      className="border border-border rounded-lg p-5 bg-surface-low hover:border-primary/40 transition-colors group"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                          style={{
                            color: cat.color,
                            borderColor: `${cat.color}50`,
                            backgroundColor: `${cat.color}15`,
                          }}
                        >
                          {cat.short}
                        </span>
                        <button
                          onClick={() => handleDeleteGoal(goal.id)}
                          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                        </button>
                      </div>

                      <h3 className="text-base font-semibold text-text-primary mb-3">{goal.title}</h3>

                      <div className="flex items-center gap-4 text-xs text-text-muted mb-5">
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>calendar_today</span>
                          {deadlineLabel}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>flag</span>
                          {goal.milestones_done}/{goal.milestones_total} Milestones
                        </span>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="text-text-muted">Progress</span>
                          <span className="font-medium" style={{ color: cat.color }}>{goal.progress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${goal.progress}%`, backgroundColor: cat.color }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Weekly Milestones / Tasks */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B]" style={{ fontSize: '20px' }}>event_available</span>
                <h2 className="text-lg font-semibold text-text-primary">Weekly Milestones</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-text-muted font-mono hidden sm:block">{weekLabel}</span>
                <button
                  onClick={() => setShowNewTask(t => !t)}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                  Add task
                </button>
              </div>
            </div>

            {/* Inline new-task form */}
            {showNewTask && (
              <form
                onSubmit={handleCreateTask}
                className="border border-border rounded-lg p-4 mb-3 bg-surface-low space-y-3"
              >
                <input
                  type="text"
                  value={newTaskText}
                  onChange={e => setNewTaskText(e.target.value)}
                  placeholder="What do you need to do this week?"
                  autoFocus
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    className="bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  >
                    <option value="High">🔴 High priority</option>
                    <option value="Med">🟡 Medium priority</option>
                    <option value="Low">🟢 Low priority</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Add task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewTask(false)}
                    className="text-text-muted hover:text-text-primary text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="border border-border rounded-lg overflow-hidden bg-surface-low">
              {tasks.length === 0 ? (
                <div className="p-10 text-center text-text-muted text-sm">
                  <span className="material-symbols-outlined block mx-auto mb-2" style={{ fontSize: '32px' }}>checklist</span>
                  No tasks yet — click "Add task" above.
                </div>
              ) : (
                tasks.map((task, i) => {
                  const priorityColor =
                    task.priority === 'High' ? '#EF4444'
                      : task.priority === 'Med' ? '#F59E0B'
                        : '#10B981'

                  return (
                    <div
                      key={task.id}
                      className={`flex items-center justify-between p-4 hover:bg-surface-high transition-colors group ${i < tasks.length - 1 ? 'border-b border-border' : ''}`}
                    >
                      <div
                        className="flex items-center gap-4 flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleToggleTask(task)}
                      >
                        <div
                          className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all ${task.done ? 'bg-primary border-primary' : 'border-border hover:border-primary'
                            }`}
                        >
                          {task.done && (
                            <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>check</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm truncate ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                            {task.text}
                          </p>
                          <span className="text-[11px] font-mono" style={{ color: task.done ? '#6B7280' : priorityColor }}>
                            {task.done ? 'Completed' : `Priority: ${task.priority}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all flex-shrink-0 ml-4"
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>delete</span>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </section>
        </div>

        {/* ── RIGHT: Streak + Achievements ── */}
        <div className="space-y-6">
          <div className="border border-border rounded-lg p-5 bg-surface-low">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-400" style={{ fontSize: '20px' }}>local_fire_department</span>
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">{streak} Day Streak</p>
                <p className="text-xs text-text-muted">Consistency is key.</p>
              </div>
            </div>

            <div className="flex justify-between mb-5">
              {weekDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-muted">{d}</span>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${loggedThisWeek.includes(i)
                      ? 'bg-orange-500 text-white'
                      : i === todayIndex
                        ? 'border-2 border-orange-500/50 text-orange-400'
                        : 'border border-border text-text-muted'
                    }`}>
                    {loggedThisWeek.includes(i)
                      ? <span className="material-symbols-outlined text-white" style={{ fontSize: '13px' }}>check</span>
                      : i + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full rounded bg-bg border border-border p-3">
              <p className="text-[10px] text-orange-400 font-mono">Next Milestone:</p>
              <p className="text-xs font-semibold text-text-primary mt-0.5">
                {streak < 7 ? `${7 - streak} more days → 7-day streak!`
                  : streak < 14 ? `${14 - streak} more days → 2-week streak!`
                    : streak < 30 ? `${30 - streak} more days → 30-day streak!`
                      : '🔥 Legend status unlocked!'}
              </p>
            </div>
          </div>

          <div className="border border-border rounded-lg p-5 bg-surface-low">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-text-muted" style={{ fontSize: '16px' }}>workspace_premium</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Achievements</p>
            </div>
            <div className="space-y-2">
              {achievements.map(a => (
                <div
                  key={a.title}
                  className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-surface-high transition-colors"
                >
                  <span style={{ fontSize: '16px' }}>{a.icon}</span>
                  <span className="text-sm text-text-secondary">{a.title}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── New Goal Modal ── */}
      {showNewGoal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowNewGoal(false)}
        >
          <div
            className="bg-surface-low border border-border rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary mb-4">New Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                  Goal title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Data Structures"
                  autoFocus
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                  Category
                </label>
                <select
                  value={newCategoryId}
                  onChange={e => setNewCategoryId(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                  Target deadline (optional)
                </label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={e => setNewDeadline(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setShowNewGoal(false)}
                  className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newTitle.trim()}
                  className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}