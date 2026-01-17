"use client"

import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"
import Link from "next/link"
import { ChefHat } from "lucide-react"

export default function navbar() {
  const { user, loading } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 h-18 border-b border-neutral-300/40 bg-[#F5F0D7]/80 backdrop-blur supports-[backdrop-filter]:bg-[#F5F0D7]/60">
      <div className="mx-auto max-w-6xl h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full" style={{backgroundColor:'#5E7A0F'}}>
              <ChefHat className="w-4 h-4 text-[#F5F0D7]" />
            </span>
            <span className="text-sm font-bold tracking-tight text-neutral-900 group-hover:text-neutral-950">CheffAI</span>
          </Link>
        </div>
        <nav className="hidden sm:flex items-center gap-6">
          <Link href="/protected/myproducts" className="text-sm font-medium text-neutral-800 hover:text-[#5E7A0F]">Smart Fridge</Link>
          <Link href="/protected/uiopenai/chatPictures" className="text-sm font-medium text-neutral-800 hover:text-[#5E7A0F]">Add Products</Link>
        </nav>
        <div className="flex items-center gap-3">
          {!loading && !user && (
            <Link href="/protected/uiopenai/stream" className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-sm" style={{backgroundColor:'#5E7A0F'}}>
              Get Started
            </Link>
          )}
          {!loading && user ? <UserMenu /> : null}
        </div>
      </div>
    </header>
  )
}
