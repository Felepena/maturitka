import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";


export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const qpUid = url.searchParams.get("uid") || undefined;
    const body = await req.json().catch(() => ({} as any));
    const prompt: string = body?.prompt ?? "";
    const uid: string | undefined = body?.uid ?? qpUid;
    const inventoryFromClient: any[] | undefined = Array.isArray(body?.inventory)
      ? (body.inventory as any[])
      : undefined;
    const inventoryTableText: string | undefined = typeof body?.inventoryTableText === 'string' ? body.inventoryTableText : undefined;

    let inventoryContext: any = null;
    let inventorySummaryLocal: { name: string; quantity: number; earliestExpiry: string | null; daysUntilExpiry: number | null }[] | null = null;
    if (inventoryFromClient && inventoryFromClient.length > 0) {
      try {
        const now = Date.now();
        const dayMs = 1000 * 60 * 60 * 24;
        const toDate = (val: any): Date | null => {
          if (!val) return null;
          if (typeof val === "object" && typeof val.toDate === "function") {
            const d = val.toDate();
            return isNaN(+d) ? null : d;
          }
          if (typeof val === "number") {
            const d = new Date(val);
            return isNaN(+d) ? null : d;
          }
          if (typeof val !== "string") return null;
          const s = val.trim();
          if (!s) return null;
          let m = s.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
          if (m) {
            const [, yy, mm, dd] = m as any;
            const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
            return isNaN(+d) ? null : d;
          }
          m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
          if (m) {
            const [, dd, mm, yy] = m as any;
            const d = new Date(Number(yy), Number(mm) - 1, Number(dd));
            return isNaN(+d) ? null : d;
          }
          const t = Date.parse(s);
          if (Number.isFinite(t)) {
            const d = new Date(t);
            return isNaN(+d) ? null : d;
          }
          return null;
        };
        const inventorySummary = (inventoryFromClient as any[]).map((it) => {
          const d = toDate(it?.earliestExpiry ?? it?.expiry ?? null);
          const iso = d ? d.toISOString().slice(0, 10) : null;
          const t = iso ? Date.parse(iso) : NaN;
          const daysUntilExpiry = Number.isFinite(t) ? Math.ceil((t - now) / dayMs) : null;
          return {
            name: String(it?.name ?? "").trim(),
            quantity: Number.isFinite(Number(it?.quantity)) ? Number(it.quantity) : 1,
            earliestExpiry: iso,
            daysUntilExpiry,
          };
        }).filter((x) => x.name);
        inventorySummaryLocal = inventorySummary;
        const sortedSoonest = [...inventorySummary].sort((a, b) => {
          const aT = a.earliestExpiry ? Date.parse(a.earliestExpiry) : Infinity;
          const bT = b.earliestExpiry ? Date.parse(b.earliestExpiry) : Infinity;
          return aT - bT;
        });
        const allowedNames = inventorySummary.map((x) => x.name);
        inventoryContext = { user: { id: uid }, inventorySummary, sortedSoonest, allowedNames };
      } catch {}
    }

    // No special fridge intent handling: always include context and stream the model's response.

    const todayIso = new Date().toISOString().slice(0, 10);
    const instructionPlaceholders = [
  'Today\'s date is ' + todayIso + '. You have access below to the user\'s CURRENT Digital Fridge captured from the My Products page.',
  'Treat the section "EXACT FRIDGE TABLE" as the source-of-truth for what the user currently has in the Digital Fridge; do not edit that table. You may, however, suggest complementary pantry basics or extras as a Shopping List when helpful.',
  '',
  'ROLE: Friendly, creative chef who reduces food waste and writes detailed, practical instructions.',
  'GOAL: Propose a delicious recipe the user can cook now, prioritizing items that expire soon. Be helpful and flexible.',
  'STYLE: Natural, encouraging, and detailed. Include temperatures, times, textures, and substitution ideas. ABSOLUTELY NO MARKDOWN OR LIST SYMBOLS: do not use #, *, -, •, bullets, code fences, underscores, or any decorative symbols. Use simple plain sentences. If you need lists, use simple numbered lines like 1) 2) 3) without extra symbols.',
  '',
  'Guidance (not strict rules):',
  '  - Always consider the EXACT FRIDGE TABLE below and prefer using those items; treat it as the current source of truth.',
  '  - Prefer ingredients from the Digital Fridge, especially those expiring soon (see sortedSoonest). Avoid clearly expired items.',
  '  - Ignore drinks-only items (e.g., water, soda, cola, juice, energy drinks, beer, wine, cider, lemonade) unless the user explicitly asks for a beverage.',
  '  - When specifying amounts, use grams only if the product in the Digital Fridge already has a weight in grams; otherwise use unit quantities. Do not invent grams.',
  '  - Special case: for milk, express amounts in liters (L) in the plain-text recipe. In the JSON, put the same numeric value into the grams field (treat liters == grams numerically for storage).',
  '  - Special case: for eggs, always express amounts as pieces or count in both the recipe text and JSON quantity field. Never put eggs into the grams field.',
  '  - If you include anything not in inventory, mark it under "Shopping List" and keep it minimal.',
  '  - If quantities are unknown, assume sensible amounts and note assumptions.',
  '  - If the user asks something unrelated to recipes, answer normally, but still consider inventory when relevant.',
  '',
  'Suggested sections (use your judgment):',
  '  - Title',
  '  - Servings and Time',
  '  - Ingredients',
  '  - Steps',
  '  - Tips / Substitutions / Storage',
  '  - Shopping List (only if truly necessary)',
  '  - Uses From Inventory (short list)',
  '',
  'After the plain-text recipe, append a single machine-readable JSON object on the last line with this exact prefix and shape:',
  '  JSON_ONLY={ "recipe": { "name": string, "ingredients": [ { "name": string, "quantity": number|null, "grams": number|null } ] } }',
  '  - Do NOT normalize or rename ingredient names. Use the exact strings from ALLOWED INGREDIENTS (from receipts/Digital Fridge), including casing, accents, and spacing. If a needed item is not present there, omit it from the JSON and put it in Shopping List instead.',
  '  - Use grams only if that ingredient has a known grams value in the Digital Fridge; otherwise set grams to null and use quantity instead (or 0/null if unknown).',
  '  - Eggs are an exception: always set grams to null and use quantity for the piece count, even if another ingredient in the recipe uses grams.',
  '  - Only include ingredients that map to items in ALLOWED INGREDIENTS (Digital Fridge) when possible; unfamiliar extras should be in Shopping List and omitted from the JSON.',
  'If the Digital Fridge is empty or not provided, explicitly start by saying it is empty, then still provide helpful general tips, simple recipes, and an optional short Shopping List.',
        "also do not use bold, hashtags (#), asterisks (*), dashes (-), bullets (•), or any markdown-like symbols; output plain text only.",

].join('\n');

    const contextBlock = inventoryContext
      ? `\nHere is the user inventory context (JSON):\n${JSON.stringify(inventoryContext, null, 2)}\n\n`
      : "";
    const exactTableBlock = inventoryTableText && inventoryTableText.trim().length > 0
      ? `\nEXACT FRIDGE TABLE (authoritative, do not deviate):\n${inventoryTableText}\n\n`
      : "";
    const allowedNamesBlock = inventoryContext && Array.isArray(inventoryContext.allowedNames)
      ? `ALLOWED INGREDIENTS (names only):\n${(inventoryContext.allowedNames as string[]).join("\n")}\n\n`
      : "";
    const soonestBlock = inventoryContext && Array.isArray(inventoryContext.sortedSoonest)
      ? `SOONEST FIRST (name | days):\n${(inventoryContext.sortedSoonest as any[]).slice(0, 8).map((x:any)=>`${x.name} | ${x.daysUntilExpiry ?? 'no-date'}`).join("\n")}\n\n`
      : "";

    const policyBlock = `\nDigital Fridge Policy:\n- Use ingredients from the EXACT FRIDGE TABLE above as primary.\n- Prefer grams for amounts when available; otherwise use unit counts.\n- If you include anything not in the table, put it in Shopping List.\n- Do not use bold, hashtags (#), or any markdown; plain text only.\n\n`;
    const systemContent = `${exactTableBlock}${allowedNamesBlock}${soonestBlock}${instructionPlaceholders}${policyBlock}${contextBlock}`;

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: systemContent },
        { role: "user", content: prompt }
      ],
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("error generating text", error);
    return new Response("Failed to stream text", { status: 500 });
  }
}

