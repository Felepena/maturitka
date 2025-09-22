"use client"

import UserMenu from "./user-menu"
import { useAuth } from "../contex/contex"

export default function ClientHeader() {
  const { user, loading } = useAuth()

  return (
    <header className="fixed top-0 inset-x-0 h-14 flex items-center justify-end px-4">
      {!loading && user ? <UserMenu /> : null}
    </header>
  )
}

