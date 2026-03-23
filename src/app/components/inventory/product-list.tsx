"use client"
import type { InventoryItem } from "@/app/lib/inventory"
import { Item, ItemTitle, ItemDescription, ItemActions } from "@/app/components/ui/item"
import { useAuth } from "@/app/contex/contex"
import { removeAllByName, setQuantityByName, setGramsByName, renameByName } from "@/app/lib/receipt-mutations-aggregate"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { Calendar } from "@/app/components/ui/calendar"
import { updateExpiryByName } from "@/app/lib/receipt-mutations-aggregate"
import { MoreHorizontal, Trash2 } from "lucide-react"
import React from "react";
import Modal from "@/app/components/ui/modal";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { z } from "zod";
import { addManualItem } from "@/app/lib/manual-item";

export default function ProductList({ items }: { items: InventoryItem[] }) {
  const { user } = useAuth()
  const [armed, setArmed] = React.useState<string | null>(null)
  const [editingQty, setEditingQty] = React.useState<Record<string, string>>({})
  const [editingGrams, setEditingGrams] = React.useState<Record<string, string>>({})
  const [openAdd, setOpenAdd] = React.useState(false)
  const [form, setForm] = React.useState({ name: "", quantity: "1", grams: "", price: "", expiry: "" })
  const [formError, setFormError] = React.useState<string | null>(null)

  const schema = z.object({
    name: z.string().trim().min(1, "Name required"),
    quantity: z.coerce.number().int().min(1, "Min 1"),
    grams: z.union([z.coerce.number().int().min(0), z.literal(NaN)]).optional(),
    price: z.union([z.coerce.number().min(0), z.literal(NaN)]).optional(),
    expiry: z.string().optional(),
  })

  const formatDMY = (iso?: string | null) => {
    if (!iso) return "-"
    const d = new Date(iso)
    if (Number.isNaN(+d)) return "-"
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = d.getFullYear()
    return `${dd}/${mm}/${yy}`
  }
  if (!items.length) return <p>No items found.</p>
  return (
    <div className="mt-6 rounded-2xl border-[2px] border-neutral-200 bg-white p-4 sm:p-6 shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const t = it.earliestExpiry ? Date.parse(it.earliestExpiry) : NaN
          const daysUntil = Number.isFinite(t) ? Math.ceil((t - Date.now()) / (1000 * 60 * 60 * 24)) : null
          const badgeClass = (() => {
            if (daysUntil == null) return "bg-neutral-200 text-neutral-700 border-neutral-300";
            if (daysUntil <= 0) return "bg-red-600 text-white border-red-600"; // expired or today: bright red
            if (daysUntil === 1) return "bg-red-200 text-red-800 border-red-300"; // 1 day: red
            if (daysUntil <= 3) return "bg-amber-200 text-amber-900 border-amber-300"; // 2-3: light orange
            if (daysUntil >= 7) return "bg-emerald-200 text-emerald-900 border-emerald-300"; // a week or more: light green
            return "bg-amber-100 text-amber-900 border-amber-200"; // 4-6: softly warm
          })()
          const badgeText = daysUntil == null ? "--" : `${daysUntil}d`
          const isMilk = /milk|mléko|mleko/i.test(String(it.name || ''))
          return (
            <div key={`${it.name}-${it.earliestExpiry ?? 'none'}`}>
              <Item className="relative min-h-[200px] h-full justify-start border border-neutral-200 bg-neutral-50/80">
                <div className="flex-1 w-full flex flex-col min-w-0 h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="max-w-[calc(100%-3.5rem)]">
                      <input
                        aria-label="Edit name"
                        className="w-full bg-transparent border border-transparent focus:border-neutral-200 rounded px-1 py-0.5 focus:outline-none focus:ring-0 cursor-default focus:cursor-text text-base font-semibold text-neutral-900"
                        value={editingQty[`${it.name}__name`] ?? it.name}
                        onChange={(e)=> setEditingQty((s)=> ({ ...s, [`${it.name}__name`]: e.target.value }))}
                        onBlur={async (e)=> {
                          const next = e.target.value.trim()
                          if (!next || next === it.name) return
                          if (!user?.uid) return alert("Sign in to rename.")
                          try { await renameByName({ uid: user.uid, fromName: it.name, toName: next }); location.reload() } catch (err:any){ alert(err?.message ?? 'Rename failed') }
                        }}
                      />
                    </div>
                  </div>
                  <ItemDescription className="hidden">
                    Qty: {it.quantity} \a Total: {new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CZK' }).format(it.totalPrice)}
                  </ItemDescription>
                  <div className="mt-1 text-sm text-neutral-600 hidden">
                    <span className="mr-1">Expiry:</span>
                    <Popover>
                      <PopoverTrigger>
                        <button className="underline decoration-dotted underline-offset-2 text-neutral-800 hover:text-neutral-900">
                          {formatDMY(it.earliestExpiry)}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2" align="start">
                        <Calendar
                          selected={it.earliestExpiry ? new Date(it.earliestExpiry) : undefined}
                          onSelect={async (d?: Date) => {
                            if (!user?.uid) return alert("Sign in to update date.")
                            try {
                              const iso = d
                                ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                                : null
                              await updateExpiryByName({ uid: user.uid, productName: it.name, isoDate: iso })
                              location.reload()
                            } catch (e: any) {
                              alert(e?.message ?? "Failed to save date")
                            }
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="mt-4 -mx-1 rounded-xl border border-neutral-200">
                    <div className="border-t border-neutral-200 px-3 py-2 flex items-center text-sm">
                      <label className="text-neutral-700" htmlFor={`qty-${it.name}`}>Quantity</label>
                      <div className="ml-auto flex items-center gap-1 min-w-[4.5rem] justify-end">
                        <input
                        id={`qty-${it.name}`}
                        type="number"
                        min={0}
                        className="w-20 text-right bg-transparent border border-transparent focus:border-neutral-200 rounded px-0.5 py-0.5 focus:outline-none focus:ring-0 cursor-default focus:cursor-text"
                        value={editingQty[it.name] ?? String(it.quantity)}
                        onChange={(e) => setEditingQty((s) => ({ ...s, [it.name]: e.target.value }))}
                        onBlur={async (e) => {
                          const val = Number(e.target.value)
                          if (!Number.isFinite(val)) return
                          if (!user?.uid) return alert("Sign in to update quantity.")
                          try {
                            await setQuantityByName({ uid: user.uid, productName: it.name, quantity: Math.max(0, Math.floor(val)) })
                            location.reload()
                          } catch (err: any) { alert(err?.message ?? "Failed to update quantity") }
                        }}
                        />
                      </div>
                    </div>
                    <div className="border-t border-neutral-200 px-3 py-2 flex items-center text-sm">
                      <label className="text-neutral-700" htmlFor={`grams-${it.name}`}>{isMilk ? 'Liters' : 'Grams'}</label>
                      <div className="ml-auto flex items-center gap-1 min-w-[5.5rem] justify-end">
                        <input
                          id={`grams-${it.name}`}
                          type="number"
                          min={0}
                          className="w-20 text-right bg-transparent border border-transparent focus:border-neutral-200 rounded px-0.5 py-0.5 focus:outline-none focus:ring-0 cursor-default focus:cursor-text"
                          value={editingGrams[it.name] ?? (it.grams != null ? String(it.grams) : "")}
                          placeholder="-"
                          onChange={(e) => setEditingGrams((s) => ({ ...s, [it.name]: e.target.value }))}
                          onBlur={async (e) => {
                            const raw = e.target.value.trim()
                            const val = raw === "" ? null : Number(raw)
                            if (val !== null && !Number.isFinite(val)) return
                            if (!user?.uid) return alert("Sign in to update grams.")
                            try {
                              await setGramsByName({ uid: user.uid, productName: it.name, grams: val === null ? null : Math.max(0, Math.floor(val)) })
                              location.reload()
                            } catch (err: any) { alert(err?.message ?? "Failed to update grams") }
                          }}
                        />
                        <span className="text-neutral-500 select-none">{isMilk ? 'L' : 'g'}</span>
                      </div>
                    </div>
                    <div className="border-t border-neutral-200 px-3 py-2 flex items-center justify-between text-sm">
                      <span className="text-neutral-700">Total</span>
                      <span className="text-neutral-900">{new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CZK' }).format(it.totalPrice)}</span>
                    </div>
                    <div className="border-t border-neutral-200 px-3 py-2 flex items-center justify-between text-sm">
                      <span className="text-neutral-700">Expiry</span>
                      <div className="flex items-center gap-2">
                        <Popover>
                          <PopoverTrigger>
                            <button className="underline decoration-dotted underline-offset-2 text-neutral-800 hover:text-neutral-900 whitespace-nowrap">
                              {formatDMY(it.earliestExpiry)}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-2" align="start">
                            <Calendar
                              selected={it.earliestExpiry ? new Date(it.earliestExpiry) : undefined}
                              onSelect={async (d?: Date) => {
                                if (!user?.uid) return alert("Sign in to update date.")
                                try {
                                  const iso = d
                                    ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
                                    : null
                                  await updateExpiryByName({ uid: user.uid, productName: it.name, isoDate: iso })
                                  location.reload()
                                } catch (e: any) {
                                  alert(e?.message ?? "Failed to save date")
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${badgeClass}`}>{badgeText}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <ItemActions className="absolute top-3 right-3">
                  {(() => {
                    const key = `${it.name}`
                    const isArmed = armed === key
                    return (
                      <button
                        aria-label={isArmed ? "Confirm delete" : "More"}
                        onClick={async () => {
                          if (!isArmed) {
                            setArmed(key)
                            return
                          }
                          if (!user?.uid) return alert("Sign in to delete items.")
                          try {
                            await removeAllByName({ uid: user.uid, productName: it.name })
                            setArmed(null)
                            location.reload()
                          } catch (e: any) {
                            alert(e?.message ?? "Failed to delete")
                          }
                        }}
                        onMouseLeave={() => setArmed((cur) => (cur === key ? null : cur))}
                        className={
                          isArmed
                            ? "inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-600 bg-red-600 text-white hover:bg-red-700"
                            : "inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                        }
                      >
                        {isArmed ? (
                          <Trash2 className="h-4 w-4" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </button>
                    )
                  })()}
                </ItemActions>
              </Item>
            </div>
          )
        })}
      </div>
      <div className="flex justify-end mt-4">
        <Button className="rounded-full bg-neutral-900 hover:bg-black" onClick={() => { setForm({ name: "", quantity: "1", grams: "", price: "", expiry: "" }); setFormError(null); setOpenAdd(true); }}>Add Product</Button>
      </div>

      <Modal open={openAdd} title="Add Product" onClose={() => setOpenAdd(false)} footer={(
        <>
          <Button className="rounded-xl" onClick={() => setOpenAdd(false)} type="button">Cancel</Button>
          <Button className="rounded-xl bg-[#5E7A0F] hover:bg-[#4f670d]" type="button" onClick={async () => {
            try {
              const parsed = schema.parse({
                name: form.name,
                quantity: form.quantity,
                grams: form.grams === "" ? NaN : form.grams,
                price: form.price === "" ? NaN : form.price,
                expiry: form.expiry,
              })
              if (!user?.uid) return alert('Sign in to add product.')
              await addManualItem({ uid: user.uid, item: {
                name: parsed.name,
                quantity: parsed.quantity,
                grams: Number.isNaN(parsed.grams) ? null : Number(parsed.grams),
                price: Number.isNaN(parsed.price) ? null : Number(parsed.price),
                expiryDate: parsed.expiry ? parsed.expiry : null,
              }})
              setOpenAdd(false)
              location.reload()
            } catch(e:any) {
              setFormError(e?.message ?? 'Invalid input')
            }
          }}>Save</Button>
        </>
      )}>
        <div className="space-y-3">
          {formError && <div className="text-sm text-red-600">{formError}</div>}
          <div>
            <label className="text-sm text-neutral-700">Name</label>
            <Input value={form.name} onChange={(e)=> setForm((s)=> ({...s, name: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-700">Quantity</label>
              <Input type="number" min={1} value={form.quantity} onChange={(e)=> setForm((s)=> ({...s, quantity: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm text-neutral-700">Grams (optional)</label>
              <Input type="number" min={0} value={form.grams} onChange={(e)=> setForm((s)=> ({...s, grams: e.target.value}))} placeholder="" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-neutral-700">Total Price CZK (optional)</label>
              <Input type="number" min={0} value={form.price} onChange={(e)=> setForm((s)=> ({...s, price: e.target.value}))} />
            </div>
            <div>
              <label className="text-sm text-neutral-700">Expiry (YYYY-MM-DD)</label>
              <Input type="date" value={form.expiry} onChange={(e)=> setForm((s)=> ({...s, expiry: e.target.value}))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
