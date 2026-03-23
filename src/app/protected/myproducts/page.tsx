"use client"
import { useEffect, useState } from "react"
import { useAuth } from "@/app/contex/contex"
import { db } from "@/app/lib/config"
import { getUserInventory, type InventoryItem } from "@/app/lib/inventory"
import ProductList from "@/app/components/inventory/product-list"
import { useInventory } from "@/app/contex/inventory"
import { useRouter } from "next/navigation"

export default function MyProductsPage() {
  const { user } = useAuth()
  const { setItems: setInventory } = useInventory()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    if (!user?.uid) {
      setItems([])
      setLoading(false)
      setError("You must be signed in to view products.")
      return
    }
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const inv = await getUserInventory(db, user.uid)
        if (mounted) setItems(inv)
      } catch (e: any) {
        if (mounted) setError(e?.message ?? "Failed to load inventory")
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [user?.uid])

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 mt-6">
      <div className="mb-4 flex items-center justify-end">
        <button
          type="button"
          onClick={() => {
            try {
              setInventory(items as any)
              if (typeof window !== 'undefined') {
                window.sessionStorage.setItem('cheffai.inventory', JSON.stringify(items ?? []))
              }
            } catch {}
            router.push('/protected/uiopenai/stream')
          }}
          className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          style={{ borderColor: '#e5e7eb', backgroundColor: 'white' }}
        >
          Ask AI for Recipes
        </button>
      </div>
      {loading && <p className="text-neutral-700">Loading.</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && <ProductList items={items} />}
    </div>
  )
}
