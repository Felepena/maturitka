"use client"

import { useCompletion } from "@ai-sdk/react";
import { useAuth } from "@/app/contex/contex";
import { useState } from "react";

export default function StreamPage() {
  const { user } = useAuth();
  const { input, handleInputChange, handleSubmit, completion, isLoading, error, setInput } = useCompletion({
    api: `/api/completion/stream${user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : ""}`,
  });
  const [lastPrompt, setLastPrompt] = useState<string | null>(null);

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ backgroundColor: '#F5F0D7' }}>
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-4">
          {error && <div className="text-red-600 text-sm">{error.message}</div>}
          {isLoading && !completion && (
            <div className="flex items-center gap-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600"></div>
              <span className="text-sm">Thinking…</span>
            </div>
          )}
          {lastPrompt && (
            <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-600 mb-1">You</div>
              <div className="whitespace-pre-wrap text-[15px] leading-6">{lastPrompt}</div>
            </div>
          )}
          {completion && (
            <div className="rounded-2xl border border-neutral-300 bg-white p-4 shadow-sm">
              <div className="text-xs font-medium text-neutral-600 mb-1">CheffAI</div>
              <div className="whitespace-pre-wrap text-[15px] leading-6">{completion}</div>
            </div>
          )}
        </div>
      </main>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const prompt = input.trim();
          if (!prompt) return;
          setLastPrompt(prompt);
          handleSubmit(e);
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
