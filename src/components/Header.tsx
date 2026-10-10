import { Link } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { STORE_NAME, useCart, useHydrated } from "@/lib/store";

export function Header() {
  const { count } = useCart();
  const h = useHydrated();
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-display text-2xl font-semibold tracking-[0.2em] text-gold-gradient">{STORE_NAME}</Link>
        <nav className="hidden gap-7 text-sm text-muted-foreground md:flex">
          <a href="/#produk" className="hover:text-primary">Produk</a>
          <a href="/#iphone" className="hover:text-primary">Layanan iPhone</a>
          <a href="/#bayar" className="hover:text-primary">Pembayaran</a>
          <a href="/#owner" className="hover:text-primary">Owner</a>
        </nav>
        <Link to="/keranjang" className="relative flex items-center gap-2 rounded-full border px-4 py-2 text-sm hover:border-primary">
          <ShoppingBag size={16} /> Keranjang
          {h && count > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{count}</span>}
        </Link>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t py-10 text-center text-xs text-muted-foreground">
      © {new Date().getFullYear()} {STORE_NAME} — Toko independen. Semua merek milik pemiliknya masing-masing.
      <div className="mt-2"><Link to="/admin" className="hover:text-primary">Admin</Link></div>
    </footer>
  );
}
