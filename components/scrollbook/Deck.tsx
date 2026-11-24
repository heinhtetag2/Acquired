"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { navigateWithTransition, onStoryPage, storyImageReady } from "@/lib/viewTransition";
import { forget, loadSeen, markSeen } from "@/lib/seen";
import { allThreads, createdAt, openNoteLater, type SlugThread } from "@/lib/notes";

/* Home deck: one story at a time, in a random order — stories you haven't met yet come first (lib/seen.ts).
   Swipe left / ✕ = skip, swipe right / bookmark = save for later, tap the card / Read = open it, ↺ = undo.
   Every card carries one "did you know" line, so even a skip teaches something. Saved slugs live in this browser. */

export type DeckCard = {
  slug: string; title: string; topic: string; min: number; art?: string;
  hook?: string; fact?: boolean; // fact = the hook is a curated "did you know"; otherwise it's the story's teaser line
  isNew?: boolean;               // freshly added story: dealt first and tagged "New"
  colors: { dark: string; light: string; a400: string; a500: string };
};

const SAVED_KEY = "scrollbook:saved";
const SESSION_KEY = "scrollbook:deck"; // this tab's shuffle + position
const SWIPE = 90;    // px past which a drag counts as a swipe
const FLY_MS = 280;

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const XIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...ic} /></svg>);
const SaveIcon = ({ filled }: { filled?: boolean }) => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} fill={filled ? "currentColor" : "none"} /></svg>);
const UndoIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M9 7.5H14a5 5 0 0 1 0 10H8" {...ic} /><path d="M11.5 4.5 8.5 7.5l3 3" {...ic} /></svg>);
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);

const vars = (c: DeckCard) => ({ "--card-dark": c.colors.dark, "--card-light": c.colors.light, "--card-a400": c.colors.a400, "--card-a500": c.colors.a500 } as React.CSSProperties);
const shuffleList = (a: number[]) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
/** New-to-you stories first (shuffled), then the ones already skipped/saved/read (shuffled). */
const dealOrder = (cards: DeckCard[]) => {
  const seen = loadSeen();
  const idx = [...cards.keys()];
  const fresh = (i: number) => !seen[cards[i].slug];
  return [
    ...shuffleList(idx.filter((i) => fresh(i) && cards[i].isNew)), // new stories you haven't met lead the deck
    ...shuffleList(idx.filter((i) => fresh(i) && !cards[i].isNew)),
    ...shuffleList(idx.filter((i) => !fresh(i))),
  ];
};
const loadSaved = (): string[] => { try { return JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"); } catch { return []; } };
const storeSaved = (s: string[]) => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(s)); } catch {} };

type Step = { at: number; action: "skip" | "save" };

/* "Remember this?": one of your own highlights comes back as a card, a few cards into the deck, so what you
   read sticks. Highlights qualify once they're a day old (RECALL_DEMO: right away, for the demo), and the same
   one won't come back for 3 days. */
const RECALL_KEY = "scrollbook:recall"; // { [threadId]: last shown }
const RECALL_AT = 2;                     // shown after this many cards
const RECALL_DEMO = true;
const pickRecall = (slugs: Set<string>): SlugThread | null => {
  let shown: Record<string, number> = {};
  try { shown = JSON.parse(localStorage.getItem(RECALL_KEY) || "{}"); } catch {}
  const now = Date.now(), DAY = 86_400_000;
  const ok = allThreads().filter((t) => slugs.has(t.slug) && (RECALL_DEMO || now - createdAt(t) > DAY) && now - (shown[t.id] ?? 0) > 3 * DAY);
  if (!ok.length) return null;
  // the one you haven't seen for longest (never-shown first), ties broken at random
  ok.sort((a, b) => (shown[a.id] ?? 0) - (shown[b.id] ?? 0) || Math.random() - 0.5);
  return ok[0];
};
const markRecalled = (id: string) => {
  try { const m = JSON.parse(localStorage.getItem(RECALL_KEY) || "{}"); m[id] = Date.now(); localStorage.setItem(RECALL_KEY, JSON.stringify(m)); } catch {}
};

