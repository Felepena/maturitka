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

// Rename a product everywhere it appears across receipts.
export async function renameByName(params: { uid: string; fromName: string; toName: string }) {
  const { uid, fromName, toName } = params;
  const snap = await getDocs(collection(db, "users", uid, "receipts"));
  const target = normName(fromName);
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
          const name = typeof products[i]?.product_name === 'string' ? products[i].product_name : '';
          if (normName(name) === target) { products[i] = { ...products[i], product_name: toName }; changed = true; }
        }
        for (let i = 0; i < items.length; i++) {
          const name = typeof items[i]?.name === 'string' ? items[i].name : '';
          if (normName(name) === target) { items[i] = { ...items[i], name: toName }; changed = true; }
        }
        for (let i = 0; i < itemsAlt.length; i++) {
          const name = typeof itemsAlt[i]?.name === 'string' ? itemsAlt[i].name : '';
          if (normName(name) === target) { itemsAlt[i] = { ...itemsAlt[i], name: toName }; changed = true; }
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

// Set the aggregate quantity for a product name across all receipts.
// Strategy: set the first matching item's quantity to newQty and remove other matches.
export async function setQuantityByName(params: { uid: string; productName: string; quantity: number }) {
  const { uid, productName, quantity } = params;
  const snap = await getDocs(collection(db, "users", uid, "receipts"));
  const target = normName(productName);
  let firstSet = false;
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

        const updateOrFilter = (arr: any[], nameSelector: (p:any)=>string, setKey: string) => {
          const next: any[] = [];
          for (const p of arr) {
            const name = nameSelector(p);
            if (normName(name) !== target) { next.push(p); continue; }
            if (!firstSet && quantity > 0) {
              next.push({ ...p, quantity });
              firstSet = true;
              changed = true;
            } else {
              // drop extra matches
              changed = true;
            }
          }
          return next;
        };

        products = updateOrFilter(products, (p)=> String(p?.product_name || ""), "data.products");
        items = updateOrFilter(items, (p)=> String(p?.name || ""), "items");
        itemsAlt = updateOrFilter(itemsAlt, (p)=> String(p?.name || ""), "data.items");

        // If we didn't set anywhere and need to add: do nothing (can't create reliably without context)

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

// Set grams for a product name across all receipts.
// Strategy: update all matching entries with the provided grams (null allowed).
export async function setGramsByName(params: { uid: string; productName: string; grams: number | null }) {
  const { uid, productName, grams } = params;
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

        for (let i = 0; i < products.length; i++) {
          const name = String(products[i]?.product_name || "");
          if (normName(name) === target) { products[i] = { ...products[i], grams: grams ?? null }; changed = true; }
        }
        for (let i = 0; i < items.length; i++) {
          const name = String(items[i]?.name || "");
          if (normName(name) === target) { items[i] = { ...items[i], grams: grams ?? null }; changed = true; }
        }
        for (let i = 0; i < itemsAlt.length; i++) {
          const name = String(itemsAlt[i]?.name || "");
          if (normName(name) === target) { itemsAlt[i] = { ...itemsAlt[i], grams: grams ?? null }; changed = true; }
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

// Decrement grams for a product across all receipts. If grams becomes <= 0, set to null.
export async function decrementGramsByName(params: { uid: string; productName: string; grams: number }) {
  const { uid, productName, grams } = params;
  if (!(grams > 0)) return;
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

        const dec = (arr: any[], nameSel: (p:any)=>string) => {
          for (let i = 0; i < arr.length; i++) {
            const name = nameSel(arr[i]);
            if (normName(name) !== target) continue;
            const g = Number(arr[i]?.grams);
            if (!Number.isFinite(g)) continue;
            const next = g - grams;
            arr[i] = { ...arr[i], grams: next > 0 ? next : null };
            changed = true;
          }
        };
        dec(products, (p)=> String(p?.product_name || ""));
        dec(items, (p)=> String(p?.name || ""));
        dec(itemsAlt, (p)=> String(p?.name || ""));

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
