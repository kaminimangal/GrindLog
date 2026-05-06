import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useStreak(user) {
    const { data } = useQuery({
        // The queryKey is the cache address for this data.
        // Including user.id means each user gets their own cache slot.
        queryKey: ['streak', user?.id],

        queryFn: async () => {
            const { data } = await supabase
                .from('entries')
                .select('date')
                .eq('user_id', user.id)

            if (!data || data.length === 0) {
                return { streak: 0, loggedThisWeek: [], totalEntries: 0 }
            }

            // ── Streak calculation (identical logic, just moved inside queryFn) ──
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

            return { streak: count, loggedThisWeek: logged, totalEntries: data.length }
        },

        // Only run this query when we actually have a user.
        // Without this guard, the queryFn would fire immediately on mount
        // with user = null and crash on user.id.
        enabled: !!user,

        // Streak data doesn't change unless the user logs something.
        // Keep it fresh for 5 minutes — the mutation will invalidate it anyway.
        staleTime: 1000 * 60 * 5,
    })

    // Provide safe defaults while the query is loading.
    // This means components using this hook never need to handle undefined.
    return data ?? { streak: 0, loggedThisWeek: [], totalEntries: 0 }
}