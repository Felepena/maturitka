import {generateText} from "ai"
import {openai} from "@ai-sdk/openai"

export async function POST() {
    try {
        const {text} = await generateText({
            model: openai("gpt-4.1-nano"),
            prompt: "how are you",
        });

        return Response.json({text})

    }catch (error){
        console.error("error generateing text", error)
        return Response.json({ error: "Failed to generate text" }, { status: 500 })
    }

}
