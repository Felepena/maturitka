"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import Image from "next/image";
import { useAuth } from "@/app/contex/contex";
import { db } from "@/app/lib/config";
import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";

export default function MultiModalChatPage() {
  const [files, setFiles] = useState<FileList | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const [message, setMessage] = useState<string | null>(null);
  

  function extractTextFromMessage(message: any): string {
    if (!message) return "";
    const tryString = (v: any) => (typeof v === "string" ? v : "");
    let text = tryString(message.text) || tryString(message.content);
    const parts = Array.isArray(message.parts) ? message.parts : Array.isArray(message.content) ? message.content : [];
    if (!text && Array.isArray(parts)) {
      const texts: string[] = [];
      for (const p of parts) {
        if (!p) continue;
        if (typeof p.text === "string") texts.push(p.text);
        else if (typeof p.content === "string") texts.push(p.content);
        else if (p.value && typeof p.value.text === "string") texts.push(p.value.text);
      }
      text = texts.join(" ").trim();
    }
    if (text && text.trim()) return text.trim();
    try {
      const collected: string[] = [];
      const visit = (node: any, depth: number) => {
        if (depth > 4) return; // avoid huge traversals
        if (typeof node === "string") {
          const s = node.trim();
          if (s) collected.push(s);
          return;
        }
        if (Array.isArray(node)) {
          for (const v of node) visit(v, depth + 1);
          return;
        }
        if (node && typeof node === "object") {
          for (const k of Object.keys(node)) visit(node[k], depth + 1);
        }
      };
      visit(message, 0);
      const joined = collected.join(" ");
      return joined.slice(0, 10000);
    } catch {}
    return "";
  }

  const { messages, sendMessage, status, error, stop } = useChat({
    transport: new DefaultChatTransport({ api: `/api/multimodel-chat${user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : ""}` }),
    onFinish: async (m: any) => {
      try {
        // Normalize event/message shape from the SDK
        const evt = m as any;
        const msg = evt?.message ?? evt; // some SDKs pass { message, messages, ... }
        const allMessages = (evt?.messages ?? messages) as any[];

        // 1) Try the provided message directly
        let finalText = extractTextFromMessage(msg);
        const debugCandidates: Array<{ label: string; len: number }> = [
          { label: "from msg", len: finalText.length },
        ];

        // 2) If empty, scan from end for the latest assistant message with text
        if (!finalText && Array.isArray(allMessages)) {
          for (let i = allMessages.length - 1; i >= 0; i--) {
            const candidate = allMessages[i];
            if (candidate?.role === "assistant") {
              finalText = extractTextFromMessage(candidate);
              if (finalText) break;
            }
          }
        }

        // 3) If still empty, try the second-to-last message (sometimes last is user echo)
        if (!finalText && Array.isArray(allMessages) && allMessages.length >= 2) {
          const maybe = allMessages[allMessages.length - 2];
          if (maybe?.role === "assistant") {
            finalText = extractTextFromMessage(maybe);
          }
        }
        if (!finalText) {
          try {
            const raw = JSON.stringify(msg ?? m);
            finalText = raw.slice(0, 5000);
            console.warn("Falling back to raw assistant JSON for saving. Length:", finalText.length);
          } catch {
            console.warn("No assistant text found to save", m);
            setMessage("No assistant text to save.");
            return;
          }
        }
        if (!user) { setMessage("Please sign in to save the result."); return; }
        const col = collection(db, "users", user.uid, "receipts");
        console.log("Saving completion to Firestore...", { uid: user.uid, len: finalText.length, sample: finalText.slice(0, 60) });
        await setDoc(doc(db, "users", user.uid), { uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
        // Prefer JSON; if not valid JSON, save raw text so nothing is lost
        try {
          const parsed = JSON.parse(finalText);
          await addDoc(col, { data: parsed, createdAt: serverTimestamp(), format: "json" });
        } catch {
          await addDoc(col, { text: finalText, createdAt: serverTimestamp(), format: "text" });
        }
        console.log("Saved to Firestore");  setMessage("Saved to your database.");
      } catch (e: any) {console.error("Firestore save failed", e);
        const msg = (e && e.message) ? String(e.message) : "Failed to save to database.";
        setMessage(msg.includes("Missing or insufficient permissions") ? "Missing Firestore permissions for users/" + (user?.uid||"<uid>") + "/receipts. Check security rules." : msg);
      }
    },
  });

  // Auto-save whenever a new assistant message appears (mirrors CompletionPage logic)
  

  const hasImage = useMemo(() => (files?.[0]?.type || "").startsWith("image/"), [files]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files || files.length === 0 || !hasImage) return;
    sendMessage({ files });
    setFiles(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-[100dvh] text-neutral-900 flex flex-col" style={{ backgroundColor: '#F5F0D7' }}>
      <main className="flex-1 w-full">
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900">Add Products From a Photo</h1>
            <p className="text-neutral-700">Upload a receipt or fridge photo. We’ll analyze it and save the items.</p>
          </div>
          {error && <div className="text-red-600 text-sm">{error.message}</div>}
          {message && <div className="text-green-700 text-sm">{message}</div>}

          {(() => { const list = ((status === "submitted" || status === "streaming") && messages[messages.length-1]?.role === "assistant") ? messages.slice(0, -1) : messages; return list.map((message) => (
            <div key={message.id} className="mb-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="font-semibold mb-2 text-neutral-800">
                {message.role === "user" ? "You" : "AI"}
              </div>
              {message.parts.map((part, index) => {
                switch (part.type) {
                  case "text":
                    return (
                      <div key={`${message.id}-${index}`} className="whitespace-pre-wrap text-[15px] leading-6 text-neutral-800">
                        {part.text}
                      </div>
                    );
                  case "file":
                    if (part.mediaType?.startsWith("image/")) {
                      return (
                        <Image
                          key={`${message.id}-${index}`}
                          src={part.url}
                          alt={part.filename ?? `attachment-${index}`}
                          width={640}
                          height={640}
                          className="rounded-xl border border-neutral-200"
                        />
                      );
                    }
                    return null;
                  default:
                    return null;
                }
              })}
            </div>
          ))})()}

          {(status === "submitted" || status === "streaming") && (
            <div className="flex items-center gap-2 text-neutral-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-neutral-600"></div>
              <span className="text-sm">Analyzing image…</span>
            </div>
          )}
        </div>
      </main>

      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 w-full border-t backdrop-blur"
        style={{ backgroundColor: '#EEF3E0', borderTopColor: '#D6E3B8', borderTopWidth: 1 }}
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center gap-3 rounded-full border bg-white px-2 py-2 shadow" style={{ borderColor: '#D6E3B8' }}>
            <label
              htmlFor="file-upload"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-neutral-800 hover:text-neutral-900 cursor-pointer border border-neutral-300 hover:border-neutral-400 bg-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden>
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
              </svg>
              {files?.length ? "Change Image" : "Upload Image"}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const fl = event.target.files || undefined;
                if (fl && fl.length > 0) {
                  const dt = new DataTransfer();
                  if (fl[0] && fl[0].type.startsWith("image/")) dt.items.add(fl[0]);
                  setFiles(dt.files);
                } else {
                  setFiles(undefined);
                }
              }}
              ref={fileInputRef}
            />
            <div className="ml-auto flex items-center gap-2">
              {status === "submitted" || status === "streaming" ? (
                <button
                  type="button"
                  onClick={stop}
                  className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: '#B3261E' }}
                >
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!hasImage || status !== "ready"}
                  className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#5E7A0F' }}
                >
                  Send Image
                </button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
