"use client"
import type { InventoryItem } from "@/app/lib/inventory"

export default function ProductListItem({ item }: { item: InventoryItem }) {
  const formatDMY = (iso?: string | null) => {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(+d)) return "-"
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = d.getFullYear()
    return `${dd}/${mm}/${yy}`
  }
  return (
    <div className="rounded border p-2">
      <div className="font-medium">{item.name}</div>
      <div className="text-sm text-neutral-700">Quantity: {item.quantity}</div>
      {item.grams != null && (
        <div className="text-sm text-neutral-700">Grams: {item.grams}</div>
      )}
      <div className="text-sm text-neutral-700">Total Price: {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CZK' }).format(item.totalPrice)}</div>
      <div className="text-sm text-neutral-700">Earliest Expiry: {formatDMY(item.earliestExpiry)}</div>
    </div>
  )
}
