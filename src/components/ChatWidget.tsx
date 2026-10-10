import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { OWNER_NAME, WA_LINK } from "@/lib/store";
import ownerImg from "@/assets/owner.jpg.asset.json";

type Msg = { id: string; sender: string; body: string; created_at: string };
const KEY = "anschy_chat";

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [cid, setCid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [err, setErr] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCid(localStorage.getItem(KEY)), []);

  useEffect(() => {
    if (!cid || !open) return;
    let alive = true;
    const load = async () => {
      const { data } = await supabase.rpc("buyer_messages", { _cid: cid });
      if (alive && data) setMsgs(data as Msg[]);
    };
    load();
    const t = setInterval(load, 4000);
    return () => { alive = false; clearInterval(t); };
  }, [cid, open]);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [msgs]);

  const start = async () => {
    setErr("");
    const { data, error } = await supabase.rpc("start_conversation", { _name: name });
    if (error) return setErr(error.message);
    localStorage.setItem(KEY, data as string);
    setCid(data as string);
  };
  const send = async () => {
    if (!cid || !text.trim()) return;
    const body = text;
    setText("");
    const { error } = await supabase.rpc("buyer_send", { _cid: cid, _body: body });
    if (error) return setErr(error.message);
    const { data } = await supabase.rpc("buyer_messages", { _cid: cid });
    if (data) setMsgs(data as Msg[]);
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        aria-label="Chat dengan penjual"
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground shadow-gold transition hover:scale-105"
      >
        {open ? <X /> : <MessageCircle />}
      </button>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[480px] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border bg-card shadow-gold">
          <div className="flex items-center gap-3 border-b p-4">
            <img src={ownerImg.url} alt={OWNER_NAME} className="h-10 w-10 rounded-full border border-primary object-cover object-[50%_60%]" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{OWNER_NAME}</p>
              <p className="text-xs text-muted-foreground">Owner • biasanya membalas cepat</p>
            </div>
            <a href={WA_LINK} target="_blank" rel="noreferrer" className="text-xs text-primary underline">WA</a>
          </div>
          {!cid ? (
            <div className="flex flex-1 flex-col justify-center gap-3 p-5">
              <p className="text-sm text-muted-foreground">Halo! Tanyakan apa saja tentang produk kami. Masukkan namamu untuk mulai.</p>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama kamu" maxLength={60}
                className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
              <button onClick={start} disabled={!name.trim()} className="rounded-lg bg-gold-gradient py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">Mulai chat</button>
              {err && <p className="text-xs text-destructive">{err}</p>}
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {msgs.length === 0 && <p className="text-center text-xs text-muted-foreground">Kirim pesan pertamamu 👋</p>}
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === "buyer" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.sender === "buyer" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{m.body}</div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>
              <div className="flex gap-2 border-t p-3">
                <input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
                  placeholder="Tulis pesan..." maxLength={1000} className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
                <button onClick={send} aria-label="Kirim" className="rounded-lg bg-gold-gradient px-3 text-primary-foreground"><Send size={16} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
