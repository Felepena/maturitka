import { doc, runTransaction, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type LegacyProduct = {
  product_name: string;
  quantity: number;
  price?: number | null;
  expiry_date?: string | Timestamp | null;
  [k: string]: any;
};

type ReceiptDoc = {
  data?: {
    products?: LegacyProduct[];
    [k: string]: any;
  };
  [k: string]: any;
};

const receiptRef = (uid: string, receiptId: string) =>
  doc(db, "users", uid, "receipts", receiptId);

function assertProducts(data: ReceiptDoc): LegacyProduct[] {
  const products = data?.data?.products;
  if (!Array.isArray(products)) {
    throw new Error("Receipt has no legacy products array at data.products");
  }
  return products.slice();
}

/**
 * Update a product inside data.products by index (partial merge).
 */
export async function updateProductInProducts(params: {
  uid: string;
  receiptId: string;
  index: number;
  patch: Partial<LegacyProduct>;
}) {
  const { uid, receiptId, index, patch } = params;
  await runTransaction(db, async (tx) => {
    const ref = receiptRef(uid, receiptId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Receipt not found");
    const docData = snap.data() as ReceiptDoc;

    const products = assertProducts(docData);
    if (index < 0 || index >= products.length) {
      throw new Error(`Index ${index} out of bounds`);
    }

    const merged: LegacyProduct = { ...products[index], ...patch };
    products[index] = merged;

    tx.update(ref, { "data.products": products });
  });
}

/**
 * Remove a product from data.products by index.
 */
export async function removeProductFromProducts(params: {
  uid: string;
  receiptId: string;
  index: number;
}) {
  const { uid, receiptId, index } = params;
  await runTransaction(db, async (tx) => {
    const ref = receiptRef(uid, receiptId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Receipt not found");
    const docData = snap.data() as ReceiptDoc;

    const products = assertProducts(docData);
    if (index < 0 || index >= products.length) {
      throw new Error(`Index ${index} out of bounds`);
    }

    products.splice(index, 1);
    tx.update(ref, { "data.products": products });
  });
}

/**
 * Decrement quantity of a product; if it reaches 0, remove it. amount defaults to 1.
 */
export async function decrementOrRemoveProduct(params: {
  uid: string;
  receiptId: string;
  index: number;
  amount?: number;
}) {
  const { uid, receiptId, index, amount = 1 } = params;
  if (amount <= 0) throw new Error("amount must be > 0");

  await runTransaction(db, async (tx) => {
    const ref = receiptRef(uid, receiptId);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Receipt not found");
    const docData = snap.data() as ReceiptDoc;

    const products = assertProducts(docData);
    if (index < 0 || index >= products.length) {
      throw new Error(`Index ${index} out of bounds`);
    }

    const current = products[index];
    const currentQty = Number.isFinite(Number(current.quantity))
      ? Number(current.quantity)
      : 0;

    const nextQty = currentQty - amount;
    if (nextQty <= 0) {
      products.splice(index, 1);
    } else {
      products[index] = { ...current, quantity: nextQty };
    }

    tx.update(ref, { "data.products": products });
  });
}

