import { createContext, useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

const CategoryContext = createContext(null)

// ─── The 8 preset colours users can pick from ───────────────────────────────
// These are intentionally limited. A full colour wheel creates decision fatigue.
// Users pick from these in the Settings UI (Task 4).
export const PRESET_COLORS = [
    '#9333EA', // purple
    '#3B82F6', // blue
    '#14B8A6', // teal
    '#10B981', // green
    '#F59E0B', // amber
    '#F97316', // orange
    '#EC4899', // pink
    '#EF4444', // red
]

export function CategoryProvider({ children }) {
    const { user } = useAuth()
    const queryClient = useQueryClient()

    // ── Fetch the active set + its categories in one query ──────────────────
    // We join category_sets → categories here at the query level.
    // The queryKey includes user?.id so each user has their own cache slot.
    const {
        data: activeCategories = [],
        isLoading,
    } = useQuery({
        queryKey: ['categories', user?.id],
        queryFn: async () => {
            // Step 1: find the active set for this user
            const { data: activeSet, error: setError } = await supabase
                .from('category_sets')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_active', true)
                .maybeSingle() // maybeSingle returns null instead of error if no row found

            if (setError) throw setError

            // If no active set exists yet, return empty array.
            // This happens for brand new users before onboarding seeds their first set.
            if (!activeSet) return []

            // Step 2: fetch all categories belonging to that set
            const { data: cats, error: catError } = await supabase
                .from('categories')
                .select('*')
                .eq('set_id', activeSet.id)
                .order('sort_order', { ascending: true })

            if (catError) throw catError
            return cats ?? []
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5, // 5 minutes — categories change rarely
    })

    // ── Fetch ALL sets (needed for the Settings UI in Task 4) ───────────────
    const { data: allSets = [] } = useQuery({
        queryKey: ['category_sets', user?.id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('category_sets')
                .select('*, categories(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: true })
            if (error) throw error
            return data ?? []
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 5,
    })

    // ── Activate a set ──────────────────────────────────────────────────────
    // This runs two updates: deactivate all, then activate the chosen one.
    // Running them sequentially (not in a transaction) is fine here because
    // RLS ensures a user can only touch their own rows anyway.
    const activateSetMutation = useMutation({
        mutationFn: async (setId) => {
            // Deactivate all sets for this user first
            const { error: deactivateError } = await supabase
                .from('category_sets')
                .update({ is_active: false })
                .eq('user_id', user.id)

            if (deactivateError) throw deactivateError

            // Then activate the chosen one
            const { error: activateError } = await supabase
                .from('category_sets')
                .update({ is_active: true })
                .eq('id', setId)

            if (activateError) throw activateError
        },
        onSuccess: () => {
            // Invalidate both — the active categories list AND the full sets list
            queryClient.invalidateQueries({ queryKey: ['categories', user?.id] })
            queryClient.invalidateQueries({ queryKey: ['category_sets', user?.id] })
        },
    })

    // ── Helper: look up a single category by id ─────────────────────────────
    // This replaces the old getCategoryById() from data.js.
    // Falls back gracefully if the category no longer exists.
    function getCategoryById(id) {
        // First check the active set (fastest path — most lookups land here)
        const inActive = activeCategories.find(c => c.id === id)
        if (inActive) return inActive

        // Not in active set — search all other sets
        // allSets is shaped like: [{ id, name, categories: [...] }, ...]
        for (const set of allSets) {
            const found = set.categories?.find(c => c.id === id)
            if (found) return found
        }

        // Truly unknown — category was deleted entirely
        return { id, label: 'Unknown', color: '#6B7280', short_label: '???' }
    }

    return (
        <CategoryContext.Provider
            value={{
                activeCategories,   // the categories in the currently active set
                allSets,            // all sets (for Settings UI)
                isLoading,
                activateSet: activateSetMutation.mutate,
                getCategoryById,
            }}
        >
            {children}
        </CategoryContext.Provider>
    )
}

// Custom hook — components call this instead of importing from data.js
export function useCategories() {
    const ctx = useContext(CategoryContext)
    if (!ctx) throw new Error('useCategories must be used inside CategoryProvider')
    return ctx
}