import { UIMessage, streamText, convertToModelMessages } from "ai";
import { openai } from "@ai-sdk/openai";

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const result = streamText({
      model: openai("gpt-4o-mini"), // vision-capable
      messages: [
        { role: "system", content: "You parse a receipt provided as plain text. " +
              "Your tasks: " +
              " " +
              "Extract each product line. " +
              " " +
              "Identify the product name. " +
              " " +
              "Estimate the quantity if it is not explicitly written (default = 1). " +
              " " +
              "Extract the price if present; if not found, return null. " +
              " " +
              "Estimate an expiry date based on typical shelf-life rules. If the item is non-perishable return null. " +
              " " +
              "Calculate \"total\" as the sum of all prices (ignore nulls). " +
              " " +
              "Output ONLY raw JSON." +
              "Do NOT use ```json or any code fencing." +
              "Do NOT add extra text. Only the JSON object. in this exact structure:"  },
        ...convertToModelMessages(messages),
      ],
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("Error streaming chat completion:", error);
    return new Response("Failed to stream chat completion", { status: 500 });
  }
}

