import { UIMessage, streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai("gpt-4o-mini"),
      messages: [
        { role: "system",content: "You parse a receipt provided as plain text. " +
              " " +
              "Today: 2026-01-06 " +
              " " +
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
              "- if receipt date is found: base_date = receipt date " +
              "- otherwise: base_date = Today " +
              " " +
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
