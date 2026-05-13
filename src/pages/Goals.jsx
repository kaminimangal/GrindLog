import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../context/CategoryContext'
import { useStreak } from '../hooks/useStreak'

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Goals() {
  const { user } = useAuth()
  const { streak, loggedThisWeek, totalEntries } = useStreak(user)
  const { activeCategories: userCategories, getCategoryById } = useCategories()
  const queryClient = useQueryClient()

  // ── Form state (UI only — stays as useState) ────────────
  // These are NOT server data. They're just what the user is typing in a form.
  // React Query doesn't manage form fields — useState is still correct here.
  const [showNewGoal, setShowNewGoal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategoryId, setNewCategoryId] = useState('')
  const [newDeadline, setNewDeadline] = useState('')

  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskText, setNewTaskText] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState('Med')

  const [editingGoal, setEditingGoal] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editCategoryId, setEditCategoryId] = useState('')
  const [editDeadline, setEditDeadline] = useState('')
  const [editProgress, setEditProgress] = useState(0)
  const [editMilestonesDone, setEditMilestonesDone] = useState(0)
  const [editMilestonesTotal, setEditMilestonesTotal] = useState(0)

  const todayIndex = (new Date().getDay() + 6) % 7

  // When categories load from Supabase, set the form default to the first one.
  // We can't do useState(userCategories[0]?.id) because categories aren't loaded yet
  // at the time useState runs. So we watch for changes with useEffect.
  useEffect(() => {
    if (userCategories.length > 0 && !newCategoryId) {
      setNewCategoryId(userCategories[0].id)
    }
  }, [userCategories])

  // ── READ: Fetch goals with React Query ──────────────────
  // React Query handles: fetching, caching, loading state, and re-fetching.
  // We get `goals` (the array) and `isLoading` (boolean) for free.
  // `enabled: !!user` means "only run this query if user exists" — replaces
  // the old `if (user) loadGoals()` check inside useEffect.
  const { data: goals = [], isLoading: loading } = useQuery({
    queryKey: ['goals', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error   // React Query catches this and puts it in `error` state
      return data ?? []
    },
    enabled: !!user,
  })

  // ── READ: Fetch tasks with React Query ──────────────────
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data ?? []
    },
    enabled: !!user,
  })

  // ── WRITE: Create goal ──────────────────────────────────
  // mutationFn = what to actually do (the Supabase call)
  // onSuccess  = what to do AFTER it succeeds
  //   → invalidateQueries tells React Query: "goals data is now stale, go re-fetch"
  //   → This is why we NEVER do setGoals([newGoal, ...goals]) anymore.
  //     We just say "stale" and React Query fetches the real list from Supabase.
  const createGoalMutation = useMutation({
    mutationFn: async ({ title, categoryId, deadline }) => {
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          title,
          category_id: categoryId,
          deadline: deadline || null,
          progress: 0,
          milestones_done: 0,
          milestones_total: 0,
        })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      // Reset the form
      setNewTitle('')
      setNewCategoryId(userCategories[0]?.id || '')
      setNewDeadline('')
      setShowNewGoal(false)
    },
  })

  // ── WRITE: Update goal ──────────────────────────────────
  // Same pattern as create — but uses .update() instead of .insert()
  // and needs the goal's ID to know which row to update.
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, title, categoryId, deadline, progress, milestonesDone, milestonesTotal }) => {
      const { error } = await supabase
        .from('goals')
        .update({
          title,
          category_id: categoryId,
          deadline: deadline || null,
          progress,
          milestones_done: milestonesDone,
          milestones_total: milestonesTotal,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      setEditingGoal(null)  // closes the modal
    },
  })

  // ── WRITE: Delete goal ──────────────────────────────────
  // Deleting a goal may orphan its tasks (goal_id becomes null in DB).
  // So we invalidate BOTH caches — goals AND tasks — to stay in sync.
  const deleteGoalMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('goals').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
    },
  })

  // ── WRITE: Create task ──────────────────────────────────
  const createTaskMutation = useMutation({
    mutationFn: async ({ text, priority }) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({ user_id: user.id, text, priority, done: false })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
      setNewTaskText('')
      setNewTaskPriority('Med')
      setShowNewTask(false)
    },
  })

  // ── WRITE: Toggle task done/undone ──────────────────────
  const toggleTaskMutation = useMutation({
    mutationFn: async (task) => {
      const { error } = await supabase
        .from('tasks')
        .update({ done: !task.done })
        .eq('id', task.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
    },
  })

  // ── WRITE: Delete task ──────────────────────────────────
  const deleteTaskMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.id] })
    },
  })

  // ── Thin event handlers ─────────────────────────────────
  // These are now tiny — they just call the mutation.
  // All the Supabase logic + state management is inside the mutation objects above.
  function handleCreateGoal(e) {
    e.preventDefault()
    if (!newTitle.trim()) return
    createGoalMutation.mutate({
      title: newTitle.trim(),
      categoryId: newCategoryId,
      deadline: newDeadline,
    })
  }

  // Opens the edit modal and pre-fills all fields with the goal's current values.
  // This is the "load existing data into the form" step.
  function handleEditGoal(goal) {
    setEditingGoal(goal)
    setEditTitle(goal.title)
    setEditCategoryId(goal.category_id)
    setEditDeadline(goal.deadline || '')
    setEditProgress(goal.progress || 0)
    setEditMilestonesDone(goal.milestones_done || 0)
    setEditMilestonesTotal(goal.milestones_total || 0)
  }

  function handleUpdateGoal(e) {
    e.preventDefault()
    if (!editTitle.trim()) return
    updateGoalMutation.mutate({
      id: editingGoal.id,
      title: editTitle.trim(),
      categoryId: editCategoryId,
      deadline: editDeadline,
      progress: editProgress,
      milestonesDone: editMilestonesDone,
      milestonesTotal: editMilestonesTotal,
    })
  }


  function handleDeleteGoal(id) {
    deleteGoalMutation.mutate(id)
  }

  function handleCreateTask(e) {
    e.preventDefault()
    if (!newTaskText.trim()) return
    createTaskMutation.mutate({ text: newTaskText.trim(), priority: newTaskPriority })
  }

  function handleToggleTask(task) {
    toggleTaskMutation.mutate(task)
  }

  function handleDeleteTask(id) {
    deleteTaskMutation.mutate(id)
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
                          {cat.short_label}
                        </span>
                        {/* Edit + Delete buttons — both appear on hover */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all"
                            title="Edit goal"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                            title="Delete goal"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        </div>
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
                    disabled={createTaskMutation.isPending}
                    className="bg-primary text-white px-4 py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60"
                  >
                    {createTaskMutation.isPending ? 'Adding...' : 'Add task'}
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
                  {userCategories.map(cat => (
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
                  disabled={createGoalMutation.isPending || !newTitle.trim()}
                  className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {createGoalMutation.isPending ? 'Saving...' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ── Edit Goal Modal ── */}
      {/* editingGoal !== null means the modal is open */}
      {editingGoal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setEditingGoal(null)}
        >
          <div
            className="bg-surface-low border border-border rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary mb-4">Edit Goal</h3>
            <form onSubmit={handleUpdateGoal} className="space-y-4">

              {/* Title */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Goal title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  autoFocus
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Category</label>
                <select
                  value={editCategoryId}
                  onChange={e => setEditCategoryId(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                >
                  {userCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">Deadline (optional)</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={e => setEditDeadline(e.target.value)}
                  className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              {/* Progress slider */}
              {/* input type="range" renders a draggable slider automatically */}
              {/* Number() converts the string value to an integer */}
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-xs text-text-muted uppercase tracking-widest">Progress</label>
                  <span className="text-xs font-semibold text-primary">{editProgress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editProgress}
                  onChange={e => setEditProgress(Number(e.target.value))}
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <label className="text-xs text-text-muted uppercase tracking-widest mb-2 block">
                  Milestones completed
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="0"
                    value={editMilestonesDone}
                    onChange={e => setEditMilestonesDone(Number(e.target.value))}
                    placeholder="Done"
                    className="flex-1 min-w-0 bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                  <span className="text-text-muted text-sm flex-shrink-0">of</span>
                  <input
                    type="number"
                    min="0"
                    value={editMilestonesTotal}
                    onChange={e => setEditMilestonesTotal(Number(e.target.value))}
                    placeholder="Total"
                    className="flex-1 min-w-0 bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
                <p className="text-[11px] text-text-muted mt-1">
                  e.g. 3 of 5 milestones completed
                </p>
              </div>

              <div className="flex gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => setEditingGoal(null)}
                  className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateGoalMutation.isPending || !editTitle.trim()}
                  className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
                >
                  {updateGoalMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
