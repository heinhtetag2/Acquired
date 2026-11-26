/* Page-to-page shared-element transitions (View Transitions API) for client navigations.
   Elements with the same view-transition-name on both pages (e.g. "sb-art", "sb-title") morph into each other.
   `go` starts the navigation; `ready` says when the new page has rendered what should morph.
   The browser pauses painting and requestAnimationFrame while it waits, so readiness is watched with a
   MutationObserver, with a 2s safety timeout. Without support, or with reduced motion, it just navigates. */
export function navigateWithTransition(go: () => void, ready: () => boolean, softReady?: () => boolean) {
  type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> };
  const doc = document as Document & { startViewTransition?: (cb: () => Promise<void>) => VT };
  if (!doc.startViewTransition || window.matchMedia("(prefers-reduced-motion: reduce)").matches) { go(); return; }
  const vt = doc.startViewTransition(() => new Promise<void>((resolve) => {
    let done = false;
    const finish = () => { if (done) return; done = true; mo.disconnect(); clearInterval(poll); clearTimeout(timer); document.removeEventListener("load", check, true); resolve(); };
    // `ready` must hold; `softReady` (e.g. "the cover image has loaded") is waited for at most 250ms
    const t0 = performance.now();
    const check = () => { if (ready() && (!softReady || softReady() || performance.now() - t0 > 250)) finish(); };
    const mo = new MutationObserver(check);
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
    // image loads aren't DOM mutations: listen for them (load doesn't bubble, so capture), with a short timer as backup
    document.addEventListener("load", check, true);
    const poll = setInterval(check, 40);
    const timer = setTimeout(finish, 2000);
    go();
  }));
  // the browser can skip the animation (e.g. the tab was hidden); the navigation still happens, so don't report it
  const ignore = () => {};
  vt.ready.catch(ignore); vt.finished.catch(ignore); vt.updateCallbackDone.catch(ignore);
}

/** An image is ready to be snapshotted (loaded, or there is none). */
const imgReady = (sel: string) => { const img = document.querySelector<HTMLImageElement>(sel); return !img || (img.complete && img.naturalWidth > 0); };

/** Opening a story page: its cover exists (hard), and its picture has loaded (soft). */
export const onStoryPage = () => !!document.querySelector(".ep-art");
export const storyImageReady = () => imgReady(".ep-art img");

/** Ready check for "leaving a story page": the story's cover is gone, and if we landed on the home deck, its top card is in. */
export const leftStoryPage = () =>
  !document.querySelector(".ep-art") && (location.pathname !== "/" || !!document.querySelector(".deck__card--top, .deck__end"));
export const deckImageReady = () => imgReady(".deck__card--top .deck__art img");
