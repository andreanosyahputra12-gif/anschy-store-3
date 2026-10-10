import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Login Admin — ANSCHY STORE" },
      { name: "description", content: "Masuk ke panel admin ANSCHY STORE." },
      { property: "og:title", content: "Login Admin — ANSCHY STORE" },
      { property: "og:description", content: "Masuk ke panel admin ANSCHY STORE." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async () => {
    setMsg("");
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pw });
      if (error) return setMsg(error.message);
      nav({ to: "/admin" });
    } else {
      const { error, data } = await supabase.auth.signUp({ email, password: pw, options: { emailRedirectTo: window.location.origin + "/admin" } });
      if (error) return setMsg(error.message);
      if (data.session) nav({ to: "/admin" });
      else setMsg("Cek email kamu untuk konfirmasi, lalu login.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-hero px-5">
      <div className="w-full max-w-sm space-y-4 rounded-2xl border bg-card p-8 shadow-gold">
        <h1 className="text-center text-3xl text-gold-gradient">Admin</h1>
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
        <input value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" type="password" className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:border-primary" />
        {msg && <p className="text-sm text-primary">{msg}</p>}
        <button onClick={submit} className="w-full rounded-full bg-gold-gradient py-3 font-semibold text-primary-foreground">{mode === "in" ? "Masuk" : "Daftar"}</button>
        <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="w-full text-xs text-muted-foreground">
          {mode === "in" ? "Belum punya akun? Daftar (akun pertama otomatis jadi admin)" : "Sudah punya akun? Masuk"}
        </button>
      </div>
    </div>
  );
}
