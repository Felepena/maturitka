"use client"

import {useCompletion} from "@ai-sdk/react";

export default function StreamPage() {
    const {input, handleInputChange, handleSubmit, completion, isLoading, error, setInput } =  useCompletion({
        api:"/api/completion/stream"
    })
    return (
        <div className="min-h-[100dvh] bg-neutral-50 text-neutral-900 flex flex-col">
            {error && <div className="text-red-600 text-sm">{error.message}</div>}
            {
                isLoading && !completion && <div>Loading...</div>
            }
            {
                completion && <div className="whitespace-pre-wrap ">{completion}</div>
            }
            <form onSubmit={(e) => {
                e.preventDefault();
                setInput(" ")
                handleSubmit(e);
            }}
                  className="fixed bottom-0 w-full border-t border-neutral-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
                <div className="mx-auto max-w-3xl px-4 py-4">
                    <div className="flex items-center gap-2 rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-neutral-800">
                        <input
                            placeholder="How can I help you today?"
                            className="w-full bg-transparent outline-none placeholder:text-neutral-400 text-[15px] py-2"
                            value={input}
                            onChange={handleInputChange}
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
