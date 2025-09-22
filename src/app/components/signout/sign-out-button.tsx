"use client"

import { useAuth } from "../../contex/contex"

export default function SignOutButton() {
  const { signOut, loading } = useAuth()

  return (
    <button
      onClick={signOut}
      disabled={loading}
      className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
    >
      Sign out
    </button>
  )
}

