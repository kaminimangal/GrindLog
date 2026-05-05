// src/hooks/useStreak.js
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

// refreshKey: pass a counter that increments when you add a new log
// The hook will re-run its calculation automatically
export function useStreak(user, refreshKey = 0) {
    const [streak, setStreak] = useState(0)
    const [loggedThisWeek, setLoggedThisWeek] = useState([])
    const [totalEntries, setTotalEntries] = useState(0)

    useEffect(() => {
        if (!user) return

        async function compute() {
            const { data } = await supabase
                .from('entries')
                .select('date, created_at')
                .eq('user_id', user.id)

            if (!data || data.length === 0) {
                setStreak(0)
                setTotalEntries(0)
                setLoggedThisWeek([])
                return
            }

            setTotalEntries(data.length)

            // ── Streak calculation ──
            const uniqueDates = [...new Set(data.map(e => e.date))]
                .sort((a, b) => b.localeCompare(a))

            let count = 0
            let checkDate = new Date()
            checkDate.setHours(0, 0, 0, 0)

            for (let dateStr of uniqueDates) {
                const diff = Math.round(
                    (checkDate - new Date(dateStr + 'T00:00:00')) / 86400000
                )
                if (diff === 0 || diff === 1) {
                    count++
                    checkDate = new Date(dateStr + 'T00:00:00')
                } else {
                    break
                }
            }
            setStreak(count)

            // ── Which days this week had entries (0=Mon, 6=Sun) ──
            const weekStart = new Date()
            const dayOfWeek = weekStart.getDay()
            const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
            weekStart.setDate(weekStart.getDate() - diffToMonday)
            weekStart.setHours(0, 0, 0, 0)

            const logged = []
            for (let i = 0; i < 7; i++) {
                const d = new Date(weekStart)
                d.setDate(weekStart.getDate() + i)
                const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                if (data.some(e => e.date === dateStr)) logged.push(i)
            }
            setLoggedThisWeek(logged)
        }

        compute()
    }, [user, refreshKey]) // re-runs when refreshKey changes

    return { streak, loggedThisWeek, totalEntries }
}