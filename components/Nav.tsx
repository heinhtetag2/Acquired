"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/lib/site";
import { MenuIcon, XIcon } from "./Icons";
import { SB_EMAIL } from "./Footer";
import EmailForm from "./EmailForm";
import SearchModal from "./SearchModal";
import ReadProgress from "./scrollbook/ReadProgress";

type Theme = "" | "light-fill" | "dark" | "hidden" | "light-fill-mobile" | "episode" | "playlist";
type Surface = "menu";
type Phase = "closed" | "open" | "closing";

// Close durations (desktop menu 250ms; mobile sheets 300ms).
const CLOSE_MS: Record<Surface, number> = { menu: 250 };
const MOBILE_CLOSE_MS = 300;


function useSurface(name: Surface) {
  const [phase, setPhase] = useState<Phase>("closed");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const open = useCallback(() => { clearTimeout(timer.current); setPhase("open"); }, []);
  const close = useCallback(() => {
    setPhase((p) => {
      if (p !== "open") return p;
      const ms = window.matchMedia("(max-width: 991px)").matches ? MOBILE_CLOSE_MS : CLOSE_MS[name];
      timer.current = setTimeout(() => setPhase("closed"), ms);
      return "closing";
    });
  }, [name]);
  return { phase, isOpen: phase === "open", open, close, cls: phase === "open" ? "is-open" : phase === "closing" ? "is-closing" : "" };
}

export default function Nav() {
  const menu = useSurface("menu");
  const [theme, setTheme] = useState<Theme>("");
  const [forced, setForced] = useState<Theme>("");
  // phones: once the page scrolls, the bar gets a solid background so text doesn't run under the logo
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on(); window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { const on = (e: Event) => setForced((e as CustomEvent<Theme>).detail); window.addEventListener("acq:navtheme", on); return () => window.removeEventListener("acq:navtheme", on); }, []);
  const navRef = useRef<HTMLElement>(null);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // close everything on route change
  useEffect(() => { menu.close(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [pathname]);

  // Escape, outside click, scroll-lock for the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (menu.isOpen) { menu.close(); menuBtn.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = menu.isOpen ? "hidden" : "";
    return () => window.removeEventListener("keydown", onKey);
  }, [menu]);

  // Nav theme follows the last [data-theme] section under the nav band (live IntersectionObserver).
  useEffect(() => {
    const nav = navRef.current; if (!nav) return;
    let themed: HTMLElement[] = [];
    const collect = () => { themed = Array.from(document.querySelectorAll<HTMLElement>("[data-theme]")).filter((el) => !nav.contains(el)); };
    collect();
    const active = new Set<Element>();
    let io: IntersectionObserver | null = null;
    const make = () => {
      io?.disconnect(); active.clear();
      if (!themed.length) { setTheme(""); return; }
      const r = nav.getBoundingClientRect();
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => (e.isIntersecting ? active.add(e.target) : active.delete(e.target)));
        let winner: HTMLElement | null = null;
        for (const el of themed) if (active.has(el)) winner = el;
        setTheme(((winner?.dataset.theme as Theme) ?? ""));
      }, { rootMargin: `${-Math.round(r.top)}px 0px ${-(window.innerHeight - Math.round(r.bottom))}px 0px`, threshold: 0 });
      themed.forEach((el) => io!.observe(el));
    };
    const rebuild = () => { collect(); make(); };
    const raf = requestAnimationFrame(make);
    let t: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(t); t = setTimeout(make, 200); };
    window.addEventListener("resize", onResize);
    // the page itself can be swapped without the path changing (e.g. "/" → "/?c=sports" re-mounts the deck):
    // when body's direct children change, re-collect the themed sections so the bar keeps the right colours
    let m: ReturnType<typeof setTimeout>;
    const mo = new MutationObserver(() => { clearTimeout(m); m = setTimeout(rebuild, 50); });
    mo.observe(document.body, { childList: true });
    return () => { cancelAnimationFrame(raf); io?.disconnect(); mo.disconnect(); clearTimeout(m); window.removeEventListener("resize", onResize); };
  }, [pathname]);

  const anyOpen = menu.isOpen;
  const t = forced || theme;
  const themeClass = anyOpen ? "" : t === "light-fill" ? "nav--light-fill" : t === "dark" ? "nav--dark" : t === "hidden" ? "nav--hidden" : t === "episode" ? "nav--episode" : t === "playlist" ? "nav--playlist" : "";

  const toggleMenu = () => { if (menu.isOpen) menu.close(); else menu.open(); };

  return (
    <>
      <header ref={navRef} className={`nav ${themeClass}${scrolled ? " is-scrolled" : ""}`}>
        {pathname.startsWith("/scrollbook/") && <ReadProgress key={pathname} />}
        <nav className="nav__row" aria-label="Primary">
          <Link href="/" className="nav__logo" aria-label="Scrollbook home">
            {/* the SCROLLBOOK wordmark, fitted to the logo box */}
            <svg className="nav__wordmark" viewBox="0 0 1376 135" aria-hidden>
              <text x="0" y="122" textLength={1376} lengthAdjust="spacing">SCROLLBOOK</text>
            </svg>
          </Link>
          <SearchModal />
          <div className="nav__actions">
            <button ref={menuBtn} className={`btn btn--nav nav__menu-btn ${menu.isOpen ? "is-open" : ""}`} aria-expanded={menu.isOpen} aria-controls="menu-popup" onClick={toggleMenu}>
              <span className="nav-wide">menu</span>
              {menu.isOpen ? <XIcon className="nav-narrow" /> : <MenuIcon className="nav-narrow" />}
              <span className="sr-only">Menu</span>
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
                <EmailForm id="menu-email" eyebrow={SB_EMAIL.eyebrow} copy={SB_EMAIL.copy} cta="join our list" />
              </div>
            </div>
          </div>
        </div>
      </div>


    </>
  );
}
