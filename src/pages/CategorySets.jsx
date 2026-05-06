import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useCategories, PRESET_COLORS } from '../context/CategoryContext'
import { supabase } from '../lib/supabase'

// ─────────────────────────────────────────────
// Colour picker — 8 presets, no decision fatigue
// ─────────────────────────────────────────────

function ColorPicker({ value, onChange }) {
    return (
        <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map(color => (
                <button
                    key={color}
                    type="button"
                    onClick={() => onChange(color)}
                    className="w-6 h-6 rounded-full border-2 transition-all"
                    style={{
                        backgroundColor: color,
                        borderColor: value === color ? '#ffffff' : 'transparent',
                        outline: value === color ? `2px solid ${color}` : 'none',
                        outlineOffset: '1px',
                    }}
                />
            ))}
        </div>
    )
}

// ─────────────────────────────────────────────
// Single category row — view and inline edit
// ─────────────────────────────────────────────

function CategoryRow({ cat, onUpdate, onDelete }) {
    const [label, setLabel] = useState(cat.label)
    const [color, setColor] = useState(cat.color)
    const [editing, setEditing] = useState(false)

    async function handleSave() {
        await onUpdate(cat.id, {
            label,
            color,
            short_label: label.slice(0, 10).toUpperCase(),
        })
        setEditing(false)
    }

    if (!editing) {
        return (
            <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 group">
                <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm text-text-primary flex-1">{cat.label}</span>
                <button
                    onClick={() => setEditing(true)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
                </button>
                <button
                    onClick={() => onDelete(cat.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-red-400 transition-all"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                </button>
            </div>
        )
    }

    return (
        <div className="py-3 border-b border-border last:border-0 space-y-2">
            <input
                autoFocus
                value={label}
                onChange={e => setLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSave()}
                className="w-full bg-bg border border-border rounded px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary"
            />
            <ColorPicker value={color} onChange={setColor} />
            <div className="flex gap-2 pt-1">
                <button
                    onClick={handleSave}
                    className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 transition-colors"
                >
                    Save
                </button>
                <button
                    onClick={() => {
                        setLabel(cat.label)
                        setColor(cat.color)
                        setEditing(false)
                    }}
                    className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                    Cancel
                </button>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────
// Expanded set editor panel
// ─────────────────────────────────────────────

function SetEditor({ set, onClose }) {
    const { user } = useAuth()
    const queryClient = useQueryClient()
    const [showAddForm, setShowAddForm] = useState(false)
    const [newLabel, setNewLabel] = useState('')
    const [newColor, setNewColor] = useState(PRESET_COLORS[0])

    const categories = set.categories ?? []

    const addMutation = useMutation({
        mutationFn: async () => {
            const { error } = await supabase.from('categories').insert({
                user_id: user.id,
                set_id: set.id,
                label: newLabel.trim(),
                color: newColor,
                short_label: newLabel.trim().slice(0, 10).toUpperCase(),
                sort_order: categories.length,
            })
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            queryClient.invalidateQueries({ queryKey: ['categories', user.id] })
            setNewLabel('')
            setNewColor(PRESET_COLORS[0])
            setShowAddForm(false)
        },
    })

    const updateMutation = useMutation({
        mutationFn: async ({ id, fields }) => {
            const { error } = await supabase.from('categories').update(fields).eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            queryClient.invalidateQueries({ queryKey: ['categories', user.id] })
        },
    })

    const deleteCatMutation = useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('categories').delete().eq('id', id)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            queryClient.invalidateQueries({ queryKey: ['categories', user.id] })
        },
    })

    return (
        <div className="border border-primary/30 rounded-lg bg-surface-low mt-2 p-4">

            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-text-primary">
                    Editing: <span className="text-primary">{set.name}</span>
                </h3>
                <button
                    onClick={onClose}
                    className="text-text-muted hover:text-text-primary transition-colors"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                </button>
            </div>

            {/* Category list */}
            {categories.length === 0 ? (
                <p className="text-text-muted text-xs py-4 text-center">
                    No categories yet. Add one below.
                </p>
            ) : (
                <div className="mb-3">
                    {categories.map(cat => (
                        <CategoryRow
                            key={cat.id}
                            cat={cat}
                            onUpdate={(id, fields) => updateMutation.mutate({ id, fields })}
                            onDelete={(id) => deleteCatMutation.mutate(id)}
                        />
                    ))}
                </div>
            )}

            {/* Add category */}
            {showAddForm ? (
                <div className="border border-border rounded-lg p-3 space-y-3 bg-bg mt-3">
                    <input
                        autoFocus
                        value={newLabel}
                        onChange={e => setNewLabel(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && newLabel.trim() && addMutation.mutate()}
                        placeholder="Category name (e.g. Deep Work)"
                        className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <ColorPicker value={newColor} onChange={setNewColor} />
                    <div className="flex gap-2">
                        <button
                            onClick={() => newLabel.trim() && addMutation.mutate()}
                            disabled={!newLabel.trim() || addMutation.isPending}
                            className="text-xs bg-primary text-white px-3 py-1.5 rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {addMutation.isPending ? 'Adding...' : 'Add category'}
                        </button>
                        <button
                            onClick={() => { setShowAddForm(false); setNewLabel('') }}
                            className="text-xs text-text-muted hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setShowAddForm(true)}
                    disabled={categories.length >= 10}
                    className="flex items-center gap-1.5 text-xs text-primary hover:underline disabled:opacity-40 disabled:no-underline mt-2 transition-all"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
                    {categories.length >= 10 ? 'Max 10 categories reached' : 'Add category'}
                </button>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function CategorySets() {
    const { user } = useAuth()
    const { allSets, activateSet } = useCategories()
    const queryClient = useQueryClient()

    const [expandedSetId, setExpandedSetId] = useState(null)
    const [showNewSetForm, setShowNewSetForm] = useState(false)
    const [newSetName, setNewSetName] = useState('')

    // ── Create a new empty set ─────────────────────────────────────────────
    const createSetMutation = useMutation({
        mutationFn: async (name) => {
            const { data, error } = await supabase
                .from('category_sets')
                .insert({ user_id: user.id, name: name.trim(), is_active: false })
                .select()
                .single()
            if (error) throw error
            return data
        },
        onSuccess: (newSet) => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            setNewSetName('')
            setShowNewSetForm(false)
            // Auto-open the editor so user can immediately add categories
            setExpandedSetId(newSet.id)
        },
    })

    // ── Duplicate a set with all its categories ────────────────────────────
    const duplicateMutation = useMutation({
        mutationFn: async (set) => {
            const { data: newSet, error: setError } = await supabase
                .from('category_sets')
                .insert({
                    user_id: user.id,
                    name: `${set.name} (copy)`,
                    is_active: false,
                })
                .select()
                .single()
            if (setError) throw setError

            const cats = set.categories ?? []
            if (cats.length > 0) {
                const { error: catError } = await supabase.from('categories').insert(
                    cats.map(({ label, color, short_label, sort_order }) => ({
                        user_id: user.id,
                        set_id: newSet.id,
                        label,
                        color,
                        short_label,
                        sort_order,
                    }))
                )
                if (catError) throw catError
            }

            return newSet
        },
        onSuccess: (newSet) => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            setExpandedSetId(newSet.id)
        },
    })

    // ── Delete a set ───────────────────────────────────────────────────────
    const deleteSetMutation = useMutation({
        mutationFn: async (setId) => {
            const { error } = await supabase
                .from('category_sets')
                .delete()
                .eq('id', setId)
            if (error) throw error
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['category_sets', user.id] })
            queryClient.invalidateQueries({ queryKey: ['categories', user.id] })
            setExpandedSetId(null)
        },
    })

    return (
        <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8 max-w-2xl">

            {/* ── Header ── */}
            <div className="flex items-start justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-semibold text-text-primary">Category Sets</h1>
                    <p className="text-text-muted text-sm mt-1">
                        Build custom category sets for each week or project. One set is active at a time.
                    </p>
                </div>
                <button
                    onClick={() => setShowNewSetForm(v => !v)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-3 py-2 rounded text-sm font-semibold transition-all active:scale-[0.99] flex-shrink-0"
                >
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
                    New set
                </button>
            </div>

            {/* ── New set form ── */}
            {showNewSetForm && (
                <div className="border border-border rounded-lg p-4 mb-6 bg-surface-low space-y-3">
                    <label className="text-xs text-text-muted uppercase tracking-widest block">
                        Set name
                    </label>
                    <input
                        autoFocus
                        value={newSetName}
                        onChange={e => setNewSetName(e.target.value)}
                        onKeyDown={e =>
                            e.key === 'Enter' && newSetName.trim() && createSetMutation.mutate(newSetName)
                        }
                        placeholder="e.g. Week 3 Sprint, Interview Prep, Side Project"
                        className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-primary"
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={() => newSetName.trim() && createSetMutation.mutate(newSetName)}
                            disabled={!newSetName.trim() || createSetMutation.isPending}
                            className="text-sm bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            {createSetMutation.isPending ? 'Creating...' : 'Create set'}
                        </button>
                        <button
                            onClick={() => { setShowNewSetForm(false); setNewSetName('') }}
                            className="text-sm text-text-muted hover:text-text-primary transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* ── Sets list ── */}
            {allSets.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-16 text-center">
                    <span
                        className="material-symbols-outlined block mx-auto mb-3 text-text-muted"
                        style={{ fontSize: '36px' }}
                    >
                        category
                    </span>
                    <p className="text-text-muted text-sm">No sets yet. Click "New set" to get started.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {allSets.map(set => {
                        const isActive = set.is_active
                        const isExpanded = expandedSetId === set.id
                        const catCount = (set.categories ?? []).length

                        return (
                            <div key={set.id}>
                                <div
                                    className={`border rounded-lg px-5 py-4 bg-surface-low transition-all ${isActive
                                            ? 'border-primary/40 bg-primary/5'
                                            : 'border-border hover:border-border/80'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">

                                        {/* Colour dot showing first category's colour, or default */}
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor: set.categories?.[0]?.color ?? '#374151',
                                            }}
                                        />

                                        {/* Name + meta */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-text-primary truncate">
                                                    {set.name}
                                                </p>
                                                {isActive && (
                                                    <span className="text-[10px] bg-primary/15 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-muted mt-0.5">
                                                {catCount} {catCount === 1 ? 'category' : 'categories'}
                                                {catCount > 0 && (
                                                    <span className="ml-2">
                                                        · {set.categories.map(c => c.label).join(', ')}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 flex-shrink-0">

                                            {/* Activate */}
                                            {!isActive && (
                                                <button
                                                    onClick={() => activateSet(set.id)}
                                                    className="text-xs px-3 py-1.5 rounded border border-border text-text-muted hover:border-primary hover:text-primary transition-all mr-1"
                                                >
                                                    Activate
                                                </button>
                                            )}

                                            {/* Edit */}
                                            <button
                                                onClick={() => setExpandedSetId(isExpanded ? null : set.id)}
                                                title="Edit categories"
                                                className={`p-1.5 rounded transition-colors ${isExpanded
                                                        ? 'text-primary'
                                                        : 'text-text-muted hover:text-primary'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                    {isExpanded ? 'expand_less' : 'tune'}
                                                </span>
                                            </button>

                                            {/* Duplicate */}
                                            <button
                                                onClick={() => duplicateMutation.mutate(set)}
                                                title="Duplicate set"
                                                className="p-1.5 text-text-muted hover:text-primary transition-colors"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                    content_copy
                                                </span>
                                            </button>

                                            {/* Delete */}
                                            <button
                                                onClick={() => deleteSetMutation.mutate(set.id)}
                                                title={allSets.length === 1 ? "Can't delete your only set" : 'Delete set'}
                                                disabled={allSets.length === 1}
                                                className="p-1.5 text-text-muted hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                    delete
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Inline editor */}
                                {isExpanded && (
                                    <SetEditor
                                        set={set}
                                        onClose={() => setExpandedSetId(null)}
                                    />
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}