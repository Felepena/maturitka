"use client"
import {useState} from "react";

export default function CompletionPage() {
  const [prompt, setPrompt] = useState(""); //user input

  const [completion, setCompletion] = useState("") //ai odpoved

  const [error , setError] = useState<string | null >(null);

  const [isLoading, setLoading] = useState(false);

  const complete = async (e : React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPrompt("");
    try {
      const response = await fetch("/api/completions", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({ prompt })
      })
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error||"something went wrong");
      }

      setCompletion(data.text);
      }catch (error) {
      console.log("Error", error)
      setError(error instanceof Error ? error.message
          : "Something went wrong. Please try again later.");
      } finally {
      setLoading(false);
    }

  };

  return (
    <div className="min-h-[100dvh] bg-neutral-50 text-neutral-900 flex flex-col">
      {error && <div className={"text-red-500 mb-4"}> {error} </div>}
      <main className="flex-1 w-full" />
      {isLoading ? (
          <div className="flex items-center justify-center w-full h-full">Loading...</div>
      ): completion ? (
          <div className="whitespace-pre-wrap">{completion}</div>
      ): null}
      <form onSubmit={complete} className="sticky bottom-0 w-full border-t border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-neutral-800">
            <input
              placeholder="How can I help you today?"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400 text-[15px] py-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <button
              type="submit"
              disabled={isLoading }
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-neutral-800 active:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden
              >
                <path d="M2.3 2.3a1 1 0 0 1 1.02-.24l18 6a1 1 0 0 1 0 1.88l-7.33 2.44a1 1 0 0 0-.62.62L11.03 20a1 1 0 0 1-1.88 0l-6-18a1 1 0 0 1 .15-.92ZM6.2 6.2l3.46 10.38 1.4-4.2a3 3 0 0 1 1.86-1.86l4.2-1.4L6.2 6.2Z" />
              </svg>
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
