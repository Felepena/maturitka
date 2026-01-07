"use client"

import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"
import Link from "next/link"

export default function ClientHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 h-14 border-b border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-5xl h-full px-4 flex items-center justify-between">
        <nav className="flex items-center gap-4">
          <Link href="/" className="text-sm font-semibold text-neutral-900 hover:underline">Home</Link>
          <Link href="/protected/myproducts" className="text-sm font-semibold text-neutral-900 hover:underline">Smart Fridge</Link>
          <Link href="/protected/uiopenai/chatPictures" className="text-sm font-semibold text-neutral-900 hover:underline">Add products</Link>
          <Link href="/protected/uiopenai/stream" className="text-sm font-semibold text-neutral-900 hover:underline">Ask for help</Link>
        </nav>
        {!loading && user ? <UserMenu /> : null}
      </div>
    </header>
  )
}

