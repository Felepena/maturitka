"use client"

import { useAuth } from "@/app/contex/contex";
import { db } from "@/app/lib/config";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UsedRecipeDoc = { name?: string; ingredients?: any[]; details?: string };

export default function UsedRecipeDetailPage() {
  const { user } = useAuth();
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;
  const [data, setData] = useState<UsedRecipeDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user?.uid || !id) return;
        const snap = await getDoc(doc(db, 'users', user.uid, 'usedRecipes', id));
        if (!mounted) return;
        if (!snap.exists()) {
          setError('Recipe not found');
        } else {
          setData(snap.data() as any);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message ?? 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false };
  }, [user?.uid, id]);

  return (
    <div className="min-h-[100dvh] bg-white">
      <main className="mx-auto max-w-3xl px-4 py-8 space-y-4">
        <button onClick={() => router.back()} className="text-sm text-neutral-700 hover:text-neutral-900 underline underline-offset-4">Back</button>
        {loading && <p className="text-neutral-700">Loading…</p>}
        {error && <p className="text-red-600">{error}</p>}
        {!loading && !error && (
          <div className="rounded-2xl border border-neutral-300 bg-white p-5 shadow-sm">
            <h1 className="text-2xl font-bold text-neutral-900 mb-4">{data?.name || 'Recipe'}</h1>
            {!!(data?.ingredients && data.ingredients.length) && (
              <div className="mb-4">
                <h2 className="text-base font-semibold text-neutral-800 mb-2">Ingredients</h2>
                <ul className="list-disc ml-5 text-neutral-800 space-y-1">
                  {data!.ingredients!.map((i: any, idx: number) => (
                    <li key={idx}>
                      <span>{String(i?.name ?? '')}</span>
                      {i?.grams ? <span> — {i.grams} g</span> : (i?.quantity ? <span> — {i.quantity}</span> : null)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!!data?.details && (
              <div>
                <h2 className="text-base font-semibold text-neutral-800 mb-2">Steps</h2>
                <pre className="whitespace-pre-wrap text-[15px] leading-6 text-neutral-900">{data.details}</pre>
              </div>
            )}
            {!data?.details && (
              <p className="text-neutral-600 text-sm">No step-by-step text saved for this recipe.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

