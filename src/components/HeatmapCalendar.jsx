// src/components/HeatmapCalendar.jsx
export default function HeatmapCalendar({ entries }) {
    const countMap = {}
    entries.forEach(e => {
        countMap[e.date] = (countMap[e.date] || 0) + 1
    })

    function getColor(count) {
        if (count === 0) return '#1a1f2e'
        if (count === 1) return '#5b21b6'
        if (count === 2) return '#7c3aed'
        if (count <= 4) return '#9333ea'
        return '#c084fc'
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(today)
    const dayOfWeek = endDate.getDay()
    endDate.setDate(endDate.getDate() + (dayOfWeek === 0 ? 0 : 6 - dayOfWeek))

    const startDate = new Date(endDate)
    startDate.setDate(endDate.getDate() - 52 * 7 + 1)

    const weeks = []
    let currentWeek = []
    const d = new Date(startDate)

    while (d <= endDate) {
        const dateStr = d.toISOString().slice(0, 10)
        const isFuture = d > today
        currentWeek.push({ date: dateStr, count: isFuture ? -1 : (countMap[dateStr] || 0), isFuture })
        if (currentWeek.length === 7) {
            weeks.push(currentWeek)
            currentWeek = []
        }
        d.setDate(d.getDate() + 1)
    }
    if (currentWeek.length > 0) weeks.push(currentWeek)

    // ONE label per month — placed at the week containing the 1st of that month
    const seenMonths = new Set()
    const monthLabels = new Array(weeks.length).fill('')

    weeks.forEach((week, wi) => {
        week.forEach(day => {
            if (day.isFuture) return
            const date = new Date(day.date + 'T00:00:00')
            const key = `${date.getFullYear()}-${date.getMonth()}`
            if (date.getDate() <= 7 && !seenMonths.has(key)) {
                seenMonths.add(key)
                monthLabels[wi] = date.toLocaleDateString('en-US', { month: 'short' })
            }
        })
    })

    const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']
    const activeDays = Object.keys(countMap).length
    const totalLogs = Object.values(countMap).reduce((a, b) => a + b, 0)
    const CELL = 13
    const GAP = 3

    return (
        <div className="w-full overflow-x-auto">
            <div style={{ minWidth: 580 }}>

                <div className="flex mb-1" style={{ paddingLeft: 32 }}>
                    {weeks.map((_, wi) => (
                        <div
                            key={wi}
                            className="text-[10px] text-text-muted flex-shrink-0"
                            style={{ width: CELL + GAP }}
                        >
                            {monthLabels[wi]}
                        </div>
                    ))}
                </div>

                <div className="flex">
                    <div className="flex flex-col flex-shrink-0" style={{ gap: GAP, marginRight: 6 }}>
                        {dayLabels.map((label, i) => (
                            <div
                                key={i}
                                className="text-[10px] text-text-muted flex items-center justify-end"
                                style={{ height: CELL, width: 26 }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    <div className="flex" style={{ gap: GAP }}>
                        {weeks.map((week, wi) => (
                            <div key={wi} className="flex flex-col flex-shrink-0" style={{ gap: GAP }}>
                                {week.map((day, di) => (
                                    <div
                                        key={di}
                                        title={day.isFuture ? '' : `${day.date}: ${day.count} log${day.count !== 1 ? 's' : ''}`}
                                        className="rounded-sm cursor-default"
                                        style={{
                                            width: CELL,
                                            height: CELL,
                                            backgroundColor: day.isFuture ? 'transparent' : getColor(day.count),
                                        }}
                                    />
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                    <p className="text-[11px] text-text-muted">
                        <span className="text-text-secondary font-medium">{activeDays}</span> active days ·{' '}
                        <span className="text-text-secondary font-medium">{totalLogs}</span> total logs
                    </p>
                    <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-text-muted">Less</span>
                        {[0, 1, 2, 3, 5].map(n => (
                            <div
                                key={n}
                                className="rounded-sm"
                                style={{ width: CELL, height: CELL, backgroundColor: getColor(n) }}
                            />
                        ))}
                        <span className="text-[11px] text-text-muted">More</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
