/* In-app page history (document.referrer doesn't change on client navigations), shared by the bottom bar's Back
   and the story page's top back button. Entries are path + query (so "/?c=luxury" returns to the Luxury deck).
   Moving to the page before the current one counts as going back; anything else is a new step. */
// One list per page session, kept on globalThis: the bottom bar (layout bundle) and story pages (page bundle)
// can each get their own copy of this module, and they must share the same history.
const g = globalThis as unknown as { __sbTrail?: string[] };
const trail: string[] = (g.__sbTrail ??= []);

export function track(path: string) {
  if (trail[trail.length - 1] === path) return;
  if (trail[trail.length - 2] === path) trail.pop(); else trail.push(path);
}

/** Where "back" leads from the page at `current` (or undefined when there's no in-app history).
    Works both before and after `current` itself has been tracked. */
export function previousOf(current: string): string | undefined {
  const last = trail[trail.length - 1];
  if (last && last !== current) return last;
  return trail.length > 1 ? trail[trail.length - 2] : undefined;
}
