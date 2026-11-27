"use client";
import { useEffect, useRef, useState } from "react";
import { ASK_OPEN, askStory, type AskTurn } from "@/lib/ask";

/* "Ask this story": a round button at the bottom right of a story (beside Back / Next on phones, and it slides away with
   them) that opens a chat about the whole story.
   - Phones: a sheet that is only as tall as what's in it (short when you open it, growing with the conversation).
     Drag its handle up for full screen; drag down to shrink back, or to close.
   - Computers: a side panel on the right; the story moves over and stays readable and usable beside it.
   Select a sentence in the story → Ask opens this chat with that passage attached ("About …"), with quick questions about it.
   Answers come only from this story and its sources, with links to the sources each answer used. */
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const SendIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M12 19V5M6 11l6-6 6 6" {...ic} /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" {...ic} /></svg>);
// a closed, rounded speech bubble with one spark centred inside it: "ask, and get an answer". Drawn on the 24px grid
// with the same 1.6 stroke as the bar's other icons, so it sits with Back and Next as one set
const AskIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden>
    <path d="M7 4.5h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3h-5.5L7.5 20v-3H7a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3Z" {...ic} strokeWidth={1.6} />
    <path d="M12 7.25c.3 1.95 1.3 2.95 3.25 3.25-1.95.3-2.95 1.3-3.25 3.25-.3-1.95-1.3-2.95-3.25-3.25 1.95-.3 2.95-1.3 3.25-3.25Z" fill="currentColor" />
  </svg>
);
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

type Turn = AskTurn;
const ABOUT_QUICK = ["Explain this simply", "Why does it matter?", "What happened next?"]; // for a selected passage
const UP = 60, DOWN = 90; // px of drag that count as "to full screen" / "shrink or close"

export default function AskStory({ slug, suggestions = [] }: { slug: string; suggestions?: string[] }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false); // phones: dragged up to full screen
  const [drag, setDrag] = useState(0);     // live drag offset while the handle is held
  const [q, setQ] = useState("");
  const [quote, setQuote] = useState("");  // a passage the next question is about (from a passage with no inline slot)
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const fab = useRef<HTMLButtonElement>(null);
  const startY = useRef<number | null>(null);

  // Escape closes; on a computer the input gets focus when the chat opens (on phones that would pop the keyboard up)
  useEffect(() => {
    if (!open) return;
    if (window.matchMedia("(pointer: fine)").matches) setTimeout(() => input.current?.focus(), 200);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  // keep the newest message in view
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [turns]);
  // a passage asked about from somewhere without a slot under it (the overview): open here, about that passage
  useEffect(() => {
    const on = (e: Event) => { setQuote((e as CustomEvent<{ quote: string }>).detail.quote); setOpen(true); };
    window.addEventListener(ASK_OPEN, on);
    return () => window.removeEventListener(ASK_OPEN, on);
  }, []);

  const close = () => { setOpen(false); setFull(false); setDrag(0); input.current?.blur(); fab.current?.focus({ preventScroll: true }); };

  const ask = async (question: string) => {
    const text = question.trim();
    if (text.length < 3 || busy) return;
    const about = quote;
    setBusy(true); setQ(""); setQuote("");
    setTurns((t) => [...t, { q: text, quote: about || undefined }]);
    const turn = await askStory(slug, text, about || undefined);
    setTurns((t) => [...t.slice(0, -1), turn]);
    setBusy(false);
  };

  // the handle: drag up for full screen, down to shrink back (from full) or close; the sheet follows your finger
  const onDown = (e: React.PointerEvent) => { startY.current = e.clientY; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {} };
  const onMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    setDrag(dy > 0 ? dy : full ? 0 : Math.max(dy, -80) * 0.5); // downward follows fully; upward gives a little, as a hint
  };
  const onUp = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current; startY.current = null; setDrag(0);
    if (dy < -UP) setFull(true);
    else if (dy > DOWN) { if (full) setFull(false); else close(); }
    else if (Math.abs(dy) < 6) setFull((f) => !f); // a tap on the handle toggles
  };

  const asked = new Set(turns.map((t) => t.q));
  const left = suggestions.filter((s) => !asked.has(s)).slice(0, 3);

  return (
    <>
      <button ref={fab} type="button" className="askfab" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label="Ask this story">
        <AskIcon /><span>Ask</span>
      </button>

      <div className={`askp${open ? " is-open" : ""}${full ? " is-full" : ""}${drag ? " is-dragging" : ""}`} aria-hidden={!open} inert={!open}>
        <div className="askp__bg" onClick={close} />
        <div className="askp__panel" role="dialog" aria-labelledby="askp-title" style={drag ? { transform: `translateY(${drag}px)` } : undefined}>
          <div className="askp__grab" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
            role="button" tabIndex={0} aria-label={full ? "Shrink" : "Full screen"} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setFull((f) => !f); } }}>
            <span />
          </div>
          <header className="askp__head">
            <div>
              <h2 id="askp-title" className="askp__title">Ask this story</h2>
              <p className="askp__sub">Answers come only from this story and its sources.</p>
            </div>
            <button type="button" className="askp__close" onClick={close} aria-label="Close"><CloseIcon /></button>
          </header>

          <div ref={list} className="askp__list" aria-live="polite">
            {turns.length === 0 && (
              <div className="askp__empty">
                <span className="askp__empty-icon" aria-hidden><AskIcon /></span>
                <p>Ask anything about this story. Or select a sentence in it and tap Ask.</p>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className="askp__turn">
                {t.quote && <p className="askp__quote">&ldquo;{t.quote}&rdquo;</p>}
                <p className="askp__q">{t.q}</p>
                {!t.reply && !t.error && <p className="askp__a is-loading"><span /><span /><span /><span className="sr-only">Finding the answer</span></p>}
                {t.error && <p className="askp__a is-error">{t.error}</p>}
                {t.reply && (
                  <div className={`askp__a${t.reply.found ? "" : " is-miss"}`}>
                    <p>{t.reply.answer}</p>
                    {t.reply.sources.length > 0 && (
                      <ul className="askp__sources">
                        {t.reply.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}<span>{host(s.url)}</span></a></li>)}
                      </ul>
                    )}
                    <p className="askp__by t-label-xs">{t.reply.mode === "ai" ? "Answered from this story" : "Found in this story"}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="askp__foot">
            {quote && <p className="askp__about"><span className="t-label-xs">About</span>&ldquo;{quote}&rdquo;<button type="button" onClick={() => setQuote("")} aria-label="Ask about the whole story instead"><CloseIcon /></button></p>}
            {quote && (
              <div className="askp__chips">{ABOUT_QUICK.map((s) => <button key={s} type="button" className="askp__chip" onClick={() => ask(s)} disabled={busy}>{s}</button>)}</div>
            )}
            {left.length > 0 && !quote && (
              <div className="askp__chips">{left.map((s) => <button key={s} type="button" className="askp__chip" onClick={() => ask(s)} disabled={busy}>{s}</button>)}</div>
            )}
            <form className="askp__form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
              <input ref={input} className="askp__input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={quote ? "What do you want to know about it?" : "Ask anything about this story"} maxLength={300} aria-label="Your question" enterKeyHint="send" />
              <button type="submit" className="askp__send" disabled={busy || q.trim().length < 3} aria-label="Send"><SendIcon /></button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