export default function Deck({ cards, topic }: { cards: DeckCard[]; topic?: { slug: string; title: string } }) {
  const sessionKey = SESSION_KEY + (topic ? `:${topic.slug}` : ""); // each topic deck keeps its own place
  const router = useRouter();
  const [order, setOrder] = useState<number[] | null>(null); // null until mounted (random order is client-only)
  const [pos, setPos] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [history, setHistory] = useState<Step[]>([]);
  const [drag, setDrag] = useState(0);
  const [fly, setFly] = useState<"left" | "right" | null>(null);
  const [toast, setToast] = useState("");
  const [pressed, setPressed] = useState(false); // instant touch feedback before anything loads
  const start = useRef<{ x: number; y: number; t: number } | null>(null);
  const moved = useRef(false);
  const [recall, setRecall] = useState<SlugThread | null>(null); // this session's "Remember this?" card
  const [recallDone, setRecallDone] = useState(false);

  // keep your place for this browser session, so coming back from a story lands on the same card
  useEffect(() => {
    setSaved(loadSaved());
    try {
      const st = JSON.parse(sessionStorage.getItem(sessionKey) || "null");
      if (st && Array.isArray(st.order) && st.order.length === cards.length) {
        setOrder(st.order); setPos(st.pos ?? 0); setHistory(st.history ?? []);
        setRecallDone(!!st.recallDone); if (!st.recallDone) setRecall(allThreads().find((t) => t.id === st.recall) ?? null);
        return;
      }
    } catch {}
    setOrder(dealOrder(cards));
    setRecall(pickRecall(new Set(cards.map((c) => c.slug))));
  }, [cards, sessionKey]);
  useEffect(() => {
    if (!order) return;
    try { sessionStorage.setItem(sessionKey, JSON.stringify({ order, pos, history, recall: recall?.id, recallDone })); } catch {}
  }, [order, pos, history, recall, recallDone, sessionKey]);

  const current = order && pos < order.length ? cards[order[pos]] : undefined;
  // the recall card sits on top of the deck once you've gone through RECALL_AT cards
  const recallCard = recall && !recallDone && current && pos >= Math.min(RECALL_AT, order!.length - 1) ? cards.find((c) => c.slug === recall.slug) : undefined;
  const showRecall = !!recallCard;
  const next = showRecall ? current : order && pos + 1 < order.length ? cards[order[pos + 1]] : undefined;
  const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const say = (t: string) => { setToast(t); window.setTimeout(() => setToast((x) => (x === t ? "" : x)), 1600); };

  const act = useCallback((action: "skip" | "save") => {
    if (!current || fly) return;
    if (showRecall) { // either way just puts the memory back; it stays in your notes
      markRecalled(recall!.id); if (action === "save") say("It's in your notes on the Shelf");
      setFly(action === "save" ? "right" : "left");
      window.setTimeout(() => { setRecallDone(true); setFly(null); setDrag(0); }, reduced ? 0 : FLY_MS);
      return;
    }
    markSeen(current.slug, action);
    if (action === "save" && !saved.includes(current.slug)) { const s = [...saved, current.slug]; setSaved(s); storeSaved(s); say("Saved for later"); }
    setFly(action === "save" ? "right" : "left");
    window.setTimeout(() => {
      setHistory((h) => [...h, { at: pos, action }]);
      setPos((p) => p + 1); setFly(null); setDrag(0);
    }, reduced ? 0 : FLY_MS);
  }, [current, fly, saved, pos, reduced, showRecall, recall]);

  const undo = useCallback(() => {
    const last = history[history.length - 1]; if (!last || !order) return;
    const slug = cards[order[last.at]].slug;
    forget(slug, last.action);
    if (last.action === "save") { const s = saved.filter((x) => x !== slug); setSaved(s); storeSaved(s); }
    setHistory((h) => h.slice(0, -1)); setPos(last.at); setDrag(0);
  }, [history, order, cards, saved]);

  // Open the story with a shared-element transition: the card's cover and title morph into the story page's
  // cover and title (lib/viewTransition.ts; plain navigation where unsupported or with reduced motion).
  const read = useCallback(() => {
    if (!current) return;
    if (showRecall) { // open the story right at that passage, thread open
      markRecalled(recall!.id); setRecallDone(true); openNoteLater(recall!.id);
      router.push(`/scrollbook/${recall!.slug}#note-${recall!.id}`);
      return;
    }
    const href = `/scrollbook/${current.slug}`;
    markSeen(current.slug, "read");
    navigateWithTransition(() => router.push(href), onStoryPage, storyImageReady);
  }, [current, router, showRecall, recall]);

  // warm the next story so the transition starts straight away
  useEffect(() => { if (current) router.prefetch(`/scrollbook/${current.slug}`); }, [current, router]);
  const reshuffle = () => { setOrder(dealOrder(cards)); setPos(0); setHistory([]); setRecall(pickRecall(new Set(cards.map((c) => c.slug)))); setRecallDone(false); };

  // keyboard: ← skip, → save, Enter read, Backspace undo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof HTMLElement ? e.target : null;
      if (el?.closest("input, textarea, [contenteditable]")) return;
      if (e.key === "ArrowLeft") act("skip");
      else if (e.key === "ArrowRight") act("save");
      else if (e.key === "Enter" && el?.tagName !== "BUTTON" && el?.tagName !== "A") read();
      else if (e.key === "Backspace") undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [act, read, undo]);

  // pointer drag on the top card
  const onDown = (e: React.PointerEvent) => { if (fly) return; setPressed(true); start.current = { x: e.clientX, y: e.clientY, t: Date.now() }; moved.current = false; try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {} };
  const onMove = (e: React.PointerEvent) => { if (!start.current) return; const dx = e.clientX - start.current.x; if (Math.abs(dx) > 6) { moved.current = true; setPressed(false); } setDrag(dx); };
  const onUp = (e: React.PointerEvent) => {
    if (!start.current) return;
    setPressed(false);
    const dx = e.clientX - start.current.x, dt = Date.now() - start.current.t; start.current = null;
    const flick = Math.abs(dx) > 40 && dt < 250;
    if (dx > SWIPE || (flick && dx > 0)) act("save");
    else if (dx < -SWIPE || (flick && dx < 0)) act("skip");
    else { setDrag(0); if (!moved.current) read(); }
  };

  const top = recallCard ?? current; // the card on top: the memory, or the next story
  const colors = top?.colors ?? cards[0]?.colors;
  const style = colors && ({ "--deck-dark": colors.dark, "--deck-light": colors.light, "--deck-a400": colors.a400, "--deck-a500": colors.a500 } as React.CSSProperties);
  const dx = fly === "right" ? 700 : fly === "left" ? -700 : drag;
  const lean = Math.max(-1, Math.min(1, drag / SWIPE));

  return (
    <main id="main" className="deck" style={style} data-theme="dark">
      <div className="deck__top">
        {topic ? (
          <Link href="/" className="t-label-xs deck__topic-chip" aria-label={`Shuffling ${topic.title}. Back to all stories`}>Shuffle · {topic.title}<XIcon /></Link>
        ) : (
          <span className="t-label-xs deck__eyebrow">Discover · one story at a time</span>
        )}
        <Link href="/episodes" className="t-label-xs deck__saved" aria-live="polite" aria-label={`${saved.length} saved. Open your shelf`}><SaveIcon filled={saved.length > 0} />{saved.length} saved<span className="deck__saved-go" aria-hidden>›</span></Link>
      </div>

      <div className="deck__stage">
        {!order && <div className="deck__card deck__card--ghost" aria-hidden />}

        {next && (
          <div className="deck__card deck__card--next" aria-hidden style={{ ...vars(next), transform: `scale(${0.94 + Math.min(1, Math.abs(dx) / 300) * 0.06})` }}>
            <Face card={next} />
          </div>
        )}

        {current && top && (
          <div key={showRecall ? `recall-${recall!.id}` : current.slug + pos} className={`deck__card deck__card--top${showRecall ? " deck__card--recall" : ""}${fly ? " is-flying" : ""}${drag ? " is-dragging" : ""}${pressed && !drag ? " is-pressed" : ""}`}
            style={{ ...vars(top), transform: `translateX(${dx}px) rotate(${reduced ? 0 : dx / 22}deg)${pressed && !drag ? " scale(.975)" : ""}` }}
            onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={() => { start.current = null; setDrag(0); setPressed(false); }}
            role="group" aria-roledescription="card" aria-label={showRecall ? `Remember this? From ${top.title}: ${recall!.quote}` : `${current.title}. ${current.hook}`}>
            {showRecall ? <RecallFace card={top} thread={recall!} /> : <Face card={current} shared />}
            {/* drag feedback: a soft glow on the side you're heading to, and a round icon badge over the cover */}
            <span className="deck__glow deck__glow--save" style={{ opacity: Math.max(0, lean) * 0.9 }} aria-hidden />
            <span className="deck__glow deck__glow--skip" style={{ opacity: Math.max(0, -lean) * 0.9 }} aria-hidden />
            <span className="deck__cue deck__cue--save" style={{ opacity: Math.max(0, lean), transform: `translate(-50%, -50%) scale(${0.6 + Math.max(0, lean) * 0.4})` }} aria-hidden>
              <span className="deck__cue-dot"><SaveIcon filled /></span><span className="deck__cue-label">Save</span>
            </span>
            <span className="deck__cue deck__cue--skip" style={{ opacity: Math.max(0, -lean), transform: `translate(-50%, -50%) scale(${0.6 + Math.max(0, -lean) * 0.4})` }} aria-hidden>
              <span className="deck__cue-dot"><XIcon /></span><span className="deck__cue-label">Skip</span>
            </span>
          </div>
        )}

        {order && !current && (
          <div className="deck__card deck__end">
            <p className="t-label-xs">That&rsquo;s everything for today</p>
            <h2 className="deck__end-title">You went through {topic ? `all ${cards.length} in ${topic.title}` : `${cards.length} stories`}</h2>
            <p className="deck__end-text">{saved.length ? `${saved.length} saved for later. Come back tomorrow for a fresh shuffle, or go again now.` : "Nothing saved yet. Shuffle and take another look."}</p>
            <button type="button" className="deck__read" onClick={reshuffle}>Shuffle again</button>
          </div>
        )}
      </div>

      <div className="deck__actions" aria-label="Card actions">
        <button type="button" className="deck__btn deck__btn--sm" onClick={undo} disabled={!history.length} aria-label="Undo last card"><UndoIcon /></button>
        <button type="button" className={`deck__btn${lean < -0.35 || fly === "left" ? " is-hot" : ""}`} onClick={() => act("skip")} disabled={!current} aria-label="Skip"><XIcon /></button>
        {current
          ? <Link href={showRecall ? `/scrollbook/${recall!.slug}#note-${recall!.id}` : `/scrollbook/${current.slug}`} className="deck__read" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return; e.preventDefault(); read(); }}>{showRecall ? "Revisit" : "Read"}<ArrowIcon /></Link>
          : <button type="button" className="deck__read" disabled>Read<ArrowIcon /></button>}
        <button type="button" className={`deck__btn${lean > 0.35 || fly === "right" ? " is-hot" : ""}`} onClick={() => act("save")} disabled={!current} aria-label="Save for later"><SaveIcon /></button>
      </div>

      <p className="deck__keys t-label-xs" aria-hidden><kbd>&larr;</kbd> Skip <span>·</span> <kbd>&rarr;</kbd> Save <span>·</span> <kbd>Enter</kbd> Read <span>·</span> <kbd>&#9003;</kbd> Undo</p>

      <div className={`deck__toast${toast ? " is-on" : ""}`} role="status">{toast}</div>
    </main>
  );
}

