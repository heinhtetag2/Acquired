"use client";
import { useEffect, useRef } from "react";
import { markSeen } from "@/lib/seen";
import { logRead } from "@/lib/profile";
import { overFreeLimit } from "@/lib/plus";

/* An invisible line at the end of the story's text. A story counts as read when this line comes into view and you've
   been on the page a few seconds (so a quick scroll to the bottom, or a very short story, isn't an instant "read").
   A story behind the paywall can't be finished. */
const MIN_MS = 6000;

export default function ReadEnd({ slug }: { slug: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const start = Date.now();
    let done = false, timer = 0;
    const finish = () => {
      if (done || overFreeLimit(slug)) return;
      done = true; markSeen(slug, "read"); logRead(slug); io.disconnect();
    };
    const io = new IntersectionObserver(([e]) => {
      clearTimeout(timer);
      if (!e.isIntersecting) return;
      const wait = MIN_MS - (Date.now() - start);
      if (wait <= 0) finish(); else timer = window.setTimeout(finish, wait); // still at the end once the time is up
    });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(timer); };
  }, [slug]);
  return <div ref={ref} className="sb-read-end" style={{ height: 1 }} aria-hidden />;
}
