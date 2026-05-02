import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const chartData = [
  { date: 'Oct 20', mins: 85 },
  { date: 'Oct 21', mins: 120 },
  { date: 'Oct 22', mins: 60 },
  { date: 'Oct 23', mins: 200 },
  { date: 'Oct 24', mins: 95 },
  { date: 'Oct 25', mins: 140 },
  { date: 'Oct 26', mins: 75 },
  { date: 'Oct 27', mins: 180 },
  { date: 'Oct 28', mins: 110 },
  { date: 'Oct 29', mins: 90 },
  { date: 'Oct 30', mins: 220 },
  { date: 'Oct 31', mins: 130 },
  { date: 'Nov 1',  mins: 160 },
  { date: 'Nov 2',  mins: 50  },
  { date: 'Nov 3',  mins: 195 },
  { date: 'Nov 4',  mins: 80  },
  { date: 'Nov 5',  mins: 145 },
  { date: 'Nov 6',  mins: 100 },
  { date: 'Nov 7',  mins: 170 },
  { date: 'Nov 8',  mins: 230 },
  { date: 'Nov 9',  mins: 65  },
  { date: 'Nov 10', mins: 190 },
  { date: 'Nov 11', mins: 115 },
  { date: 'Nov 12', mins: 250 },
  { date: 'Nov 13', mins: 88  },
  { date: 'Nov 14', mins: 135 },
  { date: 'Nov 15', mins: 175 },
  { date: 'Nov 16', mins: 210 },
  { date: 'Nov 17', mins: 95  },
  { date: 'Nov 18', mins: 160 },
]

const skills = [
  { label: 'Data Structures & Algorithms', hours: 42.5, color: '#9333EA', pct: 75 },
  { label: 'System Design',               hours: 28.2, color: '#3B82F6', pct: 50 },
  { label: 'ML & Math',                   hours: 19.8, color: '#F59E0B', pct: 35 },
  { label: 'Computer Networking',         hours: 15.5, color: '#14B8A6', pct: 27 },
  { label: 'Books',                       hours: 12.0, color: '#10B981', pct: 21 },
  { label: 'Job Applications',            hours: 8.5,  color: '#F97316', pct: 15 },
]

const milestones = [
  { icon: '🏆', title: '50 LeetCode Solved',    desc: 'Medium to Hard difficulty focus. Completed 3 days ago.' },
  { icon: '🎯', title: 'System Design Intro',   desc: 'Fundamentals and Scalability module finished.' },
  { icon: '⭐', title: '30 Day Study Streak',   desc: 'Achieved 2 weeks ago. Currently on a new 12-day run.' },
]

const statCards = [
  { label: 'Total Hours Studied', value: '142h', sub: '↑ 12% from last month', icon: 'schedule',       subColor: '#10B981' },
  { label: 'Top Category',        value: 'DSA',  sub: '42.5 hours total',       icon: 'code',           subColor: '#6B7280' },
  { label: 'Weekly Consistency',  value: '92%',  sub: null,                     icon: 'bolt',           subColor: null, isBar: true },
  { label: 'Current Streak',      value: '12 days', sub: 'Personal best: 24 days', icon: 'local_fire_department', subColor: '#6B7280' },
]

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
  return (
    <div className="ml-[240px] mt-14 p-8 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-text-primary">Progress Tracker</h1>
          <p className="text-text-muted text-sm mt-1">Analyzing your cognitive performance and study trends.</p>
        </div>
        <button className="flex items-center gap-2 border border-border text-text-secondary text-sm px-3 py-2 rounded hover:bg-surface-low transition-colors">
          <span className="material-symbols-outlined" style={{fontSize:'16px'}}>calendar_today</span>
          Last 30 Days
          <span className="material-symbols-outlined" style={{fontSize:'16px'}}>expand_more</span>
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((card) => (
          <div key={card.label} className="border border-border rounded-lg p-5 bg-surface-low">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">{card.label}</p>
              <span className="material-symbols-outlined text-text-muted" style={{fontSize:'16px'}}>{card.icon}</span>
            </div>
            <p className="text-2xl font-semibold text-text-primary mb-2">{card.value}</p>
            {card.isBar ? (
              <div className="w-full h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full bg-[#F59E0B] rounded-full" style={{width:'92%'}} />
              </div>
            ) : (
              <p className="text-xs" style={{color: card.subColor}}>{card.sub}</p>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="border border-border rounded-lg p-6 bg-surface-low mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-text-primary">Focus Distribution</h2>
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Minutes per day
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} barSize={14} margin={{left:-20, right:0, top:4, bottom:0}}>
            <XAxis
              dataKey="date"
              tick={{fill:'#6B7280', fontSize:11}}
              tickLine={false}
              axisLine={false}
              interval={6}
            />
            <YAxis tick={{fill:'#6B7280', fontSize:11}} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{fill:'rgba(147,51,234,0.08)'}} />
            <Bar dataKey="mins" radius={[2,2,0,0]}>
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.mins === Math.max(...chartData.map(d => d.mins)) ? '#9333EA' : '#2e2832'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Skill Breakdown + Milestones */}
      <div className="grid grid-cols-2 gap-6">
        {/* Skill Breakdown */}
        <div className="border border-border rounded-lg p-6 bg-surface-low">
          <h2 className="text-base font-semibold text-text-primary mb-5">Skill Breakdown</h2>
          <div className="space-y-4">
            {skills.map((skill) => (
              <div key={skill.label}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{backgroundColor: skill.color}} />
                    <span className="text-sm text-text-secondary">{skill.label}</span>
                  </div>
                  <span className="text-sm font-medium text-text-muted">{skill.hours}h</span>
                </div>
                <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{width:`${skill.pct}%`, backgroundColor: skill.color}}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Milestones + Deep Insight */}
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-6 bg-surface-low">
            <h2 className="text-base font-semibold text-text-primary mb-4">Milestones</h2>
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.title} className="flex items-start gap-4 p-4 border border-border rounded-lg hover:bg-surface-high transition-colors">
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

          {/* Deep Insight card */}
          <div className="border border-primary/20 rounded-lg p-5 bg-primary/5">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-primary" style={{fontSize:'16px'}}>lightbulb</span>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Deep Insight</p>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">
              Your most productive window is between <span className="text-text-primary font-medium">9:00 PM and 11:30 PM</span>. 
              You complete 24% more tasks during this period.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
