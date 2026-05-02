import { useState } from 'react'

const goals = [
  { id: 1, cat: 'DSA',           catColor: '#9333EA', title: 'Master Data Structures',  deadline: 'Dec 15, 2023', milestones: '8/12', progress: 65 },
  { id: 2, cat: 'SYSTEM DESIGN', catColor: '#3B82F6', title: 'Prepare for Senior Roles', deadline: 'Jan 30, 2024', milestones: '3/10', progress: 30 },
]

const initialTasks = [
  { id: 1, done: false, text: 'Solve 5 LeetCode Hard problems (Graph Theory)',         tag: 'DSA',           tagColor: '#9333EA', priority: 'High', day: 'Tue' },
  { id: 2, done: true,  text: 'Review Load Balancer strategies & case studies',          tag: 'System Design', tagColor: '#3B82F6', priority: 'Done', day: 'Mon' },
  { id: 3, done: false, text: 'Read "Designing Data-Intensive Applications" Ch. 4',     tag: 'Books',         tagColor: '#10B981', priority: 'Med',  day: 'Thu' },
  { id: 4, done: false, text: 'Implement a consistent hashing algorithm',               tag: 'Practical',     tagColor: '#F59E0B', priority: 'High', day: 'Fri' },
]

const achievements = [
  { title: 'AWS Solutions Architect Cert', date: "Oct '23" },
  { title: 'React Performance Audit',      date: "Sep '23" },
  { title: 'Legacy codebase refactor',     date: "Aug '23" },
]

const weekDays = ['M','T','W','T','F','S','S']
const doneIdx = [0,1,2]

export default function Goals() {
  const [tasks, setTasks] = useState(initialTasks)
  const [showNewGoal, setShowNewGoal] = useState(false)

  const toggle = (id) => setTasks(t => t.map(x => x.id === id ? {...x, done: !x.done} : x))

  return (
    <div className="ml-[240px] mt-14 p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Goal Strategy</h1>
          <p className="text-text-muted text-sm mt-1">Define, track, and execute your high-level technical objectives.</p>
        </div>
        <button
          onClick={() => setShowNewGoal(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm font-semibold transition-all active:scale-[0.99]"
        >
          <span className="material-symbols-outlined" style={{fontSize:'18px'}}>add</span>
          New Goal
        </button>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {/* Left 2/3 column */}
        <div className="col-span-2 space-y-8">

          {/* Active Objectives */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-primary" style={{fontSize:'20px'}}>bolt</span>
              <h2 className="text-lg font-semibold text-text-primary">Active Objectives</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {goals.map(goal => (
                <div
                  key={goal.id}
                  className="border border-border rounded-lg p-5 bg-surface-low hover:border-primary/40 transition-colors group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                      style={{
                        color: goal.catColor,
                        borderColor: `${goal.catColor}50`,
                        backgroundColor: `${goal.catColor}15`,
                      }}
                    >
                      {goal.cat}
                    </span>
                    <button className="text-text-muted hover:text-text-primary">
                      <span className="material-symbols-outlined" style={{fontSize:'18px'}}>more_horiz</span>
                    </button>
                  </div>

                  <h3 className="text-base font-semibold text-text-primary mb-3">{goal.title}</h3>

                  <div className="flex items-center gap-4 text-xs text-text-muted mb-5">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>calendar_today</span>
                      {goal.deadline}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined" style={{fontSize:'14px'}}>flag</span>
                      {goal.milestones} Milestones
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="text-text-muted">Progress</span>
                      <span className="font-medium" style={{color: goal.catColor}}>{goal.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{width:`${goal.progress}%`, backgroundColor: goal.catColor}}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Weekly Milestones */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#F59E0B]" style={{fontSize:'20px'}}>event_available</span>
                <h2 className="text-lg font-semibold text-text-primary">Weekly Milestones</h2>
              </div>
              <span className="text-xs text-text-muted font-mono">Week 48 • Nov 27 - Dec 3</span>
            </div>

            <div className="border border-border rounded-lg overflow-hidden bg-surface-low">
              {tasks.map((task, i) => (
                <div
                  key={task.id}
                  className={`flex items-center justify-between p-4 hover:bg-surface-high transition-colors cursor-pointer ${i < tasks.length - 1 ? 'border-b border-border' : ''}`}
                  onClick={() => toggle(task.id)}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 transition-all ${
                        task.done
                          ? 'bg-primary border-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {task.done && (
                        <span className="material-symbols-outlined text-white" style={{fontSize:'13px'}}>check</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm ${task.done ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                        {task.text}
                      </p>
                      <span className="text-[11px] font-mono" style={{color: task.tagColor}}>
                        {task.tag} • {task.priority === 'Done' ? 'Completed' : `Priority: ${task.priority}`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-text-muted flex-shrink-0 ml-4">{task.day}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right 1/3 column */}
        <div className="space-y-6">
          {/* Streak */}
          <div className="border border-border rounded-lg p-5 bg-surface-low">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-orange-400" style={{fontSize:'20px'}}>local_fire_department</span>
              </div>
              <div>
                <p className="text-base font-semibold text-text-primary">12 Day Streak</p>
                <p className="text-xs text-text-muted">Consistency is key.</p>
              </div>
            </div>

            <div className="flex justify-between mb-5">
              {weekDays.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-text-muted">{d}</span>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                      doneIdx.includes(i)
                        ? 'bg-orange-500 text-white'
                        : i === 3
                        ? 'border-2 border-orange-500/50 text-orange-400'
                        : 'border border-border text-text-muted'
                    }`}
                  >
                    {doneIdx.includes(i)
                      ? <span className="material-symbols-outlined text-white" style={{fontSize:'13px'}}>check</span>
                      : i + 1}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full h-14 rounded bg-bg border border-border flex items-end p-3">
              <div>
                <p className="text-[10px] text-orange-400 font-mono">Next Milestone:</p>
                <p className="text-xs font-semibold text-text-primary">15-Day Peak Performance</p>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="border border-border rounded-lg p-5 bg-surface-low">
            <div className="flex items-center gap-2 mb-4">
              <span className="material-symbols-outlined text-text-muted" style={{fontSize:'16px'}}>archive</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Recent Achievements</p>
            </div>
            <div className="space-y-2">
              {achievements.map(a => (
                <div key={a.title} className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-surface-high transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#10B981]" style={{fontSize:'16px'}}>task_alt</span>
                    <span className="text-sm text-text-secondary">{a.title}</span>
                  </div>
                  <span className="text-[11px] text-text-muted font-mono flex-shrink-0 ml-2">{a.date}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-3 py-2 text-xs text-text-muted hover:text-primary transition-colors flex items-center justify-center gap-1">
              View Full Archive
              <span className="material-symbols-outlined" style={{fontSize:'14px'}}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* New Goal modal */}
      {showNewGoal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setShowNewGoal(false)}
        >
          <div
            className="bg-surface-low border border-border rounded-xl p-6 w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-text-primary mb-4">New Goal</h3>
            <div className="space-y-3">
              <input placeholder="Goal title..." className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary" />
              <select className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-secondary focus:outline-none focus:border-primary">
                <option>DSA/LeetCode</option>
                <option>System Design</option>
                <option>Computer Networking</option>
                <option>ML & Math</option>
                <option>Books</option>
                <option>Job Applications</option>
              </select>
              <input type="date" className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowNewGoal(false)} className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors">Cancel</button>
              <button onClick={() => setShowNewGoal(false)} className="flex-1 bg-primary text-white py-2 rounded text-sm font-semibold hover:bg-primary/90 transition-colors">Create Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
