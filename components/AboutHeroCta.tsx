"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { cssNum } from "@/lib/motion";
import { ArrowDown } from "./Icons";

/** "Learn more" smooth-scrolls to the story (same 1.6s power2.inOut proxy scroll as home) and reveals the floating vinyl past the hero. */
export default function AboutHeroCta() {
  useEffect(() => {
    const vinyl = document.querySelector<HTMLElement>(".about-vinyl");
    const onScroll = () => vinyl?.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const go = () => {
    const t = document.getElementById("about-story"); if (!t) return;
    t.focus({ preventScroll: true });
    const to = t.getBoundingClientRect().top + window.scrollY - 96;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return window.scrollTo(0, to);
    const proxy = { y: window.scrollY };
    gsap.to(proxy, { y: to, duration: cssNum("--gsap-scroll-cta-dur", 1.6), ease: "power2.inOut", onUpdate: () => window.scrollTo(0, proxy.y) });
  };
  return <button className="btn btn--cream hero__cta-inline" onClick={go}>learn more <ArrowDown /></button>;
}
