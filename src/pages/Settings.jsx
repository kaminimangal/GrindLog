// src/pages/Settings.jsx
import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Section({ title, children }) {
    return (
        <div className="border border-border rounded-lg bg-surface-low overflow-hidden mb-4">
            <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    )
}

export default function Settings() {
    const { user, signOut } = useAuth()
    const [displayName, setDisplayName] = useState(
        user?.user_metadata?.full_name || ''
    )
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [saving, setSaving] = useState(false)
    const [nameSuccess, setNameSuccess] = useState('')
    const [pwSuccess, setPwSuccess] = useState('')
    const [pwError, setPwError] = useState('')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleteText, setDeleteText] = useState('')

    // Avatar initials
    const initials = (displayName || user?.email || 'U')
        .split(' ')
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)

    async function handleSaveName() {
        if (!displayName.trim()) return
        setSaving(true)
        await supabase.auth.updateUser({
            data: { full_name: displayName.trim() }
        })
        setSaving(false)
        setNameSuccess('Name updated!')
        setTimeout(() => setNameSuccess(''), 2000)
    }

    async function handleChangePassword() {
        setPwError('')
        if (newPassword.length < 6) {
            setPwError('Password must be at least 6 characters.')
            return
        }
        if (newPassword !== confirmPassword) {
            setPwError('Passwords do not match.')
            return
        }
        setSaving(true)
        const { error } = await supabase.auth.updateUser({ password: newPassword })
        setSaving(false)
        if (error) {
            setPwError(error.message)
        } else {
            setPwSuccess('Password updated!')
            setNewPassword('')
            setConfirmPassword('')
            setTimeout(() => setPwSuccess(''), 2000)
        }
    }

    async function handleDeleteAccount() {
        setSaving(true)

        try {
            // Get the user's session token — needed to prove identity to the Edge Function
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setPwError('Session expired. Please sign out and sign back in.')
                setSaving(false)
                return
            }

            const response = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                }
            )

            const data = await response.json()

            if (!response.ok || data.error) {
                setPwError(data.error || 'Could not delete account. Try again.')
                setSaving(false)
                return
            }

            // Account deleted on the server — now sign out locally
            // signOut() clears the local session so the user sees the auth page
            await signOut()

        } catch (err) {
            console.error('Delete account error:', err)
            setPwError('Something went wrong. Please try again.')
            setSaving(false)
        }
    }

    return (
        <div className="ml-0 md:ml-[240px] mt-14 p-4 md:p-8 max-w-2xl">
            <div className="mb-8">
                <h1 className="text-2xl font-semibold text-text-primary">Settings</h1>
                <p className="text-text-muted text-sm mt-1">Manage your account and preferences.</p>
            </div>

            {/* Profile */}
            <Section title="Profile">
                <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-semibold text-lg">{initials}</span>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-text-primary">
                            {displayName || user?.email}
                        </p>
                        <p className="text-xs text-text-muted">{user?.email}</p>
                        <p className="text-xs text-text-muted mt-0.5">
                            Joined {new Date(user?.created_at).toLocaleDateString('en-US', {
                                month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                            Display name
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={displayName}
                                onChange={e => setDisplayName(e.target.value)}
                                className="flex-1 bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                            />
                            <button
                                onClick={handleSaveName}
                                disabled={saving}
                                className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-60"
                            >
                                Save
                            </button>
                        </div>
                        {nameSuccess && (
                            <p className="text-green-400 text-xs mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                                {nameSuccess}
                            </p>
                        )}
                    </div>
                </div>
            </Section>

            {/* Change password — only for email users, not Google OAuth */}
            {user?.app_metadata?.provider === 'email' && (
                <Section title="Change password">
                    <div className="space-y-3">
                        <div>
                            <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                                New password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Min 6 characters"
                                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-text-muted uppercase tracking-widest mb-1.5 block">
                                Confirm new password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repeat password"
                                className="w-full bg-bg border border-border rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
                            />
                        </div>
                        {pwError && (
                            <p className="text-red-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>error</span>
                                {pwError}
                            </p>
                        )}
                        {pwSuccess && (
                            <p className="text-green-400 text-xs flex items-center gap-1">
                                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>check_circle</span>
                                {pwSuccess}
                            </p>
                        )}
                        <button
                            onClick={handleChangePassword}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-60"
                        >
                            Update password
                        </button>
                    </div>
                </Section>
            )}

            {/* Account */}
            <Section title="Account">
                <div className="flex items-center justify-between py-2">
                    <div>
                        <p className="text-sm text-text-primary">Sign out</p>
                        <p className="text-xs text-text-muted">Sign out of GrindLog on this device.</p>
                    </div>
                    <button
                        onClick={signOut}
                        className="border border-border text-text-muted hover:text-text-primary hover:bg-surface-high px-4 py-2 rounded text-sm transition-colors"
                    >
                        Sign out
                    </button>
                </div>
            </Section>

            {/* Danger zone */}
            <div className="border border-red-400/30 rounded-lg bg-red-400/5 overflow-hidden">
                <div className="px-6 py-4 border-b border-red-400/20">
                    <h2 className="text-sm font-semibold text-red-400">Danger zone</h2>
                </div>
                <div className="px-6 py-5">
                    {!showDeleteConfirm ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-text-primary">Delete account</p>
                                <p className="text-xs text-text-muted">
                                    Permanently delete your account and all data. Cannot be undone.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="border border-red-400/40 text-red-400 hover:bg-red-400/10 px-4 py-2 rounded text-sm transition-colors"
                            >
                                Delete account
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-red-400 font-medium">
                                Type DELETE to confirm
                            </p>
                            <input
                                type="text"
                                value={deleteText}
                                onChange={e => setDeleteText(e.target.value)}
                                placeholder="DELETE"
                                className="w-full bg-bg border border-red-400/30 rounded px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-red-400"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => { setShowDeleteConfirm(false); setDeleteText('') }}
                                    className="flex-1 border border-border text-text-muted py-2 rounded text-sm hover:bg-surface-high transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteText !== 'DELETE'}
                                    className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-40 text-white py-2 rounded text-sm font-semibold transition-colors"
                                >
                                    Delete permanently
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}