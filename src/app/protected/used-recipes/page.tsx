"use client"

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contex/contex";
import { collection, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/config";
import { Item, ItemActions, ItemTitle } from "@/app/components/ui/item";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type UsedRecipe = { id: string; name: string; createdAt?: any; details?: string };

export default function UsedRecipesPage() {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<UsedRecipe[]>([]);
  const [armed, setArmed] = useState<string | null>(null);
  const sp = useSearchParams();
  const highlightId = sp.get("id") || null;

  useEffect(() => {
    if (!user?.uid) return;
    (async () => {
      const col = collection(db, "users", user.uid, "usedRecipes");
      const snap = await getDocs(col);
      const list: any[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      list.sort((a, b) => {
        const ta = (a as any)?.createdAt?.toMillis ? (a as any).createdAt.toMillis() : 0;
        const tb = (b as any)?.createdAt?.toMillis ? (b as any).createdAt.toMillis() : 0;
        return tb - ta;
      });
      setRecipes(list as any);
    })();
  }, [user?.uid]);

  return (
    <div className="min-h-[100dvh] bg-white">
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-4">
        <h1 className="text-xl font-semibold text-neutral-900">Used Recipes</h1>
        {recipes.length === 0 ? (
          <p className="text-neutral-600 text-sm">No used recipes yet.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {recipes.map((r) => (
              <Item key={r.id} className={`relative rounded-2xl border-[2px] border-neutral-200 bg-white shadow-sm p-4 sm:p-5 ${r.id === highlightId ? 'ring-2 ring-emerald-400' : ''}`}>
                <div className="flex-1 w-full flex flex-col min-w-0 pr-12">
                  <Link href={`/protected/used-recipes/${r.id}`} className="block max-w-full">
                    <ItemTitle className="whitespace-normal break-words leading-normal text-base">
                      {r.name || 'Recipe'}
                    </ItemTitle>
                  </Link>
                </div>
                <ItemActions className="absolute right-3 top-1/2 -translate-y-1/2">
                  {(() => {
                    const isArmed = armed === r.id;
                    return (
                      <button
                        aria-label={isArmed ? 'Confirm delete' : 'More'}
                        onClick={async () => {
                          if (!isArmed) { setArmed(r.id); return; }
                          if (!user?.uid) return alert('Sign in to delete.');
                          try {
                            await deleteDoc(doc(db, 'users', user.uid, 'usedRecipes', r.id));
                            setArmed(null);
                            setRecipes((cur) => cur.filter((x) => x.id !== r.id));
                          } catch (e: any) {
                            alert(e?.message ?? 'Failed to delete');
                          }
                        }}
                        onMouseLeave={() => setArmed((cur) => (cur === r.id ? null : cur))}
                        className={isArmed
                          ? 'inline-flex h-8 items-center justify-center rounded-md border border-red-600 bg-red-600 text-white hover:bg-red-700 px-3'
                          : 'inline-flex h-8 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 px-3'}
                      >
                        {isArmed ? <Trash2 className="h-4 w-4" /> : <MoreHorizontal className="h-4 w-4" />}
                      </button>
                    );
                  })()}
                </ItemActions>
              </Item>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
