"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatStamp, seasonLabel } from "@/lib/site";
import { type Episode } from "@/lib/content";
import EmailForm from "../EmailForm";
import { ArrowLeft } from "../Icons";

type Panel = "" | "transcript" | "sources" | "companion";
const HASHES: Panel[] = ["transcript", "sources", "companion"];
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const seek = (seconds: number) => window.dispatchEvent(new CustomEvent("acq:seek", { detail: seconds }));

/** Bottom sheets (transcript, sources), their mobile TOC drawers, and the PDF companion modal — all hash-driven like the live page. */
export default function EpisodeOverlays({ ep }: { ep: Episode }) {
  const [open, setOpen] = useState<Panel>("");
  const [drawer, setDrawer] = useState<"" | "chapters" | "sections">("");
  const lastFocus = useRef<HTMLElement | null>(null);
  // Companion pages are only fetched once the modal has been opened (they'd otherwise compete with the hero art).
  const [companionSeen, setCompanionSeen] = useState(false);
  useEffect(() => { if (open === "companion") setCompanionSeen(true); }, [open]);

  useEffect(() => {
    const sync = () => {
      const h = window.location.hash.slice(1) as Panel;
      const next = HASHES.includes(h) ? h : "";
      if (next) lastFocus.current = document.activeElement as HTMLElement;
      setOpen(next);
      document.documentElement.style.overflow = next ? "hidden" : "";
      window.dispatchEvent(new CustomEvent("acq:popup", { detail: !!next }));
      const t = /^#t=(\d+(?:\.\d+)?)$/.exec(window.location.hash);
      if (t) seek(parseFloat(t[1]));
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => { window.removeEventListener("hashchange", sync); document.documentElement.style.overflow = ""; };
  }, []);

  const close = useCallback(() => {
    setDrawer("");
    history.pushState(null, "", window.location.pathname + window.location.search);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    lastFocus.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") (drawer ? setDrawer("") : close()); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, drawer, close]);

  const chapters = ep.chapters ?? [];
  // real sources (from the story's Go deeper data) when it has them; otherwise the clone's placeholder sections
  const real = (ep as { deeper?: { sources?: { label: string; url: string }[] } }).deeper?.sources ?? [];
  const sections: [string, number][] = real.length ? [["Where this story comes from", real.length]] : ep.sources ?? [];
  const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

  return (
    <>
      <Sheet id="transcript" label="Transcript" open={open === "transcript"} onClose={close} onToc={() => setDrawer("chapters")} tocLabel="Chapters"
        toc={chapters.map(([t, title]) => ({ id: `ch-${slug(title)}`, label: title, meta: formatStamp(t), onClick: () => seek(t) }))}>
        <div className="sheet-eyebrow">Transcript{ep.seasonCode ? ` · ${seasonLabel(ep.seasonCode)}` : ""}</div>
        <h2 className="sheet-title">{ep.title}</h2>
        {chapters.map(([t, title]) => (
          <section key={t}>
            <h3 id={`ch-${slug(title)}`} className="sheet-section"><button onClick={() => seek(t)}>{title}</button></h3>
            <p>Transcript placeholder for “{title}” — the clone doesn’t reproduce the episode transcript. <a href={`#t=${t}`}>Jump to {formatStamp(t)}</a>.</p>
          </section>
        ))}
      </Sheet>

      {real.length > 0 && <SourcesSheet open={open === "sources"} onClose={close} sources={real} host={host} />}
      {!real.length && <Sheet id="sources" label="Sources" open={open === "sources"} onClose={close} onToc={() => setDrawer("sections")} tocLabel="Sections"
        toc={sections.map(([name, n]) => ({ id: `src-${slug(name)}`, label: name, meta: String(n) }))}>
        <div className="sheet-eyebrow">Sources · {ep.title}</div>
        <h2 className="sheet-title">{ep.title}</h2>
        {real.length ? (
          <section>
            <h3 id={`src-${slug(sections[0][0])}`} className="sheet-section">{sections[0][0]}</h3>
            <ol className="sheet-sources">
              {real.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.label}</a><span>{host(s.url)}</span></li>)}
            </ol>
          </section>
        ) : sections.map(([name, n]) => (
          <section key={name}>
            <h3 id={`src-${slug(name)}`} className="sheet-section">{name}</h3>
            <ul>{Array.from({ length: n }, (_, i) => <li key={i}>Source {i + 1} placeholder — add real sources in content/episodes.json.</li>)}</ul>
          </section>
        ))}
      </Sheet>}

      <Drawer label="Chapters" open={drawer === "chapters"} onClose={() => setDrawer("")}
        items={chapters.map(([t, title]) => ({ label: title, meta: formatStamp(t), href: `#ch-${slug(title)}`, onClick: () => seek(t) }))} />
      {!real.length && <Drawer label="Sections" open={drawer === "sections"} onClose={() => setDrawer("")}
        items={sections.map(([name, n]) => ({ label: name, meta: String(n), href: `#src-${slug(name)}` }))} />}

      {ep.companion && (
        <div className={`modal ${open === "companion" ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && close()} inert={open !== "companion"}>
          <button className="btn btn--cream modal__close" onClick={close}>close</button>
          <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="companion-h">
            <div className="modal__gallery">
              {companionSeen && (ep.companion.pages ?? ep.artifacts ?? []).map((s, i) => <div key={s} className={`modal__page ${i < 2 ? "is-full" : ""}`}><img src={s} alt={`Companion page ${i + 1}`} loading="lazy" /></div>)}
            </div>
            <div>
              <div id="companion-h" className="t-label-lg muted">{ep.companion.title}</div>
              <div className="spacer-3xs" />
              <p className="t-body-140">{ep.companion.copy}</p>
              <div className="spacer-base" />
              <EmailForm id="companion-email" cta="receive the companion" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// who published a source, and which group it belongs in (official → reference → news), from its web address
const PUBLISHERS: [RegExp, string, "Official" | "Reference" | "News & coverage"][] = [
  [/apple\.com/, "Apple", "Official"], [/youtube\.com/, "YouTube", "Official"], [/forbes\.com/, "Forbes", "News & coverage"], [/dexerto\.com/, "Dexerto", "News & coverage"], [/bleedingcool\.com/, "Bleeding Cool", "News & coverage"], [/redbull\.com/, "Red Bull", "News & coverage"], [/marvel\.com/, "Marvel", "Official"], [/crunchyroll\.com/, "Crunchyroll", "Official"],
  [/wikipedia\.org/, "Wikipedia", "Reference"], [/letterboxd\.com/, "Letterboxd", "Reference"],
  [/screendaily\.com/, "Screen Daily", "News & coverage"], [/bloody-disgusting\.com/, "Bloody Disgusting", "News & coverage"],
  [/khaosodenglish\.com/, "Khaosod English", "News & coverage"], [/screenanarchy\.com/, "ScreenAnarchy", "News & coverage"],
  [/goodmorningamerica\.com/, "Good Morning America", "News & coverage"], [/variety\.com/, "Variety", "News & coverage"],
  [/comicbook\.com/, "ComicBook.com", "News & coverage"], [/sportskeeda\.com/, "Sportskeeda", "News & coverage"], [/theverge\.com/, "The Verge", "News & coverage"],
];
const GROUPS = ["Official", "Reference", "News & coverage"] as const;
const whoIs = (url: string, host: (u: string) => string) => {
  const m = PUBLISHERS.find(([re]) => re.test(url));
  return m ? { name: m[1], group: m[2] } : { name: host(url), group: "News & coverage" as const };
};

/** Sources: a light bottom sheet that opens at about 60% of the screen. Drag the handle (or scroll the list) up for
    full height; drag down to go back to 60%, and down again to close. Tap outside, × or Escape also close. */
function SourcesSheet({ open, onClose, sources, host }: { open: boolean; onClose: () => void; sources: { label: string; url: string }[]; host: (u: string) => string }) {
  const [full, setFull] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!open) { setFull(false); setDrag(0); } else list.current?.scrollTo(0, 0); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const begin = (y: number) => { start.current = y; };
  const move = (y: number) => { if (start.current !== null) setDrag(y - start.current); };
  const end = () => {
    if (start.current === null) return;
    const d = drag; start.current = null; setDrag(0);
    if (d < -40) setFull(true);
    else if (d > 70) { if (full) setFull(false); else onClose(); }
  };
  // swiping up anywhere on the half-open sheet expands it; at the top of the list, swiping down shrinks it
  const touchY = useRef(0);
  const onTouchStart = (e: React.TouchEvent) => { touchY.current = e.touches[0].clientY; };
  const onTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchY.current;
    if (!full && dy < -24) setFull(true);
    else if (full && dy > 60 && (list.current?.scrollTop ?? 0) <= 0) setFull(false);
  };

  return (
    <div className={`ss${open ? " is-open" : ""}${full ? " is-full" : ""}`} aria-hidden={!open} inert={!open}>
      <div className="ss__bg" onClick={onClose} />
      <div className="ss__panel" role="dialog" aria-modal="true" aria-label="Sources" style={drag > 0 ? { transform: `translateY(${drag}px)`, transition: "none" } : undefined} /* follows the finger down; up expands on release */
        onTouchStart={onTouchStart} onTouchMove={onTouchMove}>
        <div className="ss__head" onPointerDown={(e) => { begin(e.clientY); (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); }}
          onPointerMove={(e) => move(e.clientY)} onPointerUp={end} onPointerCancel={end}>
          <span className="ss__grab" aria-hidden />
          <div className="ss__row">
            <div>
              <h2 className="ss__title">Sources</h2>
              <p className="ss__sub">Where the facts in this story come from.</p>
            </div>
            {/* no visible close: swipe down, tap outside or Escape. Kept for screen readers and keyboards. */}
            <button type="button" className="sr-only" onClick={onClose}>Close sources</button>
          </div>
        </div>
        {/* grouped like a reading list: just the titles, each one a link */}
        <div ref={list} className="ss__list" onScroll={(e) => { if (!full && (e.currentTarget.scrollTop > 4)) setFull(true); }}>
          {GROUPS.map((g) => {
            const items = sources.map((s) => ({ ...s, ...whoIs(s.url, host) })).filter((s) => s.group === g);
            if (!items.length) return null;
            return (
              <section key={g} className="ss__group">
                <h3 className="ss__group-head">{g}</h3>
                <ul>
                  {items.map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noreferrer" aria-label={`${s.label}, ${s.name} (opens in a new tab)`}>
                        <span className="ss__label">{s.label}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type TocItem = { id: string; label: string; meta: string; onClick?: () => void };

function Sheet({ id, label, open, onClose, onToc, tocLabel, toc, children }: {
  id: string; label: string; open: boolean; onClose: () => void; onToc: () => void; tocLabel: string; toc: TocItem[]; children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(toc[0]?.id);

  useEffect(() => {
    const el = panel.current; if (!el || !open) return;
    el.scrollTop = 0;
    const onScroll = () => {
      setProgress(el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight));
      let cur = toc[0]?.id;
      for (const t of toc) { const h = document.getElementById(t.id); if (h && h.getBoundingClientRect().top < 140) cur = t.id; }
      setActive(cur);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    el.focus({ preventScroll: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [open, toc]);

  const jump = (t: TocItem) => {
    t.onClick?.();
    document.getElementById(t.id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };

  return (
    <article className={`sheet ${open ? "is-open" : ""}`} aria-hidden={!open} inert={!open}>
      <div ref={panel} className="sheet__panel" role="dialog" aria-modal="true" aria-label={label} tabIndex={-1} id={`${id}-panel`}>
        <div className="sheet__nav">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="btn" onClick={onClose}><ArrowLeft width={16} height={16} />back</button>
            <button className="btn only-tablet" onClick={onToc}>{tocLabel}</button>
          </div>
          <div className="sheet__progress"><div style={{ width: `${progress * 100}%` }} /></div>
        </div>
        <div className="sheet__grid">
          <nav className="sheet__toc" aria-label={tocLabel}>
            <div className="sheet__toc-head t-label muted">{tocLabel}</div>
            {toc.map((t) => (
              <button key={t.id} className={`toc-item ${active === t.id ? "is-active" : ""}`} onClick={() => jump(t)}>
                <span>{t.label}</span><span>{t.meta}</span>
              </button>
            ))}
          </nav>
          <div className="rich">{children}</div>
          <div aria-hidden />
        </div>
      </div>
    </article>
  );
}

function Drawer({ label, open, onClose, items }: { label: string; open: boolean; onClose: () => void; items: { label: string; meta: string; href: string; onClick?: () => void }[] }) {
  return (
    <div className={`drawer-wrap ${open ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && onClose()} aria-hidden={!open} inert={!open}>
      <div className="drawer" role="dialog" aria-label={label}>
        <div className="t-label muted" style={{ textAlign: "center" }}>{label}</div>
        <div className="spacer-xs" />
        <div className="drawer__list">
          {items.map((it) => (
            <button key={it.href} className="toc-item" onClick={() => { it.onClick?.(); onClose(); document.querySelector(it.href)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
              <span>{it.label}</span><span>{it.meta}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
