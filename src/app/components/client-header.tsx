"use client"

import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"
import Link from "next/link"

export default function ClientHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 h-14 flex items-center justify-between px-4">
      <nav className="flex items-center gap-3">
        <Link href="/" className="text-sm font-medium text-neutral-900 hover:underline">Home</Link>
        <Link href="/protected/myproducts" className="text-sm font-medium text-neutral-900 hover:underline">Add Groceries</Link>
      </nav>
      {!loading && user ? <UserMenu /> : null}
    </header>
  )
}

