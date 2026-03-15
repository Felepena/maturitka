"use client"
import React, { createContext, useContext, useMemo, useState } from "react";

export type InventoryItem = { name: string; quantity: number; totalPrice?: number; earliestExpiry: string | null };

type InventoryContextValue = {
  items: InventoryItem[];
  setItems: (items: InventoryItem[]) => void;
};

const Ctx = createContext<InventoryContextValue | undefined>(undefined);

export function InventoryProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const value = useMemo(() => ({ items, setItems }), [items]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useInventory() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useInventory must be used within <InventoryProvider>");
  return v;
}

