"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import EmailForm from "./EmailForm";
import { CloseIcon } from "./Icons";

/*
  Live behaviour (home-cta-block script):
  - hidden ("region-hidden": opacity 0, translateY 8px) while it overlaps the hero or the footer
  - collapses once to a pill the first time it overlaps the Latest Episodes section (unless the user interacted)
  - box ↔ pill morph: close 0.55s / open 0.7s, ease cubic-bezier(.32,.72,0,1);
    desktop crossfades — close: form 0→.18, box .12+.6 (sine.inOut), pill .57+.22; open: pill 0+.12, box .05+.6 (power2.inOut), form .53+.25
  - always a docked tab on ≤991; Escape / backdrop click minimises; subscribing hides it for good (localStorage acq_subscribed)
*/
const OPEN = 0.7, CLOSE = 0.55;
const EASE = "cubic-bezier(.32,.72,0,1)";

export default function FloatingCta() {
  const box = useRef<HTMLElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const pill = useRef<HTMLButtonElement>(null);
  const [min, setMin] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [gone, setGone] = useState(false);
  const interacted = useRef(false);
  const collapsed = useRef(false);
  const mobile = () => window.matchMedia("(max-width: 991px)").matches;

  const animate = useCallback((toMin: boolean) => {
    const el = box.current, f = form.current, p = pill.current;
    if (!el || !f || !p) { setMin(toMin); return; }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setMin(toMin); return; }
    const from = el.getBoundingClientRect(), fromStyle = getComputedStyle(el);
    const fromProps = { width: from.width, height: from.height, borderRadius: fromStyle.borderRadius, paddingLeft: fromStyle.paddingLeft, paddingRight: fromStyle.paddingRight, paddingTop: fromStyle.paddingTop, paddingBottom: fromStyle.paddingBottom };
    el.classList.toggle("is-minimized", toMin);
    const to = el.getBoundingClientRect(), toStyle = getComputedStyle(el);
    const toProps = { width: to.width, height: to.height, borderRadius: toStyle.borderRadius, paddingLeft: toStyle.paddingLeft, paddingRight: toStyle.paddingRight, paddingTop: toStyle.paddingTop, paddingBottom: toStyle.paddingBottom };
    const desk = !mobile();
    const tl = gsap.timeline({ onComplete: () => { gsap.set(el, { clearProps: "width,height,borderRadius,padding" }); setMin(toMin); } });
    gsap.set(el, fromProps);
    if (toMin) {
      if (desk) { tl.to(f, { opacity: 0, duration: 0.18, ease: "sine.inOut" }, 0); tl.to(el, { ...toProps, duration: 0.6, ease: "sine.inOut" }, 0.12); tl.fromTo(p, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "sine.inOut" }, 0.57); }
      else { tl.to(el, { ...toProps, duration: CLOSE, ease: EASE }, 0); tl.set(f, { opacity: 0 }, 0); tl.set(p, { opacity: 1 }, CLOSE); }
    } else {
      if (desk) { tl.to(p, { opacity: 0, duration: 0.12, ease: "sine.inOut" }, 0); tl.to(el, { ...toProps, duration: 0.6, ease: "power2.inOut" }, 0.05); tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "sine.inOut" }, 0.53); }
      else { tl.set(p, { opacity: 0 }, 0); tl.to(el, { ...toProps, duration: OPEN, ease: EASE }, 0); tl.fromTo(f, { opacity: 0 }, { opacity: 1, duration: 0.25 }, OPEN * 0.6); }
    }
  }, []);

  const minimize = useCallback(() => { interacted.current = true; animate(true); }, [animate]);
  const expand = useCallback(() => { interacted.current = true; animate(false); }, [animate]);

  useEffect(() => {
    try { if (localStorage.getItem("acq_subscribed") === "true") { setGone(true); return; } } catch {}
    if (mobile()) { setMin(true); box.current?.classList.add("is-minimized"); }
    const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const update = () => {
      const el = box.current; if (!el) return;
      const r = el.getBoundingClientRect();
      // hero counts as an "avoid" region until it has faded (live PAST_HERO_PROGRESS 0.75)
      const heroVisible = !!document.querySelector(".hero") && window.scrollY < window.innerHeight * 0.75;
      const footer = document.querySelector("footer.footer");
      const hide = heroVisible || (!!footer && overlaps(r, footer.getBoundingClientRect()));
      setHidden(hide);
      if (!hide && !collapsed.current && !interacted.current && !mobile() && !el.classList.contains("is-minimized")) {
        const latest = document.querySelector("#latest");
        if (latest && overlaps(r, latest.getBoundingClientRect()) && !el.contains(document.activeElement)) { collapsed.current = true; animate(true); }
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true }); window.addEventListener("resize", update);
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && box.current && !box.current.classList.contains("is-minimized") && (mobile() || box.current.contains(document.activeElement))) { minimize(); pill.current?.focus(); } };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); window.removeEventListener("keydown", onKey); };
  }, [animate, minimize]);

  if (gone) return null;
  return (
    <>
      <div className={`fcta-backdrop ${!min && !hidden ? "is-on" : ""}`} onClick={minimize} aria-hidden />
      <aside ref={box} className={`fcta ${hidden ? "is-region-hidden" : ""} ${min ? "is-minimized" : ""}`} aria-label="Newsletter" inert={hidden}>
        <div ref={form} className="fcta__body" aria-hidden={min} style={{ opacity: min ? 0 : 1 }}>
          <div className="t-label-lg muted" style={{ height: 24, display: "flex", alignItems: "center" }}>Never miss an episode</div>
          <button className="fcta__min" onClick={minimize} aria-label="Minimize"><CloseIcon width={18} height={18} /></button>
          <div className="spacer-3xs" />
          <p className="t-body-sm">Get our takeaways, research photos, and help pick future topics.</p>
          <div className="spacer-xs" />
          <EmailForm id="fcta-email" cta="Subscribe" variant="row" onSuccess={() => { try { localStorage.setItem("acq_subscribed", "true"); } catch {} }} />
        </div>
        <button ref={pill} className="fcta__pill t-label" onClick={expand} aria-label="Open subscribe form" tabIndex={min ? 0 : -1} style={{ opacity: min ? 1 : 0 }}>emails from ben &amp; david</button>
      </aside>
    </>
  );
}
