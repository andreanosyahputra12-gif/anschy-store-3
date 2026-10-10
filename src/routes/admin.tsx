import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { rupiah } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Panel Admin — ANSCHY STORE" },
      { name: "description", content: "Kelola pesanan, chat, dan produk." },
      { property: "og:title", content: "Panel Admin — ANSCHY STORE" },
      { property: "og:description", content: "Kelola pesanan, chat, dan produk." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

function Admin() {
  const nav = useNavigate();
  const [state, setState] = useState<"loading" | "no" | "ok">("loading");
  const [tab, setTab] = useState<"chat" | "orders" | "products">("chat");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return nav({ to: "/auth" });
      const { data } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
      setState(data ? "ok" : "no");
    })();
  }, [nav]);

  if (state === "loading") return <p className="p-10">Memuat...</p>;
  if (state === "no") return <div className="p-10">Akun ini bukan admin. <button className="text-primary underline" onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth", replace: true }); }}>Keluar</button></div>;

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-5 py-4">
        <Link to="/" className="font-display text-xl tracking-[0.2em] text-gold-gradient">ANSCHY ADMIN</Link>
        <div className="flex gap-2">
          {(["chat", "orders", "products"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded-full px-4 py-1.5 text-sm ${tab === t ? "bg-primary text-primary-foreground" : "border"}`}>
              {t === "chat" ? "Chat" : t === "orders" ? "Pesanan" : "Produk"}
            </button>
          ))}
          <button onClick={async () => { await supabase.auth.signOut(); nav({ to: "/auth", replace: true }); }} className="text-sm text-muted-foreground">Keluar</button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl p-5">
        {tab === "chat" && <Chats />}
        {tab === "orders" && <Orders />}
        {tab === "products" && <Products />}
      </main>
    </div>
  );
}

type Conv = { id: string; buyer_name: string; last_message_at: string; unread_admin: number };
type Msg = { id: string; sender: string; body: string; created_at: string };

function Chats() {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvs = async () => {
    const { data } = await supabase.from("conversations").select("*").order("last_message_at", { ascending: false });
    if (data) setConvs(data);
  };
  const loadMsgs = async (id: string) => {
    const { data } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at");
    if (data) setMsgs(data);
  };

  useEffect(() => {
    loadConvs();
    const ch = supabase.channel("admin-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => loadConvs())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (p) => {
        const m = p.new as Msg & { conversation_id: string };
        setMsgs((cur) => (m.conversation_id === activeRef.current && !cur.some((x) => x.id === m.id) ? [...cur, m] : cur));
        return undefined;
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const activeRef = useRef<string | null>(null);
  useEffect(() => {
    activeRef.current = active;
    if (active) {
      loadMsgs(active);
      supabase.from("conversations").update({ unread_admin: 0 }).eq("id", active).then(() => loadConvs());
    }
  }, [active]);
  useEffect(() => endRef.current?.scrollIntoView(), [msgs]);

  const reply = async () => {
    if (!active || !text.trim()) return;
    const body = text.trim().slice(0, 1000);
    setText("");
    const { error } = await supabase.from("messages").insert({ conversation_id: active, sender: "admin", body });
    if (error) { toast.error(error.message); return; }
    await supabase.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", active);
    loadMsgs(active);
  };

  return (
    <div className="grid h-[75vh] gap-4 md:grid-cols-[280px_1fr]">
      <div className="overflow-y-auto rounded-2xl border bg-card">
        {convs.length === 0 && <p className="p-4 text-sm text-muted-foreground">Belum ada chat.</p>}
        {convs.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} className={`flex w-full items-center justify-between border-b p-4 text-left ${active === c.id ? "bg-accent" : ""}`}>
            <div><p className="font-semibold">{c.buyer_name}</p><p className="text-xs text-muted-foreground">{new Date(c.last_message_at).toLocaleString("id-ID")}</p></div>
            {c.unread_admin > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{c.unread_admin}</span>}
          </button>
        ))}
      </div>
      <div className="flex flex-col rounded-2xl border bg-card">
        {!active ? <p className="m-auto text-sm text-muted-foreground">Pilih percakapan</p> : (
          <>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {msgs.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.sender === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.body}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="flex gap-2 border-t p-3">
              <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && reply()} placeholder="Balas pembeli..." className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={reply} className="rounded-lg bg-gold-gradient px-5 text-sm font-semibold text-primary-foreground">Kirim</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

type Order = { id: string; customer_name: string; whatsapp: string; items: unknown; total: number; payment_method: string; status: string; created_at: string };

function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };
  useEffect(() => {
    load();
    const ch = supabase.channel("admin-orders").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => load()).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);
  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  return (
    <div className="space-y-3">
      {orders.length === 0 && <p className="text-sm text-muted-foreground">Belum ada pesanan.</p>}
      {orders.map((o) => (
        <div key={o.id} className="flex flex-wrap items-center gap-4 rounded-2xl border bg-card p-4">
          <div className="flex-1">
            <p className="font-semibold">#{o.id.slice(0, 8).toUpperCase()} — {o.customer_name}</p>
            <p className="text-xs text-muted-foreground">{(o.items as { name: string; qty: number }[]).map((i) => `${i.name}×${i.qty}`).join(", ")}</p>
            <a href={`https://wa.me/${o.whatsapp.replace(/^0/, "62").replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="text-xs text-primary">WA {o.whatsapp}</a>
          </div>
          <div className="text-right"><p className="font-display text-2xl text-gold-gradient">{rupiah(o.total)}</p><p className="text-xs">{o.payment_method}</p></div>
          <select value={o.status} onChange={(e) => setStatus(o.id, e.target.value)} className="rounded-lg border bg-background px-3 py-2 text-sm">
            <option value="menunggu">Menunggu</option><option value="dibayar">Dibayar</option><option value="selesai">Selesai</option><option value="batal">Batal</option>
          </select>
        </div>
      ))}
    </div>
  );
}

