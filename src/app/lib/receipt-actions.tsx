"use client";
import { useCallback } from "react";
import { useAuth } from "@/app/contex/contex";
import {
  updateProductInProducts,
  removeProductFromProducts,
  decrementOrRemoveProduct,
} from "@/app/lib/receipt-mutations";

export function useReceiptProductActions() {
  const { user } = useAuth();

  const onUpdateExpiry = useCallback(
    async (receiptId: string, index: number, isoDate: string | null) => {
      if (!user?.uid) throw new Error("Not signed in");
      await updateProductInProducts({
        uid: user.uid,
        receiptId,
        index,
        patch: { expiry_date: isoDate ?? null },
      });
    },
    [user?.uid]
  );

  const onUpdateName = useCallback(
    async (receiptId: string, index: number, name: string) => {
      if (!user?.uid) throw new Error("Not signed in");
      await updateProductInProducts({
        uid: user.uid,
        receiptId,
        index,
        patch: { product_name: name },
      });
    },
    [user?.uid]
  );

  const onUpdateQuantity = useCallback(
    async (receiptId: string, index: number, quantity: number) => {
      if (!user?.uid) throw new Error("Not signed in");
      await updateProductInProducts({
        uid: user.uid,
        receiptId,
        index,
        patch: { quantity },
      });
    },
    [user?.uid]
  );

  const onDecrement = useCallback(
    async (receiptId: string, index: number, amount = 1) => {
      if (!user?.uid) throw new Error("Not signed in");
      await decrementOrRemoveProduct({ uid: user.uid, receiptId, index, amount });
    },
    [user?.uid]
  );

  const onRemove = useCallback(
    async (receiptId: string, index: number) => {
      if (!user?.uid) throw new Error("Not signed in");
      await removeProductFromProducts({ uid: user.uid, receiptId, index });
    },
    [user?.uid]
  );

  return { onUpdateExpiry, onUpdateName, onUpdateQuantity, onDecrement, onRemove };
}

// Example usage wiring (no layout):
// const { onUpdateExpiry, onUpdateName, onUpdateQuantity, onDecrement, onRemove } = useReceiptProductActions();
// <button onClick={() => onUpdateExpiry(receiptId, idx, "2026-02-01")}>Save date</button>
// <button onClick={() => onUpdateName(receiptId, idx, "Orange Juice")}>Rename</button>
// <button onClick={() => onUpdateQuantity(receiptId, idx, 3)}>Set qty</button>
// <button onClick={() => onDecrement(receiptId, idx, 1)}>-</button>
// <button onClick={() => onRemove(receiptId, idx)}>Remove</button>

