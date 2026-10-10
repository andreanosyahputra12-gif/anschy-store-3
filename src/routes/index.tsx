import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";
import { ACCOUNT_NAME, OWNER_NAME, PAYMENTS, STORE_NAME, WA_LINK, WA_NUMBER, rupiah, useCart } from "@/lib/store";
import ownerImg from "@/assets/owner.jpg.asset.json";
import qrisImg from "@/assets/qris.jpg.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ANSCHY STORE — Akun Premium & Layanan iPhone" },
      { name: "description", content: "Netflix, Spotify, CapCut, YouTube Premium dan layanan iPhone. Bayar via QRIS, DANA, SeaBank." },
      { property: "og:title", content: "ANSCHY STORE — Akun Premium & Layanan iPhone" },
      { property: "og:description", content: "Pengalaman premium. Tanpa kompromi. Belanja akun premium dan layanan iPhone." },
    ],
  }),
  component: Index,
});

type Product = { id: string; category: string; tag: string; name: string; badge: string | null; description: string | null; duration: string | null; price: number };

const FAQ = [
  ["Bagaimana cara membayar?", `Di keranjang, total ditambah kode unik 1–9 rupiah. Transfer persis nominal itu ke DANA ${WA_NUMBER}, SeaBank 901664210331, atau scan QRIS. Semua atas nama ${ACCOUNT_NAME}.`],
  ["Apakah akun langsung aktif?", "Setelah pembayaran terverifikasi, pesanan diproses oleh penjual. Status pesanan bisa kamu pantau di halaman pesanan."],
  ["Layanan iPhone?", "Pastikan perangkat milik sendiri dan siapkan bukti kepemilikan. Tidak melayani perangkat hilang atau curian."],
  ["Apakah unblock IMEI mengubah nomor IMEI?", "Tidak. Layanan hanya mencakup pemeriksaan serta pemulihan jaringan sesuai kelayakan perangkat."],
];

