"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../contex/contex"
import { User } from "lucide-react"
export default function UserMenu() {
  const { user, signOut, loading} = useAuth()
  const [open, setOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement | null>(null)


  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", onDocClick)
    return () => document.removeEventListener("mousedown", onDocClick)
  }, [open])

  if (loading || !user) return null


  const displayName: string = user?.displayName || ""


  return (
    <div className="relative" ref={menuRef}>
        <div className="flex items-center">
            {displayName ? (
                <span className="mr-2 align-middle text-2xl">{displayName}</span>
            ) : null}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="User menu"
            >
                <div><User/></div>
            </button>

        </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-40 rounded-md border border-slate-200 bg-white shadow-md overflow-hidden"
        >

          <Link
            href="/settingsPage"
            className="block w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div className="h-px bg-slate-200" />
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
