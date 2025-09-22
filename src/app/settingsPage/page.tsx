"use client"

import React, { useState } from "react"
import { useAuth } from "../contex/contex"

export default function SettingsPage() {
  const { user, updateUsername } = useAuth()
  const [username, setUsername] = useState<string>(user?.displayName || "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string>("")
  const [error, setError] = useState<string>("")

  const onSave = async () => {
    setMessage("")
    setError("")
    try {
      setSaving(true)
      await updateUsername(username.trim())
      setMessage("Username updated")
    } catch (e: any) {
      setError(e?.message || "Failed to update username")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Profile Settings</h1>
          <p className="mt-1 text-slate-600">Update your public username.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-6">
            {message ? (
              <div className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>
            ) : null}
            {error ? (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <p className="mt-1 text-xs text-slate-500">This will be shown on your profile and in the menu.</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onSave}
                disabled={saving || !username.trim()}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Username"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
