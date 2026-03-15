"use client"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useInventory } from "@/app/contex/inventory"
import { useRouter } from "next/navigation"
import Modal from "@/app/components/ui/modal"
import { useAuth } from "@/app/contex/contex"
import { db } from "@/app/lib/config"
import {
  type Firestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore"
import { updateExpiryByName, decrementOrRemoveByName, removeAllByName } from "@/app/lib/receipt-mutations-aggregate"

// Types for aggregated inventory items
type InventoryItem = {
  name: string
  quantity: number
  totalPrice: number
  earliestExpiry: string | null
}

async function getUserInventory(
  database: Firestore,
  userId: string
): Promise<InventoryItem[]> {
  // Normalize various date inputs (strings like DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD, or Firestore Timestamps)
  const toDate = (val: any): Date | null => {
    if (!val) return null
    // Firestore Timestamp
    if (typeof val === "object" && typeof val.toDate === "function") {
      const d = val.toDate()
      return isNaN(+d) ? null : d
    }
    if (typeof val === "number") {
      const d = new Date(val)
      return isNaN(+d) ? null : d
    }
    if (typeof val !== "string") return null
    const s = val.trim()
    if (!s) return null
    // YYYY-MM-DD or YYYY/MM/DD
    let m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
    if (m) {
      const [, yy, mm, dd] = m
      const d = new Date(Number(yy), Number(mm) - 1, Number(dd))
      return isNaN(+d) ? null : d
    }
    // DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY (assume DMY)
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
    if (m) {
      const [, dd, mm, yy] = m
      const d = new Date(Number(yy), Number(mm) - 1, Number(dd))
      return isNaN(+d) ? null : d
    }
    // Fallback to Date.parse
    const t = Date.parse(s)
    if (Number.isFinite(t)) {
      const d = new Date(t)
      return isNaN(+d) ? null : d
    }
    return null
  }
  try {
    const nestedRef = collection(database, "users", userId, "receipts")
    let snapshot = await getDocs(nestedRef)

    // If no docs found, try legacy top-level `receipts` with `userId` field
    if (snapshot.empty) {
      const topRef = collection(database, "receipts")
      const q = query(topRef, where("userId", "==", userId))
      snapshot = await getDocs(q)
    }

  const buckets = new Map<
    string,
    { nameOriginal: string; quantity: number; totalPrice: number; earliestExpiry: string | null }
  >()

  snapshot.forEach((doc) => {
    const data: any = doc.data()
    // Support two shapes:
    // - New: { items: [{ name, quantity, price, expiryDate }] }
    // - Legacy: { data: { products: [{ product_name, quantity, price, expiry_date }] } }
    const itemsNew: any[] = Array.isArray(data?.items) ? data.items : []
    const itemsLegacy: any[] = Array.isArray(data?.data?.products) ? data.data.products : []
    const itemsAlt: any[] = Array.isArray(data?.data?.items) ? data.data.items : []
    const all = [...itemsNew, ...itemsLegacy, ...itemsAlt]

    for (const p of all) {
      const nameField = typeof p?.name === "string" ? p.name : p?.product_name
      if (!p || typeof nameField !== "string") continue

      const originalName: string = nameField
      const normalized = originalName.trim().toLowerCase()
      const qty: number = Number.isFinite(Number(p?.quantity))
        ? Number(p.quantity)
        : 1 // default quantity to 1 if missing/invalid
      const priceCandidate: any = p?.price ?? p?.unit_price ?? p?.total ?? null
      const price: number = Number.isFinite(Number(priceCandidate)) ? Number(priceCandidate) : 0
      const expiryRaw: any = (p?.expiryDate ?? p?.expiry_date ?? p?.expiry ?? p?.expirationDate ?? p?.expDate) ?? null

      let bucket = buckets.get(normalized)
      if (!bucket) {
        bucket = {
          nameOriginal: originalName, // keep original capitalization from first occurrence
          quantity: 0,
          totalPrice: 0,
          earliestExpiry: null,
        }
        buckets.set(normalized, bucket)
      }

      bucket.quantity += qty
      bucket.totalPrice += price

      const d = toDate(expiryRaw)
      if (d) {
        const newISO = d.toISOString().slice(0, 10) // store as YYYY-MM-DD
        if (!bucket.earliestExpiry) {
          bucket.earliestExpiry = newISO
        } else {
          const cur = toDate(bucket.earliestExpiry)
          if (!cur || +d < +cur) bucket.earliestExpiry = newISO
        }
      }
    }
  })

    const result: InventoryItem[] = Array.from(buckets.values())
      .map((b) => ({
        name: b.nameOriginal,
        quantity: b.quantity,
        totalPrice: b.totalPrice,
        earliestExpiry: b.earliestExpiry,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return result
  } catch (err) {
    // Surface helpful context at call sites
    const message = err instanceof Error ? err.message : String(err)
    console.error("getUserInventory failed:", message)
    throw err
  }
}

// Example Next.js client component usage: fetch and log inventory for current user
export default function MyProductsPage() {
  const { user } = useAuth()
  const { setItems: setGlobalInventory } = useInventory()
  const router = useRouter()
  const [items, setItems] = useState<InventoryItem[] | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [queryText, setQueryText] = useState("")
  const [modal, setModal] = useState<null | { type: 'edit' | 'remove', item: InventoryItem }>(null)
  const [tempExpiry, setTempExpiry] = useState<string>("")

  useEffect(() => {
    let isMounted = true

    if (!user?.uid) {
      setItems(null)
      setLoading(false)
      setError("You must be signed in to view products.")
      return
    }

    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const inv = await getUserInventory(db, user.uid)
        if (isMounted) {
          setItems(inv)
          setLoading(false)
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message ?? "Failed to load inventory")
          setLoading(false)
        }
      }
    })()

    return () => {
      isMounted = false
    }
  }, [user?.uid])

  const filtered = useMemo(() => {
    if (!items) return []
    const q = queryText.trim().toLowerCase()
    const out = q
      ? items.filter((i) => i.name.toLowerCase().includes(q))
      : items.slice()
    out.sort((a, b) => {
      const aTime = a.earliestExpiry ? Date.parse(a.earliestExpiry) : Infinity
      const bTime = b.earliestExpiry ? Date.parse(b.earliestExpiry) : Infinity
      return aTime - bTime
    })
    return out
  }, [items, queryText])

  // Keep global inventory context in sync with what's displayed
  useEffect(() => {
    try {
      setGlobalInventory(filtered)
    } catch {}
  }, [filtered, setGlobalInventory])

  const formatPrice = (value: number) =>
    new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(value)

  const formatDate = (value: string | null) =>
    value ? new Date(value).toLocaleDateString() : "-"

  const daysUntil = (value: string | null) => {
    if (!value) return null
    const now = new Date()
    const target = new Date(value)
    const diff = Math.ceil((+target - +now) / (1000 * 60 * 60 * 24))
    return diff
  }

  

  

  return (
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold">My Products</h1>
          <button
            type="button"
            onClick={() => {
              try {
                const payload = JSON.stringify(filtered)
                if (typeof window !== 'undefined') {
                  window.sessionStorage.setItem('cheffai.inventory', payload)
                }
              } catch {}
              router.push('/protected/uiopenai/stream')
            }}
            className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white self-start"
            style={{ backgroundColor: '#5E7A0F' }}
          >
            Ask AI for Recipes
          </button>
        </div>

        {/* Controls */}
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <input
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder="Search by name..."
            className="h-10 w-full md:w-80 rounded-md border border-gray-200 bg-white px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
          />

        </div>

        {/* Cards on small screens */}
        <div className="grid gap-3 sm:gap-4 md:hidden">
          {filtered.map((it) => {
            const d = daysUntil(it.earliestExpiry)
            const badge = d == null
              ? { text: "No expiry", cls: "bg-gray-100 text-gray-700" }
              : d < 0
                ? { text: "Expired", cls: "bg-red-100 text-red-700" }
                : d <= 3
                  ? { text: `${d} day${d === 1 ? "" : "s"}`, cls: "bg-yellow-100 text-yellow-800" }
                  : { text: `${d} days`, cls: "bg-green-100 text-green-700" }

            return (
              <div key={`${it.name}-${it.earliestExpiry ?? "none"}`} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{it.name}</h3>
                    <p className="text-sm text-gray-600">Qty: {it.quantity}</p>
                  </div>
                  <span className={`inline-flex h-6 items-center rounded-full px-2 text-xs font-medium ${badge.cls}`}>
                    {badge.text}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-medium">{formatPrice(it.totalPrice)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Expiry</span>
                  <span className="font-medium">{formatDate(it.earliestExpiry)}</span>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs">
                  <button className="rounded-md border border-neutral-300 px-2 py-1" onClick={() => { setTempExpiry(it.earliestExpiry ?? ""); setModal({ type: 'edit', item: it }) }}>
                    Edit date
                  </button>
                  {it.quantity > 1 && (
                    <button className="rounded-md border border-neutral-300 px-2 py-1" onClick={async () => { if (!user?.uid) return; await decrementOrRemoveByName({ uid: user.uid, productName: it.name, amount: 1 }); setLoading(true); const inv = await getUserInventory(db, user.uid); setItems(inv); setLoading(false) }}>
                      -1 qty
                    </button>
                  )}
                  <button className="rounded-md border border-red-300 text-red-700 px-2 py-1" onClick={() => setModal({ type: 'remove', item: it })}>
                    Remove
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enhanced table on md+ */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="sticky left-0 bg-gray-50 p-3 text-left font-medium">Name</th>
                <th className="p-3 text-right font-medium">Quantity</th>
                <th className="p-3 text-right font-medium">Total</th>
                <th className="p-3 text-left font-medium">Earliest Expiry</th>
                <th className="p-3 text-right font-medium">Days</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it, idx) => {
                const d = daysUntil(it.earliestExpiry)
                const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                const daysText = d == null ? "-" : String(d)
                const daysCls =
                  d == null ? "text-gray-500" : d < 0 ? "text-red-600" : d <= 3 ? "text-yellow-700" : "text-gray-800"
                return (
                  <tr key={`${it.name}-${it.earliestExpiry ?? "none"}`} className={rowBg}>
                    <td className="sticky left-0 bg-inherit p-3 font-medium text-gray-900">{it.name}</td>
                    <td className="p-3 text-right tabular-nums">{it.quantity}</td>
                    <td className="p-3 text-right tabular-nums">{formatPrice(it.totalPrice)}</td>
                    <td className="p-3">{formatDate(it.earliestExpiry)}</td>
                    <td className={`p-3 text-right tabular-nums ${daysCls}`}>{daysText}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                          onClick={() => { setTempExpiry(it.earliestExpiry ?? ""); setModal({ type: 'edit', item: it }) }}
                        >Edit date</button>
                        {it.quantity > 1 && (
                          <button
                            className="rounded-md border border-neutral-300 px-2 py-1 text-xs"
                            onClick={async () => {
                              if (!user?.uid) return
                              await decrementOrRemoveByName({ uid: user.uid, productName: it.name, amount: 1 })
                              setLoading(true)
                              const inv = await getUserInventory(db, user.uid)
                              setItems(inv); setLoading(false)
                            }}
                          >-1 qty</button>
                        )}
                        <button
                          className="rounded-md border border-red-300 text-red-700 px-2 py-1 text-xs"
                          onClick={() => setModal({ type: 'remove', item: it })}
                        >Remove</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Modals */}
        <Modal
          open={Boolean(modal && modal.type === 'edit')}
          title={`Edit expiry - ${modal?.item.name ?? ''}`}
          onClose={() => setModal(null)}
          footer={(
            <>
              <button className="px-4 py-2 rounded-md border" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: '#5E7A0F' }}
                onClick={async () => {
                  if (!user?.uid || !modal) return
                  const iso = tempExpiry.trim()
                  await updateExpiryByName({ uid: user.uid, productName: modal.item.name, isoDate: iso || null })
                  setModal(null)
                  setLoading(true)
                  const inv = await getUserInventory(db, user.uid)
                  setItems(inv); setLoading(false)
                }}
              >
                Save
              </button>
            </>
          )}
        >
          <label className="block text-sm mb-2">Expiry date (YYYY-MM-DD)</label>
          <input
            value={tempExpiry}
            onChange={(e) => setTempExpiry(e.target.value)}
            placeholder="YYYY-MM-DD (empty to clear)"
            className="w-full rounded-md border border-neutral-300 px-3 py-2 bg-white"
          />
        </Modal>

        <Modal
          open={Boolean(modal && modal.type === 'remove')}
          title={`Remove all - ${modal?.item.name ?? ''}`}
          onClose={() => setModal(null)}
          footer={(
            <>
              <button className="px-4 py-2 rounded-md border" onClick={() => setModal(null)}>Cancel</button>
              <button
                className="px-4 py-2 rounded-md text-white"
                style={{ backgroundColor: '#B3261E' }}
                onClick={async () => {
                  if (!user?.uid || !modal) return
                  await removeAllByName({ uid: user.uid, productName: modal.item.name })
                  setModal(null)
                  setLoading(true)
                  const inv = await getUserInventory(db, user.uid)
                  setItems(inv); setLoading(false)
                }}
              >
                Remove
              </button>
            </>
          )}
        >
          <p>Are you sure you want to remove all entries for this product from your receipts?</p>
        </Modal>
      </div>
  )
}

