"use client";

import { useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAuth } from "@/app/contex/contex";
import { db } from "@/app/lib/config";
import { addDoc, collection, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { FileUpload } from "@/app/components/ui/file-upload";
import { Button } from "@/app/components/ui/button";

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
        if (depth > 4) return;
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

  const { sendMessage, status, error, stop, messages } = useChat({
    transport: new DefaultChatTransport({ api: `/api/multimodel-chat${user?.uid ? `?uid=${encodeURIComponent(user.uid)}` : ""}` }),
    onFinish: async (m: any) => {
      try {
        const evt = m as any;
        const msg = evt?.message ?? evt;
        const allMessages = (evt?.messages ?? messages) as any[];

        let finalText = extractTextFromMessage(msg);
        if (!finalText && Array.isArray(allMessages)) {
          for (let i = allMessages.length - 1; i >= 0; i--) {
            const candidate = allMessages[i];
            if (candidate?.role === "assistant") {
              finalText = extractTextFromMessage(candidate);
              if (finalText) break;
            }
          }
        }
        if (!finalText && Array.isArray(allMessages) && allMessages.length >= 2) {
          const maybe = allMessages[allMessages.length - 2];
          if (maybe?.role === "assistant") finalText = extractTextFromMessage(maybe);
        }
        if (!finalText) {
          try {
            const raw = JSON.stringify(msg ?? m);
            finalText = raw.slice(0, 5000);
          } catch {
            setMessage("No assistant text to save.");
            return;
          }
        }
        if (!user) { setMessage("Please sign in to save the result."); return; }
        const col = collection(db, "users", user.uid, "receipts");
        await setDoc(doc(db, "users", user.uid), { uid: user.uid, updatedAt: serverTimestamp() }, { merge: true });
        try {
          const parsed = JSON.parse(finalText);
          await addDoc(col, { data: parsed, createdAt: serverTimestamp(), format: "json" });
        } catch {
          await addDoc(col, { text: finalText, createdAt: serverTimestamp(), format: "text" });
        }
        setMessage("done");
      } catch (e: any) {
        const msg = (e && e.message) ? String(e.message) : "Failed to save to database.";
        setMessage(msg);
      }
    },
  });

  const hasImage = useMemo(() => (files?.[0]?.type || "").startsWith("image/"), [files]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!files || files.length === 0 || !hasImage) return;
    sendMessage({ files });
    setFiles(undefined);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-[100dvh] text-neutral-900 flex flex-col items-center justify-center px-4" style={{ backgroundColor: '#FFFFFF' }}>
      <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
        <FileUpload
          className="shadow-sm"
          label="Upload image"
          description="Drag and drop or browse"
          accept="image/*"
          maxSizeMB={10}
          onFiles={(fl) => {
            const dt = new DataTransfer();
            const f = fl[0];
            if (f && f.type.startsWith("image/")) dt.items.add(f);
            setFiles(dt.files);
          }}
        />
        <div className="flex items-center justify-between">
          <div className="text-sm text-neutral-600">
            {status === "submitted" || status === "streaming" ? "Wait…" : message === "done" ? "Done." : ""}
          </div>
          <div className="flex gap-2">
            {status === "submitted" || status === "streaming" ? (
              <Button type="button" onClick={stop} className="rounded-xl bg-red-700 hover:bg-red-800">
                Stop
              </Button>
            ) : (
              <Button type="submit" disabled={!hasImage || status !== "ready"} className="rounded-full bg-[#5E7A0F] hover:bg-[#4f670d]">
                Send Image
              </Button>
            )}
          </div>
        </div>
        {error && <div className="text-red-600 text-sm">{error.message}</div>}
      </form>
    </div>
  );
}

