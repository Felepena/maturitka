"use client"

import { useCompletion } from "@ai-sdk/react";
import { useAuth } from "@/app/contex/contex";
import { useEffect, useState } from "react";
import { useInventory } from "@/app/contex/inventory";

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function StreamPage() {
  const { user } = useAuth();
  const { items: inventory, setItems: setInventory } = useInventory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const { input, handleInputChange, handleSubmit, completion, isLoading, error, setInput, complete } = useCompletion({
    api: `/api/completion/stream${user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : ""}`,
    onFinish: (_prompt, answer) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    },
  });
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  // Preload inventory from sessionStorage if available (e.g., navigated directly)
  useEffect(() => {
    if (inventory && inventory.length > 0) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('cheffai.inventory');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setInventory(parsed);
      }
    } catch {}
  }, [inventory, setInventory]);

  // IMPORTANT: Do not fetch from DB here. Use only what My Products stored.


  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#F5F0D7' }}>
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          {(!inventory || inventory.length === 0) && (
            <div className="rounded-md border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
              No fridge loaded. Open My Products and click "Ask AI for Recipes" to send the exact items currently displayed.
            </div>
          )}
          {/* Inventory is sent with each prompt; no UI render needed. */}
          {error && <div className="text-red-600 text-sm">{error.message}</div>}
          {isLoading && !completion && (
            <div className="flex items-center gap-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600"></div>
              <span className="text-sm">Thinking…</span>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-600 mb-1">{m.role === 'user' ? 'You' : 'CheffAI'}</div>
              <div className="whitespace-pre-wrap text-[15px] leading-6">{m.content}</div>
            </div>
          ))}
          {/* Assistant output is appended to messages on finish; avoid duplicate rendering of `completion`. */}
        </div>
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prompt = input.trim();
          if (!prompt) return;
          const hasInventory = Array.isArray(inventory) && inventory.length > 0;
          // Always send what's currently displayed in My Products via context
          setLastPrompt(prompt);
          if (!hasInventory) {
            setMessages((prev) => [
              ...prev,
              { role: 'user', content: prompt },
              { role: 'assistant', content: 'No fridge loaded. Go to My Products and click "Ask AI for Recipes" to attach the exact items you are viewing.' },
            ]);
            setInput("");
            return;
          }
          // Build a deterministic text table matching the My Products view
          const dayMs = 1000 * 60 * 60 * 24;
          const fmtPrice = (v: number | undefined) =>
            typeof v === 'number' && Number.isFinite(v)
              ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(v)
              : '-';
          const toDays = (iso: string | null) => {
            if (!iso) return 'no-date';
            const t = Date.parse(iso);
            if (!Number.isFinite(t)) return 'no-date';
            const d = Math.ceil((t - Date.now()) / dayMs);
            return String(d);
          };
          // Sort like My Products: earliest expiry first; undated last
          const sorted = (Array.isArray(inventory) ? [...inventory] : []).sort((a: any, b: any) => {
            const aT = a?.earliestExpiry ? Date.parse(a.earliestExpiry) : Infinity;
            const bT = b?.earliestExpiry ? Date.parse(b.earliestExpiry) : Infinity;
            return aT - bT;
          });
          const header = `Name | Quantity | Total | Earliest Expiry | Days`;
          const rows = sorted.map((it: any) => {
            const name = String(it?.name ?? '').trim();
            const qty = Number.isFinite(Number(it?.quantity)) ? Number(it.quantity) : 1;
            const total = fmtPrice(it?.totalPrice);
            const expiryIso = it?.earliestExpiry ?? null;
            const expiryText = expiryIso ? new Date(expiryIso).toLocaleDateString() : '-';
            const daysText = toDays(expiryIso);
            return `${name} | ${qty} | ${total} | ${expiryText} | ${daysText}`;
          });
          const tableText = [header, ...rows].join('\n');
          // Do not echo fridge contents in the chat; include them only in the request payload
          setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
          // Use `complete` to programmatically submit with a custom body
          complete(prompt, { body: { prompt, uid: user?.uid, inventory: inventory ?? [], inventoryTableText: tableText } } as any);
          setInput("");
        }}
        className="sticky bottom-0 w-full border-t backdrop-blur"
        style={{ backgroundColor: '#EEF3E0', borderTopColor: '#D6E3B8', borderTopWidth: 1 }}
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 shadow" style={{ borderColor: '#D6E3B8' }}>
            <input
              placeholder="What do you want to cook"
              className="no-focus w-full bg-transparent outline-none placeholder:text-neutral-500 text-[15px] py-2"
              value={input}
              onChange={handleInputChange}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#5E7A0F' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M2.3 2.3a1 1 0 0 1 1.02-.24l18 6a1 1 0 0 1 0 1.88l-7.33 2.44a1 1 0 0 0-.62.62L11.03 20a1 1 0 0 1-1.88 0l-6-18a1 1 0 0 1 .15-.92ZM6.2 6.2l3.46 10.38 1.4-4.2a3 3 0 0 1 1.86-1.86l4.2-1.4L6.2 6.2Z" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </form>

    </div>
  );
}
