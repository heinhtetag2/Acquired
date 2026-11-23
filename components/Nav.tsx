"use client";
import Acq2Wordmark from "./Acq2Wordmark";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { MenuIcon, XIcon, ArrowUpRight, iconFor } from "./Icons";
import EmailForm from "./EmailForm";
import SearchModal from "./SearchModal";

type Theme = "" | "light-fill" | "dark" | "hidden" | "light-fill-mobile" | "episode" | "playlist";
type Surface = "menu" | "listen" | "logo";
type Phase = "closed" | "open" | "closing";

// Close durations from the live CSS (--menu-section-close-ms, --listen-section-close-ms, --logo-popup-close-ms; mobile sheets 300ms).
const CLOSE_MS: Record<Surface, number> = { menu: 250, listen: 240, logo: 150 };
const MOBILE_CLOSE_MS = 300;

const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="67" viewBox="0 0 520 67"><text x="0" y="56" font-family="Founders Grotesk Condensed, sans-serif" font-size="72" letter-spacing="10">ACQUIRED</text></svg>`;

function useSurface(name: Surface) {
  const [phase, setPhase] = useState<Phase>("closed");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const open = useCallback(() => { clearTimeout(timer.current); setPhase("open"); }, []);
  const close = useCallback(() => {
    setPhase((p) => {
      if (p !== "open") return p;
      const ms = window.matchMedia("(max-width: 991px)").matches && name !== "logo" ? MOBILE_CLOSE_MS : CLOSE_MS[name];
      timer.current = setTimeout(() => setPhase("closed"), ms);
      return "closing";
    });
  }, [name]);
  return { phase, isOpen: phase === "open", open, close, cls: phase === "open" ? "is-open" : phase === "closing" ? "is-closing" : "" };
}

export default function Nav() {
  const menu = useSurface("menu");
  const listen = useSurface("listen");
  const logo = useSurface("logo");
  const [logoPos, setLogoPos] = useState({ x: 0, y: 0 });
  const [theme, setTheme] = useState<Theme>("");
  const [forced, setForced] = useState<Theme>("");
  useEffect(() => { const on = (e: Event) => setForced((e as CustomEvent<Theme>).detail); window.addEventListener("acq:navtheme", on); return () => window.removeEventListener("acq:navtheme", on); }, []);
  const navRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const listenBtn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const isAcq2 = pathname?.startsWith("/acq2");

  // close everything on route change
  useEffect(() => { menu.close(); listen.close(); logo.close(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname]);

  // ?listen=1 opens the listen popover (live LISTEN_PARAM)
  useEffect(() => { if (new URLSearchParams(window.location.search).get("listen") === "1") listen.open(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  // Escape, outside click, scroll-lock for the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu.isOpen) { menu.close(); menuBtn.current?.focus(); }
      if (listen.isOpen) { listen.close(); listenBtn.current?.focus(); }
      if (logo.isOpen) logo.close();
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = menu.isOpen ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [menu, listen, logo]);

  // logo popup closes on outside click or scroll
  useEffect(() => {
    if (!logo.isOpen) return;
    const onDown = (e: MouseEvent) => { if (!(e.target as Element).closest(".logo-popup")) logo.close(); };
    const onScroll = () => logo.close();
    document.addEventListener("click", onDown, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { document.removeEventListener("click", onDown, true); window.removeEventListener("scroll", onScroll); };
  }, [logo]);

  // Nav theme follows the last [data-theme] section under the nav band (live IntersectionObserver).
  useEffect(() => {
    const nav = navRef.current; if (!nav) return;
    const themed = Array.from(document.querySelectorAll<HTMLElement>("[data-theme]")).filter((el) => !nav.contains(el));
    if (!themed.length) { setTheme(""); return; }
    const active = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const make = () => {
      io?.disconnect(); active.clear();
      const r = nav.getBoundingClientRect();
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
        let winner: HTMLElement | null = null;
        for (const el of themed) if (active.has(el)) winner = el;
        setTheme(((winner?.dataset.theme as Theme) ?? ""));
      }, { rootMargin: `${-Math.round(r.top)}px 0px ${-(window.innerHeight - Math.round(r.bottom))}px 0px`, threshold: 0 });
      themed.forEach((el) => io!.observe(el));
    };
    const raf = requestAnimationFrame(make);
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(make, 200); };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); io?.disconnect(); window.removeEventListener("resize", onResize); };
  }, [pathname]);

  const anyOpen = menu.isOpen || listen.isOpen;
  const t = forced || theme;
  const themeClass = anyOpen ? "" : t === "light-fill" ? "nav--light-fill" : t === "dark" ? "nav--dark" : t === "hidden" ? "nav--hidden" : t === "episode" ? "nav--episode" : t === "playlist" ? "nav--playlist" : "";

  const toggleMenu = () => { listen.close(); menu.isOpen ? menu.close() : menu.open(); };
  const toggleListen = () => { menu.close(); listen.isOpen ? listen.close() : listen.open(); };

  const copyLogo = async (e: React.MouseEvent) => {
    e.preventDefault();
    try { await navigator.clipboard.writeText(LOGO_SVG); } catch {}
    logo.close();
  };

  const listenLinks = (variant: "base" | "icons") => (
    <div className={`listen-wrap listen-wrap--${variant}`}>
      <div className="t-label muted">{isAcq2 ? "Listen to ACQ2" : "Listen to Acquired"}</div>
      <div className="listen-links">
        {site.listen.map((l, i) => {
          const Icon = iconFor(l.icon);
          return (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className={`listen-link ${i === 0 ? "is-first" : ""}`} style={{ ["--i" as string]: i }} aria-label={variant === "icons" ? l.label : undefined}>
              {variant === "base" && <span>{l.label}</span>}<Icon />
            </a>
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <header ref={navRef} className={`nav ${themeClass}${isAcq2 ? " nav--acq2" : ""}`}>
        <nav className="nav__row" aria-label="Primary">
          <Link href="/" className="nav__logo" aria-label="Acquired home"
            onContextMenu={(e) => {
              if (!window.matchMedia("(pointer: fine)").matches) return;
              e.preventDefault();
              if (logo.isOpen) return logo.close();
              setLogoPos({ x: e.clientX, y: e.clientY }); logo.open();
            }}>
            {isAcq2 ? <Acq2Wordmark className="nav__wordmark nav__wordmark--acq2" /> : (
              <svg className="nav__wordmark" viewBox="0 0 1044 135" aria-hidden>
                <text x="0" y="122" textLength={1044} lengthAdjust="spacing">ACQUIRED</text>
              </svg>
            )}
          </Link>
          <SearchModal />
          <div className="nav__actions">
            <button ref={menuBtn} className={`btn btn--nav nav__menu-btn ${menu.isOpen ? "is-open" : ""}`} aria-expanded={menu.isOpen} aria-controls="menu-popup" onClick={toggleMenu}>
              <span className="nav-wide">menu</span>
              {menu.isOpen ? <XIcon className="nav-narrow" /> : <MenuIcon className="nav-narrow" />}
              <span className="sr-only">Menu</span>
            </button>
            <button ref={listenBtn} className={`btn btn--nav nav-wide ${listen.isOpen ? "is-open" : ""}`} aria-expanded={listen.isOpen} aria-controls="listen-popup" onClick={toggleListen}>
              listen
            </button>
          </div>
        </nav>
      </header>

      <div id="menu-popup" className={`menu-section ${menu.cls}`} onClick={(e) => e.target === e.currentTarget && menu.close()} aria-hidden={!menu.isOpen} inert={!menu.isOpen}>
        <div className="menu-panel" role="dialog" aria-label="Site menu">
          <div className="menu-inner">
            <div className="menu-links">
              {site.menu.map((l, i) => (
                <Link key={l.href} href={l.href} className={`menu-link ${i === 0 ? "is-first" : ""}`} style={{ ["--i" as string]: i }} aria-current={pathname === l.href ? "page" : undefined}>
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="menu-cta">
              <div className="nav-wide-block">
                <EmailForm id="menu-email" eyebrow="Emails from Ben & David" copy="Our key takeaways, research photos, hints at the next episode, and your vote on future topics." cta="join our list" />
                <div className="spacer-base" />
                <figure className="email-preview">
                  <div className="email-preview__img">
                    <img src="/images/email-preview.webp" alt="Seinfeld email preview" loading="lazy" />
                    <a className="btn btn--cream email-preview__btn" href="https://link.acquired.fm/seinfeld-email" target="_blank" rel="noreferrer">View Email <ArrowUpRight width={14} height={14} /></a>
                  </div>
                  <figcaption className="t-body-xs muted">The original pilot, aired in 1989 as <em>The Seinfeld Chronicles</em>.</figcaption>
                </figure>
              </div>
              <div className="nav-narrow-block">{listenLinks("icons")}</div>
            </div>
          </div>
        </div>
      </div>

      <div id="listen-popup" className={`listen-section ${listen.cls}`} onClick={(e) => e.target === e.currentTarget && listen.close()} aria-hidden={!listen.isOpen} inert={!listen.isOpen}>
        <div className="listen-panel" role="dialog" aria-label="Listen to Acquired">
          <div className="listen-inner">{listenLinks("base")}</div>
        </div>
      </div>

      <div className={`logo-popup ${logo.cls}`} style={{ left: logoPos.x, top: logoPos.y }} role="menu" aria-hidden={!logo.isOpen} inert={!logo.isOpen}>
        <div className="logo-popup__inner">
          <a href="#" className="logo-popup__link" style={{ ["--i" as string]: 0 }} onClick={copyLogo} role="menuitem"><span className="t-label">copy svg</span><ArrowUpRight width={14} height={14} /></a>
          <Link href="/media-kit" className="logo-popup__link" style={{ ["--i" as string]: 1 }} role="menuitem"><span className="t-label">media kit</span><ArrowUpRight width={14} height={14} /></Link>
          <div className="logo-popup__rule" aria-hidden><div /></div>
          <Link href="/press" className="logo-popup__link" style={{ ["--i" as string]: 2 }} role="menuitem"><span className="t-label">Press</span><ArrowUpRight width={14} height={14} /></Link>
        </div>
      </div>
    </>
  );
}
