"use client";
import { useEffect, useRef } from "react";

/* Reading progress on a story: a thin line along the top bar's bottom edge that fills as you read, from the start of
   the page to the end of the story's text (the ReadEnd marker), so it's full exactly when the story counts as read. */
export default function ReadProgress() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const end = document.querySelector(".sb-read-end");
      const vh = window.innerHeight;
      const total = (end ? end.getBoundingClientRect().top + window.scrollY : document.documentElement.scrollHeight) - vh;
      const p = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 1;
      ref.current?.style.setProperty("--p", String(p));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
  }, []);
  return <span ref={ref} className="nav__progress" aria-hidden />;
}
