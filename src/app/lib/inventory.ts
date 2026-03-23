import {
  type Firestore,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore"

export type InventoryItem = {
  name: string
  quantity: number
  totalPrice: number
  earliestExpiry: string | null
  grams?: number | null
}

export async function getUserInventory(
  database: Firestore,
  userId: string
): Promise<InventoryItem[]> {
  const toDate = (val: any): Date | null => {
    if (!val) return null
    if (typeof val === "object" && typeof val.toDate === "function") {
      const d = val.toDate(); return isNaN(+d) ? null : d
    }
    if (typeof val === "number") {
      const d = new Date(val); return isNaN(+d) ? null : d
    }
    if (typeof val !== "string") return null
    const s = val.trim(); if (!s) return null
    let m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/)
    if (m) { const [, yy, mm, dd] = m; const d = new Date(+yy, +mm - 1, +dd); return isNaN(+d) ? null : d }
    m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
    if (m) { const [, dd, mm, yy] = m; const d = new Date(+yy, +mm - 1, +dd); return isNaN(+d) ? null : d }
    const t = Date.parse(s); if (Number.isFinite(t)) { const d = new Date(t); return isNaN(+d) ? null : d }
    return null
  }

  const nestedRef = collection(database, "users", userId, "receipts")
  let snapshot = await getDocs(nestedRef)

  if (snapshot.empty) {
    const topRef = collection(database, "receipts")
    const q = query(topRef, where("userId", "==", userId))
    snapshot = await getDocs(q)
  }

  const buckets = new Map<string, { nameOriginal: string; quantity: number; totalPrice: number; earliestExpiry: string | null; grams: number | null }>()

  snapshot.forEach((doc) => {
    const data: any = doc.data()
    const itemsNew: any[] = Array.isArray(data?.items) ? data.items : []
    const itemsLegacy: any[] = Array.isArray(data?.data?.products) ? data.data.products : []
    const itemsAlt: any[] = Array.isArray(data?.data?.items) ? data.data.items : []
    const all = [...itemsNew, ...itemsLegacy, ...itemsAlt]

    for (const p of all) {
      const nameField = typeof p?.name === "string" ? p.name : p?.product_name
      if (!p || typeof nameField !== "string") continue

      const originalName: string = nameField
      const normalized = originalName.trim().toLowerCase()
      const qty: number = Number.isFinite(Number(p?.quantity)) ? Number(p.quantity) : 1
      const priceCandidate: any = p?.price ?? p?.unit_price ?? p?.total ?? null
      const price: number = Number.isFinite(Number(priceCandidate)) ? Number(priceCandidate) : 0
      const expiryRaw: any = (p?.expiryDate ?? p?.expiry_date ?? p?.expiry ?? p?.expirationDate ?? p?.expDate) ?? null

      let bucket = buckets.get(normalized)
      if (!bucket) {
        bucket = { nameOriginal: originalName, quantity: 0, totalPrice: 0, earliestExpiry: null, grams: null }
        buckets.set(normalized, bucket)
      }

      bucket.quantity += qty
      bucket.totalPrice += price

      // Prefer first non-null grams encountered
      const gramsVal = Number.isFinite(Number((p as any)?.grams)) ? Number((p as any).grams) : null
      if (bucket.grams == null && gramsVal != null) bucket.grams = gramsVal

      const d = toDate(expiryRaw)
      if (d) {
        const newISO = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
        if (!bucket.earliestExpiry) bucket.earliestExpiry = newISO
        else {
          const cur = toDate(bucket.earliestExpiry)
          if (!cur || +d < +cur) bucket.earliestExpiry = newISO
        }
      }
    }
  })

  return Array.from(buckets.values())
    .map((b) => ({ name: b.nameOriginal, quantity: b.quantity, totalPrice: b.totalPrice, earliestExpiry: b.earliestExpiry, grams: b.grams }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