function Face({ card, shared }: { card: DeckCard; shared?: boolean }) {
  return (
    <>
      <div className="deck__art" style={{ background: card.colors.a500, viewTransitionName: shared ? "sb-art" : undefined }}>
        {card.art ? <img src={card.art} alt="" draggable={false} /> : <span className="deck__art-title">{card.title}</span>}
      </div>
      <div className="deck__body" style={{ viewTransitionName: shared ? "sb-card-body" : undefined }}>
        <div className="deck__meta t-label-xs">{card.isNew && <span className="deck__new">New</span>}<span className="deck__topic">{card.topic}</span><span>{card.min} min read</span></div>
        <h2 className="deck__title">{card.title}</h2>
        {card.hook && <p className="deck__hook">{card.fact && <span className="deck__dyk">Did you know?</span>} {card.hook}</p>}
      </div>
    </>
  );
}

/** "Remember this?": one of your highlights, back in the deck */
function RecallFace({ card, thread }: { card: DeckCard; thread: SlugThread }) {
  const last = thread.notes[thread.notes.length - 1];
  const when = new Date(createdAt(thread)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return (
    <div className="deck__recall">
      <div className="deck__meta t-label-xs"><span className="deck__new">Remember this?</span><span>You highlighted it · {when}</span></div>
      <blockquote className="deck__recall-quote">&ldquo;{thread.quote}&rdquo;</blockquote>
      {last && <p className="deck__recall-note"><span className="t-label-xs">Your note</span>{last.body}</p>}
      <div className="deck__recall-src">
        <span className="deck__recall-art">{card.art && <img src={card.art} alt="" draggable={false} />}</span>
        <span><span className="t-label-xs">From</span><b>{card.title}</b></span>
      </div>
    </div>
  );
}
