"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useAuth } from "../contex/contex"
import { User } from "lucide-react"
export default function UserMenu() {
  const { user, signOut, loading} = useAuth()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const hoverTimer = useRef<NodeJS.Timeout | null>(null)


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
    <div
      className="relative"
      ref={menuRef}
      onMouseEnter={() => {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
      }}
      onMouseLeave={() => {
        hoverTimer.current = setTimeout(() => setOpen(false), 150)
      }}
    >
        <div className="flex items-center">
            {displayName ? (
                <span className="mr-2 align-middle text-base font-medium text-neutral-900">{displayName}</span>
            ) : null}
            <button
                onClick={() => setOpen((v) => !v)}
                className="w-10 h-10 rounded-full flex items-center justify-center text-white transition-transform duration-200 hover:scale-105 bg-neutral-900"
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="User menu"
            >
                <div><User className="w-5 h-5"/></div>
            </button>

        </div>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden border bg-white"
          style={{borderColor:'#e5e7eb'}}
        >
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
