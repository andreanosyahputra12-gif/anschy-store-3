import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/Header";
import { PAYMENTS, rupiah, useCart, useHydrated } from "@/lib/store";

export const Route = createFileRoute("/keranjang")({
  head: () => ({
    meta: [
      { title: "Keranjang — ANSCHY STORE" },
      { name: "description", content: "Checkout pesanan ANSCHY STORE." },
      { property: "og:title", content: "Keranjang — ANSCHY STORE" },
      { property: "og:description", content: "Checkout pesanan ANSCHY STORE." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const cart = useCart();
  const h = useHydrated();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [wa, setWa] = useState("");
  const [method, setMethod] = useState<string>("QRIS");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const checkout = async () => {
    setErr(""); setBusy(true);
    const { data, error } = await supabase.rpc("create_order", {
      _name: name, _wa: wa, _method: method,
      _items: cart.items.map((i) => ({ id: i.id, qty: i.qty })),
    });
    setBusy(false);
    if (error) return setErr(error.message);
    cart.clear();
    nav({ to: "/pesanan/$id", params: { id: (data as { id: string }).id } });
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <h1 className="text-5xl">Keranjang</h1>
        {!h ? null : cart.items.length === 0 ? (
          <p className="mt-8 text-muted-foreground">Keranjang kosong. <Link to="/" className="text-primary underline">Belanja dulu</Link></p>
        ) : (
          <>
            <div className="mt-8 divide-y rounded-2xl border bg-card">
              {cart.items.map((i) => (
                <div key={i.id} className="flex items-center gap-4 p-4">
                  <div className="flex-1"><p className="font-semibold">{i.name}</p><p className="text-sm text-muted-foreground">{rupiah(i.price)}</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => cart.setQty(i.id, i.qty - 1)} className="h-8 w-8 rounded-full border">−</button>
                    <span className="w-6 text-center">{i.qty}</span>
                    <button onClick={() => cart.setQty(i.id, i.qty + 1)} className="h-8 w-8 rounded-full border">+</button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between p-4 font-semibold"><span>Subtotal</span><span className="text-gold-gradient">{rupiah(cart.total)}</span></div>
            </div>
            <div className="mt-8 space-y-4 rounded-2xl border bg-card p-6">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" maxLength={100} className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
              <input value={wa} onChange={(e) => setWa(e.target.value.replace(/[^0-9+]/g, ""))} placeholder="Nomor WhatsApp" maxLength={20} className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
              <div className="grid grid-cols-3 gap-2">
                {PAYMENTS.map((p) => (
                  <button key={p.id} onClick={() => setMethod(p.id)} className={`rounded-lg border p-3 text-sm ${method === p.id ? "border-primary bg-accent text-accent-foreground" : ""}`}>{p.label}</button>
                ))}
              </div>
              {err && <p className="text-sm text-destructive">{err}</p>}
              <button disabled={busy || !name.trim() || wa.length < 8} onClick={checkout} className="w-full rounded-full bg-gold-gradient py-3 font-semibold text-primary-foreground disabled:opacity-50">
                {busy ? "Memproses..." : "Checkout"}
              </button>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
