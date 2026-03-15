import { collection, doc, getDocs, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

function normName(s: string) {
  return s.trim().toLowerCase();
}

export async function updateExpiryByName(params: {
  uid: string;
  productName: string;
  isoDate: string | null;
}) {
  const { uid, productName, isoDate } = params;
  const snap = await getDocs(collection(db, "users", uid, "receipts"));
  const target = normName(productName);
  const ops: Promise<void>[] = [];
  snap.forEach((d) => {
    const ref = doc(db, "users", uid, "receipts", d.id);
    ops.push(
      runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists()) return;
        const data = s.data() as any;
        const products: any[] = Array.isArray(data?.data?.products) ? data.data.products.slice() : [];
        const items: any[] = Array.isArray(data?.items) ? data.items.slice() : [];
        const itemsAlt: any[] = Array.isArray(data?.data?.items) ? data.data.items.slice() : [];
        let changed = false;
        for (let i = 0; i < products.length; i++) {
          const p = products[i];
          const name = typeof p?.product_name === "string" ? p.product_name : "";
          if (normName(name) === target) {
            products[i] = { ...p, expiry_date: isoDate ?? null };
            changed = true;
          }
        }
        for (let i = 0; i < items.length; i++) {
          const p = items[i];
          const name = typeof p?.name === "string" ? p.name : "";
          if (normName(name) === target) {
            items[i] = { ...p, expiryDate: isoDate ?? null };
            changed = true;
          }
        }
        for (let i = 0; i < itemsAlt.length; i++) {
          const p = itemsAlt[i];
          const name = typeof p?.name === "string" ? p.name : "";
          if (normName(name) === target) {
            itemsAlt[i] = { ...p, expiryDate: isoDate ?? null };
            changed = true;
          }
        }
        if (changed) tx.update(ref, {
          ...(Array.isArray(data?.data?.products) ? { "data.products": products } : {}),
          ...(Array.isArray(data?.items) ? { items } : {}),
          ...(Array.isArray(data?.data?.items) ? { "data.items": itemsAlt } : {}),
        });
      })
    );
  });
  await Promise.all(ops);
}

export async function decrementOrRemoveByName(params: {
  uid: string;
  productName: string;
  amount?: number;
}) {
  const { uid, productName, amount = 1 } = params;
  if (amount <= 0) return;
  const snap = await getDocs(collection(db, "users", uid, "receipts"));
  const target = normName(productName);
  const ops: Promise<void>[] = [];
  snap.forEach((d) => {
    const ref = doc(db, "users", uid, "receipts", d.id);
    ops.push(
      runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists()) return;
        const data = s.data() as any;
        let products: any[] = Array.isArray(data?.data?.products) ? data.data.products.slice() : [];
        let items: any[] = Array.isArray(data?.items) ? data.items.slice() : [];
        let itemsAlt: any[] = Array.isArray(data?.data?.items) ? data.data.items.slice() : [];
        let changed = false;
        products = products.reduce((acc: any[], p: any) => {
          const name = typeof p?.product_name === "string" ? p.product_name : "";
          if (normName(name) !== target) { acc.push(p); return acc; }
          const q = Number(p?.quantity);
          const cur = Number.isFinite(q) ? q : 0;
          const next = cur - amount;
          if (next > 0) { acc.push({ ...p, quantity: next }); }
          changed = true;
          return acc;
        }, [] as any[]);
        items = items.reduce((acc: any[], p: any) => {
          const name = typeof p?.name === "string" ? p.name : "";
          if (normName(name) !== target) { acc.push(p); return acc; }
          const q = Number(p?.quantity);
          const cur = Number.isFinite(q) ? q : 0;
          const next = cur - amount;
          if (next > 0) { acc.push({ ...p, quantity: next }); }
          changed = true;
          return acc;
        }, [] as any[]);
        itemsAlt = itemsAlt.reduce((acc: any[], p: any) => {
          const name = typeof p?.name === "string" ? p.name : "";
          if (normName(name) !== target) { acc.push(p); return acc; }
          const q = Number(p?.quantity);
          const cur = Number.isFinite(q) ? q : 0;
          const next = cur - amount;
          if (next > 0) { acc.push({ ...p, quantity: next }); }
          changed = true;
          return acc;
        }, [] as any[]);
        if (changed) tx.update(ref, {
          ...(Array.isArray(data?.data?.products) ? { "data.products": products } : {}),
          ...(Array.isArray(data?.items) ? { items } : {}),
          ...(Array.isArray(data?.data?.items) ? { "data.items": itemsAlt } : {}),
        });
      })
    );
  });
  await Promise.all(ops);
}

export async function removeAllByName(params: { uid: string; productName: string }) {
  const { uid, productName } = params;
  const snap = await getDocs(collection(db, "users", uid, "receipts"));
  const target = normName(productName);
  const ops: Promise<void>[] = [];
  snap.forEach((d) => {
    const ref = doc(db, "users", uid, "receipts", d.id);
    ops.push(
      runTransaction(db, async (tx) => {
        const s = await tx.get(ref);
        if (!s.exists()) return;
        const data = s.data() as any;
        const products: any[] = Array.isArray(data?.data?.products) ? data.data.products.slice() : [];
        const items: any[] = Array.isArray(data?.items) ? data.items.slice() : [];
        const itemsAlt: any[] = Array.isArray(data?.data?.items) ? data.data.items.slice() : [];
        const filteredP = products.filter((p) => normName(String(p?.product_name || "")) !== target);
        const filteredI = items.filter((p) => normName(String(p?.name || "")) !== target);
        const filteredIA = itemsAlt.filter((p) => normName(String(p?.name || "")) !== target);
        const updates: any = {};
        if (filteredP.length !== products.length) updates["data.products"] = filteredP;
        if (filteredI.length !== items.length) updates["items"] = filteredI;
        if (filteredIA.length !== itemsAlt.length) updates["data.items"] = filteredIA;
        if (Object.keys(updates).length) tx.update(ref, updates);
      })
    );
  });
  await Promise.all(ops);
}
