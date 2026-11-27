"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { loadThreads, saveThreads, takeNoteToOpen, uid, type Note, type Thread } from "@/lib/notes";
import { ASK_OPEN } from "@/lib/ask";

/* Highlights and Notion-style comments on a story's text.
   Select a passage inside any [data-cid] paragraph → "Highlight" (just mark it), "Comment" (write a note) or "Ask"
   (opens the story's chat, AskStory, about that passage).
   The passage stays highlighted (CSS Custom Highlight API: no DOM changes, so React's rendering is untouched);
   tap it to open the thread, add comments (each with date + time), or resolve / remove it.
   Everything is kept in this browser (lib/notes.ts) and also shows on the Shelf's Notes view. */

type Anchor = { cid: string; start: number; end: number; quote: string; rect: DOMRect };
type Pop = { kind: "compose"; anchor: Anchor } | { kind: "thread"; id: string; rect: DOMRect };

const HL = "sb-comment"; // passages with comments: underline + a bubble in the margin
const MK = "sb-mark";    // plain highlights: a solid marker-pen fill
const fmt = (t: number) => new Date(t).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

/** character offset of (node, off) within el's text */
function offsetIn(el: Element, node: Node, off: number) {
  const r = document.createRange(); r.selectNodeContents(el); r.setEnd(node, off); return r.toString().length;
}
/** a Range covering [start, end) of el's text */
function rangeIn(el: Element, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const r = document.createRange(); let pos = 0, setStart = false;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.textContent?.length ?? 0;
    if (!setStart && start <= pos + len) { r.setStart(n, start - pos); setStart = true; }
    if (setStart && end <= pos + len) { r.setEnd(n, end - pos); return r; }
    pos += len;
  }
  return null;
}
/** The current text selection as a passage (one paragraph, snapped to whole words), or null. */
function readPick(): Anchor | null {
  const sel = document.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return null;
  const r = sel.getRangeAt(0);
  const el = cidEl(r.startContainer);
  if (!el || el !== cidEl(r.endContainer)) return null;
  let start = offsetIn(el, r.startContainer, r.startOffset), end = offsetIn(el, r.endContainer, r.endOffset);
  // snap to whole words, so a sloppy drag doesn't save "s: Doomsday … film, s"
  const text = el.textContent ?? "", word = /[\p{L}\p{N}'’]/u;
  while (start > 0 && word.test(text[start - 1]) && word.test(text[start])) start--;
  while (end < text.length && word.test(text[end]) && word.test(text[end - 1])) end++;
  while (start < end && /\s/.test(text[start])) start++;
  while (end > start && /\s/.test(text[end - 1])) end--;
  const quote = text.slice(start, end);
  return quote && end > start ? { cid: el.dataset.cid!, start, end, quote, rect: r.getBoundingClientRect() } : null;
}
const cidEl = (n: Node | null) => (n instanceof Element ? n : n?.parentElement)?.closest<HTMLElement>("[data-cid]") ?? null;
const threadRange = (t: Thread) => { const el = document.querySelector(`[data-cid="${t.cid}"]`); return el ? rangeIn(el, t.start, t.end) : null; };

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const MarkIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M14.5 5.5l4 4-8 8H6.5v-4z M12.5 7.5l4 4" {...ic} /><path d="M4.5 20.5h15" {...ic} /></svg>);
const CommentIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 5.5h14v10H10l-4 3.5v-3.5H5z" {...ic} /></svg>);
const AskIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M12 4c.45 3.4 2.6 5.55 6 6-3.4.45-5.55 2.6-6 6-.45-3.4-2.6-5.55-6-6 3.4-.45 5.55-2.6 6-6Z" {...ic} /></svg>);

export default function StoryComments({ slug }: { slug: string }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [pick, setPick] = useState<Anchor | null>(null); // current text selection → shows Highlight / Comment
  const [pop, setPop] = useState<Pop | null>(null);
  const [draft, setDraft] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const popEl = useRef<HTMLDivElement>(null);
  const focused = useRef<string | null>(null);
  const [badges, setBadges] = useState<{ id: string; x: number; y: number; n: number }[]>([]);

  useEffect(() => { setThreads(loadThreads(slug)); }, [slug]);
  const save = (t: Thread[]) => { setThreads(t); saveThreads(slug, t); };

  // paint highlights for every thread
  const paint = useCallback(() => {
    const css = (globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> } }).CSS;
    const H = (globalThis as unknown as { Highlight?: new (...r: Range[]) => unknown }).Highlight;
    if (!css?.highlights || !H) return;
    const marks: Range[] = [], comments: Range[] = [];
    const b: typeof badges = [];
    for (const t of threads) {
      const r = threadRange(t); if (!r) continue;
      if (!t.notes.length) { marks.push(r); continue; }
      comments.push(r);
      // a bubble in the right margin, level with the passage's first line
      const first = r.getClientRects()[0], para = cidEl(r.startContainer)?.getBoundingClientRect();
      if (first && para) b.push({ id: t.id, n: t.notes.length, x: Math.min(para.right + 27, document.documentElement.clientWidth - 2) + window.scrollX /* the bubble's right edge */, y: first.top + first.height / 2 + window.scrollY });
    }
    css.highlights.set(MK, new H(...marks));
    css.highlights.set(HL, new H(...comments));
    setBadges(b);
  }, [threads]);
  useEffect(() => { paint(); }, [paint]);
  // text reflows on resize / font load: keep the bubbles next to their passages
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const later = () => { clearTimeout(t); t = setTimeout(paint, 100); };
    window.addEventListener("resize", later); document.fonts?.ready.then(later);
    return () => { window.removeEventListener("resize", later); clearTimeout(t); };
  }, [paint]);
  useEffect(() => () => { const h = (globalThis as unknown as { CSS?: { highlights?: Map<string, unknown> } }).CSS?.highlights; h?.delete(HL); h?.delete(MK); }, []);
  const openThread = (id: string) => {
    const t = threads.find((x) => x.id === id); const r = t && threadRange(t); if (!r) return;
    setDraft(""); setPop({ kind: "thread", id, rect: r.getBoundingClientRect() });
  };

  // opened from the Shelf's Notes or a "Remember this?" card: scroll to that passage and open its thread
  useEffect(() => {
    if (!threads.length) return;
    const id = takeNoteToOpen(); if (!id) return;
    const t = threads.find((x) => x.id === id); const r = t && threadRange(t); if (!t || !r) return;
    const b = r.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + b.top - window.innerHeight * 0.3, behavior: "instant" as ScrollBehavior });
    // after the jump has settled, open the thread under the passage
    const timer = setTimeout(() => { setDraft(""); setPop({ kind: "thread", id: t.id, rect: r.getBoundingClientRect() }); }, 120);
    return () => clearTimeout(timer);
  }, [threads]);

  // watch the selection: offer Highlight / Comment / Ask for a passage inside one paragraph
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const onSel = () => {
      clearTimeout(t);
      t = setTimeout(() => setPick(readPick()), 120);
    };
    document.addEventListener("selectionchange", onSel);
    return () => { document.removeEventListener("selectionchange", onSel); clearTimeout(t); };
  }, []);

  // tap on highlighted text → open its thread
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const tgt = e.target as Node;
      // taps inside our own UI — or on a chip button, which is already gone by the time the tap reaches here
      if (!tgt.isConnected || box.current?.contains(tgt) || (tgt as Element).closest?.(".sb-cbadge")) return;
      const sel = document.getSelection(); if (sel && !sel.isCollapsed) return;
      const el = cidEl(tgt); if (!el) { setPop(null); return; }
      const d = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null; caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null };
      const cr = d.caretRangeFromPoint?.(e.clientX, e.clientY);
      const cp = cr ? { node: cr.startContainer, off: cr.startOffset } : (() => { const p = d.caretPositionFromPoint?.(e.clientX, e.clientY); return p ? { node: p.offsetNode, off: p.offset } : null; })();
      if (!cp) return;
      const at = offsetIn(el, cp.node, cp.off);
      const hit = threads.find((t) => t.cid === el.dataset.cid && at >= t.start && at <= t.end);
      if (!hit) { setPop(null); return; }
      const r = rangeIn(el, hit.start, hit.end);
      setDraft(""); setPop({ kind: "thread", id: hit.id, rect: (r ?? el).getBoundingClientRect() });
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPop(null); };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, [threads]);
  // popovers are anchored to text; close them when the page scrolls away
  useEffect(() => {
    if (!pop) return;
    const y0 = window.scrollY;
    const onScroll = () => { if (Math.abs(window.scrollY - y0) > 80) setPop(null); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pop]);

  const startCompose = () => { if (!pick) return; setDraft(""); setPop({ kind: "compose", anchor: pick }); setPick(null); document.getSelection()?.removeAllRanges(); };
  // plain highlight: mark the passage, no note
  const highlight = () => {
    if (!pick) return;
    save([...threads, { id: uid(), cid: pick.cid, start: pick.start, end: pick.end, quote: pick.quote, notes: [], at: Date.now() }]);
    setPick(null); document.getSelection()?.removeAllRanges();
  };
  const post = () => {
    const body = draft.trim(); if (!body || !pop) return;
    const note: Note = { id: uid(), body, at: Date.now() };
    if (pop.kind === "compose") {
      const t: Thread = { id: uid(), cid: pop.anchor.cid, start: pop.anchor.start, end: pop.anchor.end, quote: pop.anchor.quote, notes: [note], at: note.at };
      save([...threads, t]); setPop({ kind: "thread", id: t.id, rect: pop.anchor.rect });
    } else {
      save(threads.map((t) => (t.id === pop.id ? { ...t, notes: [...t.notes, note] } : t)));
    }
    setDraft("");
  };
  // ask about the passage: the story's chat opens with it attached (AskStory)
  const askAbout = () => {
    const now = readPick() ?? pick; // the selection as it is at the tap (the toolbar's copy can lag a moment behind)
    if (!now) return;
    window.dispatchEvent(new CustomEvent(ASK_OPEN, { detail: { quote: now.quote } }));
    setPick(null); document.getSelection()?.removeAllRanges();
  };
  const resolve = (id: string) => { save(threads.filter((t) => t.id !== id)); setPop(null); };

  // after it renders, use the popover's real height: below the text if it fits, else above, else pinned inside the screen
  useLayoutEffect(() => {
    const el = popEl.current; if (!el || !pop) return;
    const rect = pop.kind === "compose" ? pop.anchor.rect : pop.rect;
    const h = el.offsetHeight, vh = window.innerHeight, m = 12;
    let top = rect.bottom + 10;
    if (top + h > vh - m) top = rect.top - 10 - h >= m ? rect.top - 10 - h : Math.max(m, vh - m - h);
    el.style.top = `${top}px`;
    // focus the box once it's in place, without scrolling the page (a scroll would close the popover)
    const key = pop.kind === "compose" ? "compose" : pop.id;
    if (focused.current !== key) { focused.current = key; el.querySelector<HTMLTextAreaElement>("textarea")?.focus({ preventScroll: true }); }
  });
  useEffect(() => { if (!pop) focused.current = null; }, [pop]);

  const left = (rect: DOMRect, w: number) => Math.max(12, Math.min(window.innerWidth - w - 12, rect.left + rect.width / 2 - w / 2));
  const thread = pop?.kind === "thread" ? threads.find((t) => t.id === pop.id) : undefined;
  const popW = Math.min(340, typeof window !== "undefined" ? window.innerWidth - 24 : 340);
  const plain = !!thread && !thread.notes.length; // a highlight with no comments yet

  return (
    <div ref={box}>
      {/* highlighted passages: a soft accent wash + underline (CSS Custom Highlight API); kept here because the
          build's CSS parser doesn't recognise ::highlight() yet */}
      <style>{`::highlight(${MK}){background-color:color-mix(in srgb,var(--theme-a400) 50%,transparent);color:var(--theme-light)}::highlight(${HL}){background-color:color-mix(in srgb,var(--theme-a400) 10%,transparent);text-decoration:underline;text-decoration-style:dashed;text-decoration-color:var(--theme-a400);text-decoration-thickness:2px;text-underline-offset:5px}`}</style>
      {typeof document !== "undefined" && createPortal(badges.map((b) => (
        <button key={b.id} type="button" className="sb-cbadge" style={{ left: b.x, top: b.y }} aria-label={`${b.n} ${b.n === 1 ? "comment" : "comments"}`}
          onClick={(e) => { e.stopPropagation(); openThread(b.id); }}>
          <CommentIcon />{b.n > 1 && <span>{b.n}</span>}
        </button>
      )), document.body)}
      {pick && !pop && (
        <div className="sb-cbar" role="toolbar" aria-label="Selected text" style={{ position: "fixed", left: left(pick.rect, 300), top: pick.rect.bottom + 10 }}
          onMouseDown={(e) => e.preventDefault() /* keep the selection */}>
          <button type="button" className="sb-cbtn" onClick={highlight}><MarkIcon />Highlight</button>
          <span className="sb-cbar__sep" aria-hidden />
          <button type="button" className="sb-cbtn" onClick={startCompose}><CommentIcon />Comment</button>
          <span className="sb-cbar__sep" aria-hidden />
          <button type="button" className="sb-cbtn" onClick={askAbout}><AskIcon />Ask</button>
        </div>
      )}

      {pop && (
        <div ref={popEl} className="sb-cpop" role="dialog" aria-label="Comments" style={{ left: left(pop.kind === "compose" ? pop.anchor.rect : pop.rect, popW), width: popW, position: "fixed" }}>
          <blockquote className="sb-cpop__quote">{pop.kind === "compose" ? pop.anchor.quote : thread?.quote}</blockquote>
          {plain && <p className="sb-cpop__hint t-label-xs">Highlighted {fmt(thread.at ?? Date.now())}</p>}
          {thread && !plain && (
            <ol className="sb-cpop__list">
              {thread.notes.map((n) => (
                <li key={n.id}>
                  <div className="sb-cpop__meta t-label-xs"><span className="sb-cpop__avatar" aria-hidden>Y</span>You<span>·</span><time dateTime={new Date(n.at).toISOString()}>{fmt(n.at)}</time></div>
                  <p className="sb-cpop__body">{n.body}</p>
                </li>
              ))}
            </ol>
          )}
          <div className="sb-cpop__compose">
            <textarea className="sb-cpop__input" rows={2} value={draft} placeholder={thread && !plain ? "Reply…" : "Add a comment…"}
              onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) post(); }} />
            <div className="sb-cpop__actions">
              {thread
                ? <button type="button" className="sb-cpop__ghost" onClick={() => resolve(thread.id)}>{plain ? "Remove" : "Resolve"}</button>
                : <button type="button" className="sb-cpop__ghost" onClick={() => setPop(null)}>Cancel</button>}
              <button type="button" className="sb-cpop__post" disabled={!draft.trim()} onClick={post}>{thread && !plain ? "Reply" : "Comment"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
