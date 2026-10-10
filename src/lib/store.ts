import { useEffect, useState, useSyncExternalStore } from "react";

export const STORE_NAME = "ANSCHY STORE";
export const OWNER_NAME = "Gaiska Syahputra Cahyadi";
export const WA_NUMBER = "083898776076";
export const WA_LINK = "https://wa.me/6283898776076";
export const ACCOUNT_NAME = "ANDREANO SYAHPUTRA CAHYADI";
export const PAYMENTS = [
  { id: "QRIS", label: "QRIS", detail: "Scan dengan semua aplikasi" },
  { id: "DANA", label: "DANA", detail: "083898776076" },
  { id: "SEABANK", label: "SeaBank", detail: "901664210331" },
] as const;

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export type CartItem = { id: string; name: string; price: number; qty: number };
const KEY = "anschy_cart";
let listeners: (() => void)[] = [];
let cache: CartItem[] | null = null;
function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { cache = []; }
  return cache!;
}
function write(items: CartItem[]) {
  cache = items;
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
}
const empty: CartItem[] = [];
export function useCart() {
  const items = useSyncExternalStore(
    (l) => { listeners.push(l); return () => { listeners = listeners.filter((x) => x !== l); }; },
    read,
    () => empty,
  );
  return {
    items,
    add: (p: Omit<CartItem, "qty">) => {
      const cur = read();
      const f = cur.find((i) => i.id === p.id);
      write(f ? cur.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i)) : [...cur, { ...p, qty: 1 }]);
    },
    setQty: (id: string, qty: number) =>
      write(qty <= 0 ? read().filter((i) => i.id !== id) : read().map((i) => (i.id === id ? { ...i, qty } : i))),
    clear: () => write([]),
    total: items.reduce((s, i) => s + i.price * i.qty, 0),
    count: items.reduce((s, i) => s + i.qty, 0),
  };
}

export function useHydrated() {
  const [h, setH] = useState(false);
  useEffect(() => setH(true), []);
  return h;
}