type Product = { id: string; category: string; tag: string; name: string; badge: string | null; description: string | null; duration: string | null; price: number; active: boolean; sort: number };

function Products() {
  const [list, setList] = useState<Product[]>([]);
  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("sort");
    if (data) setList(data as Product[]);
  };
  useEffect(() => { load(); }, []);
  const save = async (p: Product) => {
    const { id, ...rest } = p;
    const { error } = await supabase.from("products").update(rest).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Tersimpan");
  };
  const addNew = async () => {
    const { error } = await supabase.from("products").insert({ name: "Produk baru", price: 10000, sort: list.length + 1 });
    if (error) toast.error(error.message); else load();
  };
  const del = async (id: string) => {
    if (!confirm("Hapus produk?")) return;
    await supabase.from("products").delete().eq("id", id); load();
  };
  const upd = (id: string, patch: Partial<Product>) => setList((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const inp = "rounded-lg border bg-background px-2 py-1.5 text-sm";
  return (
    <div className="space-y-3">
      <button onClick={addNew} className="rounded-full bg-gold-gradient px-5 py-2 text-sm font-semibold text-primary-foreground">+ Tambah produk</button>
      {list.map((p) => (
        <div key={p.id} className="grid gap-2 rounded-2xl border bg-card p-4 md:grid-cols-6">
          <input className={`${inp} md:col-span-2`} value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} />
          <input className={inp} type="number" value={p.price} onChange={(e) => upd(p.id, { price: Number(e.target.value) })} />
          <select className={inp} value={p.category} onChange={(e) => upd(p.id, { category: e.target.value })}><option value="premium">Akun premium</option><option value="iphone">Layanan iPhone</option></select>
          <input className={inp} placeholder="Kategori" value={p.tag} onChange={(e) => upd(p.id, { tag: e.target.value })} />
          <input className={inp} placeholder="Durasi" value={p.duration ?? ""} onChange={(e) => upd(p.id, { duration: e.target.value })} />
          <input className={`${inp} md:col-span-3`} placeholder="Deskripsi" value={p.description ?? ""} onChange={(e) => upd(p.id, { description: e.target.value })} />
          <input className={inp} placeholder="Label" value={p.badge ?? ""} onChange={(e) => upd(p.id, { badge: e.target.value })} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={p.active} onChange={(e) => upd(p.id, { active: e.target.checked })} /> Tampil</label>
          <div className="flex gap-2"><button onClick={() => save(p)} className="rounded-lg bg-primary px-3 text-sm text-primary-foreground">Simpan</button><button onClick={() => del(p.id)} className="text-sm text-destructive">Hapus</button></div>
        </div>
      ))}
    </div>
  );
}
