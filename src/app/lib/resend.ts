import { Resend } from "resend";

const apiKeyRaw = process.env.RESEND_API_KEY;
if (!apiKeyRaw) {
  throw new Error("RESEND_API_KEY is not set");
}
// Normalize: trim whitespace and strip accidental wrapping quotes
const apiKey = apiKeyRaw.trim().replace(/^['"]|['"]$/g, "");
if (apiKey !== apiKeyRaw) {
  console.warn("RESEND_API_KEY normalized (trimmed/quotes removed).");
}

export const resend = new Resend(apiKey);
