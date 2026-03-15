import { db } from "@/app/lib/config";
import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";

export type MinimalUser = { uid: string } | null | undefined;

export async function saveReceipt(user: MinimalUser, text: string) {
  if (!user) {
    throw new Error("User not signed in");
  }

  await setDoc(
    doc(db, "users", user.uid),
    { uid: user.uid, updatedAt: serverTimestamp() },
    { merge: true }
  );

  const col = collection(db, "users", user.uid, "receipts");
  await addDoc(col, { text, createdAt: serverTimestamp() });
}

