import { UIMessage, streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/app/lib/config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const qpUid = url.searchParams.get("uid") || undefined;
    const { messages, uid: bodyUid }: { messages: UIMessage[]; uid?: string } = await req.json();
    const uid = bodyUid ?? qpUid;

    // Optional Firestore context for inventory-aware answers
    let firestoreContext: any = null;
    if (uid) {
      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const receiptsSnap = await getDocs(collection(db, "users", uid, "receipts"));
        const receipts = receiptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Build inventory summary with earliestExpiry + daysUntilExpiry
        type Bucket = { name: string; quantity: number; earliestExpiry: string | null };
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

        const buckets = new Map<string, Bucket>();
        for (const r of receipts as any[]) {
          const itemsNew: any[] = Array.isArray(r?.items) ? r.items : [];
          const itemsLegacy: any[] = Array.isArray(r?.data?.products) ? r.data.products : [];
          const itemsAlt: any[] = Array.isArray(r?.data?.items) ? r.data.items : [];
          const all = [...itemsNew, ...itemsLegacy, ...itemsAlt];
          for (const p of all) {
            const nameField = typeof p?.name === "string" ? p.name : p?.product_name;
            if (!p || typeof nameField !== "string") continue;
            const norm = nameField.trim().toLowerCase();
            const qty = Number.isFinite(Number(p?.quantity)) ? Number(p.quantity) : 1;
            const expiryRaw: any = (p?.expiryDate ?? p?.expiry_date ?? p?.expiry ?? p?.expirationDate ?? p?.expDate) ?? null;
            const d = toDate(expiryRaw);
            const iso = d ? d.toISOString().slice(0, 10) : null;
            const existing = buckets.get(norm);
            if (!existing) {
              buckets.set(norm, { name: nameField, quantity: qty, earliestExpiry: iso });
            } else {
              existing.quantity += qty;
              if (iso) {
                if (!existing.earliestExpiry) {
                  existing.earliestExpiry = iso;
                } else {
                  const cur = toDate(existing.earliestExpiry);
                  if (!cur || (d && +d < +cur)) existing.earliestExpiry = iso;
                }
              }
            }
          }
        }

        const now = Date.now();
        const dayMs = 1000 * 60 * 60 * 24;
        const inventorySummary = Array.from(buckets.values()).map((b) => {
          const t = b.earliestExpiry ? Date.parse(b.earliestExpiry) : NaN;
          const daysUntilExpiry = Number.isFinite(t) ? Math.ceil((t - now) / dayMs) : null;
          return { ...b, daysUntilExpiry };
        }).sort((a, b) => {
          const aVal = a.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
          const bVal = b.daysUntilExpiry ?? Number.POSITIVE_INFINITY;
          return aVal - bVal;
        });

        firestoreContext = {
          user: userSnap.exists() ? { id: userSnap.id, ...userSnap.data() } : null,
          receipts,
          inventorySummary,
        };
      } catch (e) {
        console.warn("Failed to build Firestore context for multimodel-chat:", e);
      }
    }

    const todayIso = new Date().toISOString().slice(0, 10);

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system", content: `Today's date is ${todayIso}. If you are unsure about the current date or need to compute relative dates (e.g., \"in 3 days\", shelf life, or \"what day is it\"), use ${todayIso} as the source of truth for \"today\ and then guess the expiary date from today".` },
        { role: "system",content: "You parse a receipt provided as plain text. " +
              "FAIL-FAST (HIGHEST PRIORITY): " +
              "If the input text is empty, unreadable, too blurry, corrupted, not a receipt, or you cannot confidently COPY product names exactly as written, " +
              "then return items = [] and total = 0. DO NOT guess. DO NOT invent. " +
              " " +
              "STRICT NO-INVENTION RULE (HIGHEST PRIORITY): " +
              "You may ONLY include an item if you can COPY the item name VERBATIM from the receipt text. " +
              "If you cannot copy the name exactly (character-by-character), DO NOT include the item. " +
              "If you cannot confidently extract at least one item name verbatim, return items = [] and total = 0. " +
              " " +
              "FOOD-ONLY SCOPE (HIGHEST PRIORITY): " +
              "Extract ONLY food and drink intended for human consumption. " +
              "Always EXCLUDE: bags, deposits, fees, services, coupons, discounts, tax lines, tips, gift cards, phone top-ups, household items, detergents, cosmetics, pharmacy/OTC, pet items, tobacco, alcohol (exclude unless explicitly desired). " +
              "If an item is ambiguous, EXCLUDE it. " +
              " " +
              "Your tasks: " +
              "Extract each FOOD/DRINK product line. " +
              "Identify the product name (copied verbatim). " +
              "Estimate the quantity if it is not explicitly written (default = 1). " +
              "Extract the price if present; if not found or not readable, set price = null. " +
              " " +
              "DATE LOGIC: Find the receipt purchase date if present. Define base_date as: " +
              "- if receipt date is found use that" +
              ""+
              "EXPIRY LOGIC (FOOD/DRINK ONLY): " +
              "1) If an explicit expiry/BBE/use-by date is written on the receipt for that product, use it. " +
              "2) Otherwise, estimate expiry from base_date using the shelf-life rules below. " +
              " " +
              "MANDATORY INTERNAL PROCESS (DO NOT OUTPUT): " +
              "Before estimating expiry, classify the item into exactly one category below. " +
              "If you cannot confidently classify it, use a SHORT shelf life (1-3 days) rather than a long one. " +
              "Compute expiry_date = base_date + shelf_life_days. " +
              " " +
              "SHELF-LIFE RULES (conservative defaults): " +
              "- Fresh fish/seafood: 1-2 days (default 1) " +
              "- Fresh poultry: 1-2 days (default 1) " +
              "- Fresh red meat: 2-3 days (default 2) " +
              "- Minced/ground meat: 1 day (default 1) " +
              "- Deli meats / sliced ham: 3-5 days (default 3) " +
              "- Fresh milk: 5-10 days (default 7) " +
              "- Yogurt/kefir/sour cream: 10-21 days (default 14) " +
              "- Fresh cheese (cottage/quark): 5-10 days (default 7) " +
              "- Hard/aged cheese: 21-60 days (default 30) " +
              "- Eggs: 21-28 days (default 21) " +
              "- Bread/bakery: 1-3 days (default 2) " +
              "- Leafy greens/berries: 1-5 days (default 3) " +
              "- Fresh fruit/vegetables (general): 3-10 days (default 5) " +
              "- Ready-to-eat chilled meals/salads: 1-3 days (default 2) " +
              "- Frozen food: 90-365 days (default 180) " +
              "- Dry pantry / canned / shelf-stable beverages: expiry = null " +
              " " +
              "HARD CONSTRAINTS: " +
              "- expiry must NEVER be before base_date. " +
              "- expiry must NEVER be more than base_date + 365 days (except expiry = null). " +
              "- If item is shelf-stable pantry/canned/shelf-stable drinks: expiry = null (do not invent far-future dates). " +
              " " +
              "Calculate \"total\" as the sum of all prices (ignore nulls). " +
              " " +
              "Output ONLY raw JSON. " +
              "Do NOT use ```json or any code fencing. " +
              "Do NOT add extra text. Only the JSON object. in this exact structure:"


        },
        { role: "system", content: [
          "Return JSON with this exact shape:",
          "{ \"items\": [ { \"name\": string, \"quantity\": number, \"price\": number|null, \"expiryDate\": string|null } ] }",
          "- expiryDate must be ISO YYYY-MM-DD or null.",
          "- Do not include any other top-level keys.",
          "- No prose. No code fences."
        ].join(" ") },
        ...convertToModelMessages(messages),
      ],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}
