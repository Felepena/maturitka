import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function addManualItem(params: { uid: string; item: { name: string; quantity: number; grams?: number | null; price?: number | null; expiryDate?: string | null } }) {
  const { uid, item } = params;
  const col = collection(db, "users", uid, "receipts");
  const payload: any = {
    items: [
      {
        name: item.name,
        quantity: item.quantity,
        ...(item.grams != null ? { grams: item.grams } : {}),
        ...(item.price != null ? { price: item.price } : {}),
        ...(item.expiryDate !== undefined ? { expiryDate: item.expiryDate } : {}),
      },
    ],
    createdAt: serverTimestamp(),
    source: "manual",
  };
  await addDoc(col, payload);
}

