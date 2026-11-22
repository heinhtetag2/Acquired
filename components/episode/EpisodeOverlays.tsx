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
  const sections = ep.sources ?? [];

  return (
    <>
      <Sheet id="transcript" label="Transcript" open={open === "transcript"} onClose={close} onToc={() => setDrawer("chapters")} tocLabel="Chapters"
        toc={chapters.map(([t, title]) => ({ id: `ch-${slug(title)}`, label: title, meta: formatStamp(t), onClick: () => seek(t) }))}>
        <div className="sheet-eyebrow">Transcript · {[seasonLabel(ep.seasonCode), ep.episode ? `Episode ${ep.episode}` : ""].filter(Boolean).join(" | ")}</div>
        <h2 className="sheet-title">{ep.title}</h2>
        {chapters.map(([t, title]) => (
          <section key={t}>
            <h3 id={`ch-${slug(title)}`} className="sheet-section"><button onClick={() => seek(t)}>{title}</button></h3>
            <p>Transcript placeholder for “{title}” — the clone doesn’t reproduce the episode transcript. <a href={`#t=${t}`}>Jump to {formatStamp(t)}</a>.</p>
          </section>
        ))}
      </Sheet>

      <Sheet id="sources" label="Sources" open={open === "sources"} onClose={close} onToc={() => setDrawer("sections")} tocLabel="Sections"
        toc={sections.map(([name, n]) => ({ id: `src-${slug(name)}`, label: name, meta: String(n) }))}>
        <div className="sheet-eyebrow">Sources · {ep.title}</div>
        <h2 className="sheet-title">{ep.title}</h2>
        {sections.map(([name, n]) => (
          <section key={name}>
            <h3 id={`src-${slug(name)}`} className="sheet-section">{name}</h3>
            <ul>{Array.from({ length: n }, (_, i) => <li key={i}>Source {i + 1} placeholder — add real sources in content/episodes.json.</li>)}</ul>
          </section>
        ))}
      </Sheet>

      <Drawer label="Chapters" open={drawer === "chapters"} onClose={() => setDrawer("")}
        items={chapters.map(([t, title]) => ({ label: title, meta: formatStamp(t), href: `#ch-${slug(title)}`, onClick: () => seek(t) }))} />
      <Drawer label="Sections" open={drawer === "sections"} onClose={() => setDrawer("")}
        items={sections.map(([name, n]) => ({ label: name, meta: String(n), href: `#src-${slug(name)}` }))} />

      {ep.companion && (
        <div className={`modal ${open === "companion" ? "is-open" : ""}`} onClick={(e) => e.target === e.currentTarget && close()} inert={open !== "companion"}>
          <button className="btn btn--cream modal__close" onClick={close}>close</button>
          <div className="modal__panel" role="dialog" aria-modal="true" aria-labelledby="companion-h">
            <div className="modal__gallery">
              {(ep.companion.pages ?? ep.artifacts ?? []).map((s, i) => <div key={s} className={`modal__page ${i < 2 ? "is-full" : ""}`}><img src={s} alt={`Companion page ${i + 1}`} loading="lazy" /></div>)}
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
