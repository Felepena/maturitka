import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";
import { db } from "@/app/lib/config";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const qpUid = url.searchParams.get("uid") || undefined;
    const body = await req.json().catch(() => ({} as any));
    const prompt: string = body?.prompt ?? "";
    const uid: string | undefined = body?.uid ?? qpUid;

    // Gather Firestore context if a uid is provided; otherwise continue without it.
    let firestoreContext: any = null;
    if (uid) {
      try {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        const receiptsSnap = await getDocs(collection(db, "users", uid, "receipts"));

        const receipts = receiptsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Derive a compact inventory summary with earliest expiry and daysUntilExpiry.
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
      } catch (ctxErr) {
        // If Firestore access fails, proceed with prompt only.
        console.warn("Failed to fetch Firestore context:", ctxErr);
      }
    }

    const instructionPlaceholders = `
- Role/Persona: <You are an AI chef focused on preventing food waste. You plan meals, recipes, and prep steps that use available ingredients efficiently while maintaining food safety. You can read the current Firestore inventory data and should treat it as the source of truth.>
- Goals/Priority: <Primary goal is to use ingredients before they expire. Prefer ingredients with fewer days remaining until expiration, but you may choose a different item when it enables a plan that consumes more total at risk food, avoids unsafe combinations, or creates a more practical set of meals. Secondary goals are to minimize leftovers, reuse components across meals, and reduce unnecessary purchases.>
- Tone/Style: <Clear concise, practical, and neutral. Give direct instructions. Avoid filler and avoid emphasis formatting>
- Domain Rules/Constraints: <Use only ingredients present in Firestore unless the user explicitly allows buying items. Always check days remaining and prioritize items nearing expiration. Do not suggest using food that is expired or unsafe. If any Firestore fields are missing or ambiguous, state the assumption you are making and proceed with the best safe option. Prefer recipes that share base components to maximize usage. When proposing storage or prep, include safe handling and timing guidance based on days remaining>
- Output Format: <Plain text with short headings and numbered lists when helpful. No bullet points. No emojis. No emphasis or highlighting. Include an ingredient usage summary that maps each suggested recipe to the Firestore items it consumes and the quantity if available.>
`;

    const contextBlock = firestoreContext
      ? `\nHere is the user's Firestore data (JSON):\n${JSON.stringify(firestoreContext, null, 2)}\n\n`
      : "";

    const finalPrompt = `${instructionPlaceholders}${contextBlock}User message:\n${prompt}`;

    const result = streamText({
      model: openai("gpt-4.1-nano"),
      prompt: finalPrompt,
    });
    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("error generating text", error);
    return new Response("Failed to stream text", { status: 500 });
  }
}
