"use client"

import { useCompletion } from "@ai-sdk/react";
import { useAuth } from "@/app/contex/contex";
import { useEffect, useState } from "react";
import { useInventory } from "@/app/contex/inventory";
import { decrementOrRemoveByName, setGramsByName, decrementGramsByName } from "@/app/lib/receipt-mutations-aggregate";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/config";
import { useRouter } from "next/navigation";

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export default function StreamPage() {
  const { user } = useAuth();
  const { items: inventory, setItems: setInventory } = useInventory();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const namesWithKnownGrams = new Set(
    (Array.isArray(inventory) ? inventory : [])
      .filter((it: any) => typeof it?.grams === 'number' && Number.isFinite(it.grams))
      .map((it: any) => String(it?.name || '').trim().toLowerCase())
  );

  const router = useRouter();
  const { input, handleInputChange, completion, isLoading, error, setInput, complete } = useCompletion({
    api: `/api/completion/stream${user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : ""}`,
    onFinish: (_prompt, answer) => {
      setMessages((prev) => [...prev, { role: 'assistant', content: answer }]);
    },
  });

  // Preload inventory from sessionStorage if available (e.g., navigated directly)
  useEffect(() => {
    if (inventory && inventory.length > 0) return;
    if (typeof window === 'undefined') return;
    try {
      const raw = window.sessionStorage.getItem('cheffai.inventory');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) setInventory(parsed);
      }
    } catch {}
  }, [inventory, setInventory]);

  // Try extracting a trailing JSON recipe object from the latest assistant message
  const parseRecipe = (s: string | null | undefined): { name?: string; ingredients?: { name: string; quantity?: number|null; grams?: number|null }[] } | null => {
    if (!s) return null;
    // Prefer explicit JSON_ONLY= prefix
    const tagged = s.match(/JSON_ONLY\s*=\s*(\{[\s\S]*\})\s*$/);
    const jsonText = tagged ? tagged[1] : (s.match(/\{\s*"recipe"[\s\S]*\}\s*$/)?.[0] ?? null);
    if (!jsonText) return null;
    try {
      const obj = JSON.parse(jsonText);
      if (obj && obj.recipe && Array.isArray(obj.recipe.ingredients)) return obj.recipe;
    } catch {}
    return null;
  };
  const latestText = (completion && completion.length ? completion : (messages.length ? messages[messages.length-1].content : "")) || "";
  const sanitizePlain = (t: string) => t
    .replace(/JSON_ONLY\s*=\s*\{[\s\S]*\}\s*$/, "")
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*[#*\u0007\-]+\s*/g, "").replace(/^\s*\d+\.\s+/, (m) => m.replace(".", ") "))) // 1. -> 1)
    .join("\n");
  const recipe = parseRecipe(latestText);
  const detailsPlain = sanitizePlain(
    latestText.replace(/JSON_ONLY\s*=\s*\{[\s\S]*\}\s*$/, '').trim()
  );

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4 mt-6">
          {null}
          {error && <div className="text-red-600 text-sm">{error.message}</div>}

          {messages.map((m, i) => (
            <div key={i} className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-600 mb-1">{m.role === 'user' ? 'You' : 'CheffAI'}</div>
              <div className="whitespace-pre-wrap text-[15px] leading-6">{sanitizePlain(m.content)}</div>
            </div>
          ))}

          {isLoading && (
            <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-600 mb-1">CheffAI</div>
              <div className="whitespace-pre-wrap text-[15px] leading-6">{completion && completion.length > 0 ? sanitizePlain(completion) : (isLoading ? "Thinking..." : "")}</div>
            </div>
          )}

          {!!recipe && !isLoading && (
            <div className="flex justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700"
                onClick={async () => {
                  if (!user?.uid) return alert('Sign in to apply recipe.');
                  try {
                    const ings = recipe.ingredients || [];
                    const drinkWords = ['water','soda','cola','juice','energy drink','beer','wine','cider','lemonade','kvass','iced tea','drink'];
                    for (const ing of ings) {
                      const name = String(ing?.name || '').trim();
                      if (!name) continue;
                      const lower = name.toLowerCase();
                      if (drinkWords.some((w)=> lower.includes(w))) continue; // ignore drinks-only items
                      const grams = ing?.grams;
                      const qty = ing?.quantity;
                      if (grams && grams > 0 && namesWithKnownGrams.has(lower)) {
                        await decrementGramsByName({ uid: user.uid, productName: name, grams });
                      } else if (qty && qty > 0) {
                        await decrementOrRemoveByName({ uid: user.uid, productName: name, amount: qty });
                      }
                    }
                    // Save used recipe entry (best-effort), then redirect to Used Recipes regardless
                    let newId: string | null = null;
                    try {
                      const col = collection(db, 'users', user.uid, 'usedRecipes');
                      const docRef = await addDoc(col, { name: recipe.name || 'Recipe', ingredients: ings, details: detailsPlain, createdAt: serverTimestamp() });
                      newId = docRef.id;
                    } catch {}
                    const url = newId ? `/protected/used-recipes?id=${newId}` : '/protected/used-recipes';
                    router.push(url);
                  } catch (e: any) {
                    alert(e?.message ?? 'Failed to apply recipe');
                  }
                }}
              >
                Use Recipe
              </button>
            </div>
          )}
        </div>
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prompt = input.trim();
          if (!prompt) return;
          const hasInventory = Array.isArray(inventory) && inventory.length > 0;
          if (!hasInventory) {
            setMessages((prev) => [
              ...prev,
              { role: 'user', content: prompt },
              { role: 'assistant', content: 'Your Digital Fridge is empty right now, but I can still suggest tips, meal ideas, and a short shopping list if you want. Ask me anything.' },
            ]);
          }
          // Build a deterministic text table matching the My Products view
          const dayMs = 1000 * 60 * 60 * 24;
          const fmtPrice = (v: number | undefined) =>
            typeof v === 'number' && Number.isFinite(v)
              ? new Intl.NumberFormat(undefined, { style: 'currency', currency: 'CZK' }).format(v)
              : '-';
          const toDays = (iso: string | null) => {
            if (!iso) return 'no-date';
            const t = Date.parse(iso);
            if (!Number.isFinite(t)) return 'no-date';
            const d = Math.ceil((t - Date.now()) / dayMs);
            return String(d);
          };
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
            const expiryText = (() => {
              if (!expiryIso) return '-'
              const d = new Date(expiryIso)
              if (Number.isNaN(+d)) return '-'
              const dd = String(d.getDate()).padStart(2, '0')
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const yy = d.getFullYear()
              return `${dd}/${mm}/${yy}`
            })();
            const daysText = toDays(expiryIso);
            return `${name} | ${qty} | ${total} | ${expiryText} | ${daysText}`;
          });
          const tableText = [header, ...rows].join('\n');
          setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
          complete(prompt, { body: { prompt, uid: user?.uid, inventory: inventory ?? [], inventoryTableText: tableText } } as any);
          setInput("");
        }}
        className="sticky bottom-0 w-full border-t backdrop-blur bg-white"
        style={{ borderTopColor: '#e5e7eb', borderTopWidth: 1 }}
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-2 rounded-full border bg-white px-3 py-2 shadow" style={{ borderColor: '#e5e7eb' }}>
            <input
              placeholder="What do you want to cook"
              className="no-focus w-full bg-transparent outline-none placeholder:text-neutral-500 text-[15px] py-2"
              value={input}
              onChange={handleInputChange}
            />
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed bg-neutral-900 hover:bg-black"
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