function Index() {
  const cart = useCart();
  const [cat, setCat] = useState("SEMUA");
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true).order("sort");
      if (error) throw error;
      return data as Product[];
    },
  });
  const premium = products.filter((p) => p.category === "premium");
  const iphone = products.filter((p) => p.category === "iphone");
  const tags = ["SEMUA", ...Array.from(new Set(premium.map((p) => p.tag)))];
  const add = (p: Product) => { cart.add({ id: p.id, name: p.name, price: p.price }); toast.success(`${p.name} masuk keranjang`); };

  return (
    <div className="min-h-screen">
      <Header />
      <section className="bg-hero">
        <div className="mx-auto max-w-6xl px-5 py-24 text-center md:py-32">
          <p className="text-xs tracking-[0.4em] text-primary">PILIHAN DIGITAL UNTUK KESEHARIANMU</p>
          <h1 className="mt-6 text-5xl font-semibold leading-tight md:text-7xl">
            Pengalaman <span className="text-gold-gradient italic">premium.</span><br />Tanpa kompromi.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground">Nonton lebih puas. Berkarya lebih bebas. Temukan akun premium dan solusi iPhone pilihan di {STORE_NAME}.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <a href="#produk" className="rounded-full bg-gold-gradient px-7 py-3 text-sm font-semibold text-primary-foreground shadow-gold">Temukan produkmu</a>
            <a href="#iphone" className="rounded-full border px-7 py-3 text-sm hover:border-primary">Layanan iPhone</a>
          </div>
        </div>
      </section>

      <section id="produk" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs tracking-[0.3em] text-primary">01 — AKUN PREMIUM</p>
        <h2 className="mt-3 text-4xl md:text-5xl">Upgrade hari-harimu.</h2>
        <div className="mt-8 flex flex-wrap gap-2">
          {tags.map((t) => (
            <button key={t} onClick={() => setCat(t)} className={`rounded-full border px-4 py-1.5 text-xs tracking-wider ${cat === t ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}>{t}</button>
          ))}
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {premium.filter((p) => cat === "SEMUA" || p.tag === cat).map((p) => (
            <div key={p.id} className="group flex flex-col rounded-2xl border bg-card p-6 transition hover:border-primary hover:shadow-gold">
              <div className="flex items-center justify-between text-xs">
                <span className="rounded-full bg-accent px-3 py-1 text-accent-foreground">{p.badge}</span>
                <span className="text-muted-foreground">{p.tag} • {p.duration}</span>
              </div>
              <h3 className="mt-6 text-2xl font-semibold">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-auto flex items-end justify-between pt-8">
                <span className="font-display text-3xl text-gold-gradient">{rupiah(p.price)}</span>
                <button onClick={() => add(p)} className="rounded-full bg-gold-gradient px-4 py-2 text-xs font-semibold text-primary-foreground">+ Keranjang</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Harga belum termasuk kode unik 1–9 rupiah.</p>
      </section>

      <section id="iphone" className="border-y bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-xs tracking-[0.3em] text-primary">02 — SOLUSI PERANGKAT</p>
          <h2 className="mt-3 text-4xl md:text-5xl">iPhone-mu. Kemungkinan baru.</h2>
          <p className="mt-3 max-w-xl text-muted-foreground">Layanan IMEI dan pemulihan akses iPhone. Hanya untuk pemilik sah.</p>
          <div className="mt-10 divide-y rounded-2xl border">
            {iphone.map((p, i) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 p-6">
                <span className="font-display text-3xl text-primary">0{i + 1}</span>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground">{p.description}</p>
                </div>
                <span className="text-sm">Mulai <b className="text-gold-gradient text-lg">{rupiah(p.price)}</b></span>
                <button onClick={() => add(p)} className="rounded-full border border-primary px-4 py-2 text-xs text-primary hover:bg-primary hover:text-primary-foreground">Pesan</button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="bayar" className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:grid-cols-2">
        <div>
          <p className="text-xs tracking-[0.3em] text-primary">03 — PEMBAYARAN</p>
          <h2 className="mt-3 text-4xl md:text-5xl">Transfer tepat, termasuk kode unik.</h2>
          <p className="mt-4 text-muted-foreground">Setiap checkout menambah kode unik 1–9 rupiah. Contoh: Rp35.000 menjadi Rp35.001–Rp35.009. Jangan dibulatkan.</p>
          <div className="mt-8 space-y-3">
            {PAYMENTS.map((p) => (
              <div key={p.id} className="flex justify-between rounded-xl border bg-card p-4">
                <span className="font-semibold text-primary">{p.label}</span>
                <span className="text-sm">{p.detail}</span>
              </div>
            ))}
            <p className="text-xs text-muted-foreground">Atas nama {ACCOUNT_NAME}</p>
          </div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-gold">
          <img src={qrisImg.url} alt="QRIS ANSCHY STORE" className="w-full rounded-xl" />
        </div>
      </section>

      <section id="owner" className="border-y bg-card/40">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-[320px_1fr]">
          <img src={ownerImg.url} alt={OWNER_NAME} className="aspect-[3/4] w-full rounded-2xl border-2 border-primary object-cover object-[50%_65%] shadow-gold" />
          <div>
            <p className="text-xs tracking-[0.3em] text-primary">OWNER</p>
            <h2 className="mt-3 text-4xl md:text-5xl">{OWNER_NAME}</h2>
            <p className="mt-4 max-w-lg text-muted-foreground">Pendiri {STORE_NAME}. Melayani setiap pesanan secara langsung — tanyakan apa pun lewat chat di website atau WhatsApp.</p>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="mt-8 inline-flex rounded-full bg-gold-gradient px-7 py-3 text-sm font-semibold text-primary-foreground">WhatsApp {WA_NUMBER}</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center text-4xl">Ada pertanyaan?</h2>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a]) => (
            <details key={q} className="rounded-xl border bg-card p-5">
              <summary className="cursor-pointer font-semibold">{q}</summary>
              <p className="mt-3 text-sm text-muted-foreground">{a}</p>
            </details>
          ))}
        </div>
      </section>
      <Footer />
      <ChatWidget />
    </div>
  );
}
