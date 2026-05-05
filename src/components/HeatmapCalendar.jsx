// src/components/HeatmapCalendar.jsx
export default function HeatmapCalendar({ entries }) {
    // Build a map of date → count
    const countMap = {}
    entries.forEach(e => {
        countMap[e.date] = (countMap[e.date] || 0) + 1
    })

    // Generate last 364 days (52 weeks)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find the most recent Sunday to align the grid
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 363)
    // Align to Monday
    const dayOfWeek = startDate.getDay()
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDate.setDate(startDate.getDate() - diffToMonday)

    const days = []
    const d = new Date(startDate)
    while (d <= today) {
        const dateStr = d.toISOString().slice(0, 10)
        days.push({ date: dateStr, count: countMap[dateStr] || 0 })
        d.setDate(d.getDate() + 1)
    }

    // Group into weeks (columns of 7)
    const weeks = []
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(days.slice(i, i + 7))
    }

    // Color based on count
    function getColor(count) {
        if (count === 0) return '#1F2937'
        if (count === 1) return '#6b21a8'
        if (count === 2) return '#7e22ce'
        if (count <= 4) return '#9333ea'
        return '#c084fc'
    }

    // Month labels — find first week of each month
    const monthLabels = []
    weeks.forEach((week, i) => {
        const firstDay = week[0]
        if (!firstDay) return
        const date = new Date(firstDay.date + 'T00:00:00')
        if (date.getDate() <= 7) {
            monthLabels.push({
                index: i,
                label: date.toLocaleDateString('en-US', { month: 'short' }),
            })
        }
    })

    const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', '']
    const maxCount = Math.max(...Object.values(countMap), 0)
    const totalDays = Object.keys(countMap).length

    return (
        <div>
            {/* Month labels */}
            <div className="flex mb-1 pl-8">
                {weeks.map((_, i) => {
                    const label = monthLabels.find(m => m.index === i)
                    return (
                        <div
                            key={i}
                            className="text-[10px] text-text-muted"
                            style={{ width: 14, marginRight: 2, flexShrink: 0 }}
                        >
                            {label ? label.label : ''}
                        </div>
                    )
                })}
            </div>

            <div className="flex gap-1">
                {/* Day labels */}
                <div className="flex flex-col gap-0.5 mr-1">
                    {dayLabels.map((label, i) => (
                        <div
                            key={i}
                            className="text-[10px] text-text-muted flex items-center"
                            style={{ height: 12, lineHeight: '12px' }}
                        >
                            {label}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="flex gap-0.5 overflow-x-auto">
                    {weeks.map((week, wi) => (
                        <div key={wi} className="flex flex-col gap-0.5">
                            {week.map((day, di) => (
                                <div
                                    key={di}
                                    title={`${day.date}: ${day.count} log${day.count !== 1 ? 's' : ''}`}
                                    className="rounded-sm cursor-default transition-opacity hover:opacity-80"
                                    style={{
                                        width: 12,
                                        height: 12,
                                        backgroundColor: getColor(day.count),
                                        flexShrink: 0,
                                    }}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-3">
                <p className="text-[10px] text-text-muted">
                    {totalDays} active days · {Object.values(countMap).reduce((a, b) => a + b, 0)} total logs
                </p>
                <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted">Less</span>
                    {[0, 1, 2, 3, 5].map(n => (
                        <div
                            key={n}
                            className="rounded-sm"
                            style={{ width: 12, height: 12, backgroundColor: getColor(n) }}
                        />
                    ))}
                    <span className="text-[10px] text-text-muted">More</span>
                </div>
            </div>
        </div>
    )
}