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
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#F5F0D7]"
                style={{backgroundColor:'#5E7A0F'}}
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
          className="absolute right-0 mt-2 w-44 rounded-xl shadow-lg overflow-hidden border"
          style={{backgroundColor:'#EEF3E0', borderColor:'#D6E3B8'}}
        >
          <Link
            href="/settingsPage"
            className="block w-full text-left px-4 py-2 text-sm text-neutral-800 hover:bg-[#E3ECCD]"
            onClick={() => setOpen(false)}
          >
            Settings
          </Link>
          <div className="h-px" style={{backgroundColor:'#D6E3B8'}} />
          <button
            onClick={signOut}
            className="w-full text-left px-4 py-2 text-sm text-neutral-800 hover:bg-[#E3ECCD]"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
