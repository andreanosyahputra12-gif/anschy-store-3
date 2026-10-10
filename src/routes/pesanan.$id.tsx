import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header, Footer } from "@/components/Header";
import { ChatWidget } from "@/components/ChatWidget";
import { ACCOUNT_NAME, PAYMENTS, WA_LINK, rupiah } from "@/lib/store";
import qrisImg from "@/assets/qris.jpg.asset.json";

export const Route = createFileRoute("/pesanan/$id")({
  head: () => ({
    meta: [
      { title: "Status Pesanan — ANSCHY STORE" },
      { name: "description", content: "Instruksi pembayaran dan status pesanan." },
      { property: "og:title", content: "Status Pesanan — ANSCHY STORE" },
      { property: "og:description", content: "Instruksi pembayaran dan status pesanan." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderPage,
});

const STATUS: Record<string, string> = { menunggu: "Menunggu pembayaran", dibayar: "Pembayaran diterima — diproses", selesai: "Selesai", batal: "Dibatalkan" };

function OrderPage() {
  const { id } = Route.useParams();
  const { data: o, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_order", { _id: id });
      if (error) throw error;
      return data as unknown as { id: string; customer_name: string; items: { name: string; qty: number; price: number }[]; total: number; payment_method: string; status: string } | null;
    },
    refetchInterval: 5000,
  });
  const pay = PAYMENTS.find((p) => p.id === o?.payment_method);
  const waMsg = o ? encodeURIComponent(`Halo, saya sudah transfer ${rupiah(o.total)} untuk pesanan #${o.id.slice(0, 8)} a.n ${o.customer_name}`) : "";

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-3xl px-5 py-16">
        {isLoading ? <p>Memuat...</p> : !o?.id ? <p>Pesanan tidak ditemukan.</p> : (
          <>
            <p className="text-xs tracking-[0.3em] text-primary">PESANAN #{o.id.slice(0, 8).toUpperCase()}</p>
            <h1 className="mt-2 text-4xl">{STATUS[o.status] ?? o.status}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Status diperbarui otomatis setelah pembayaran diverifikasi.</p>
            <div className="mt-8 rounded-2xl border bg-card p-6">
              {o.items.map((i) => <div key={i.name} className="flex justify-between py-1 text-sm"><span>{i.name} × {i.qty}</span><span>{rupiah(i.price * i.qty)}</span></div>)}
              <div className="mt-4 flex justify-between border-t pt-4"><span>Total transfer (persis)</span><span className="font-display text-3xl text-gold-gradient">{rupiah(o.total)}</span></div>
            </div>
            {o.status === "menunggu" && (
              <div className="mt-8 rounded-2xl border bg-card p-6 text-center">
                <p className="font-semibold text-primary">{pay?.label} — {pay?.detail}</p>
                <p className="text-xs text-muted-foreground">a.n {ACCOUNT_NAME}</p>
                {o.payment_method === "QRIS" && <img src={qrisImg.url} alt="QRIS" className="mx-auto mt-4 w-full max-w-sm rounded-xl" />}
                <a href={`${WA_LINK}?text=${waMsg}`} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-full bg-gold-gradient px-6 py-3 text-sm font-semibold text-primary-foreground">Konfirmasi via WhatsApp</a>
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
