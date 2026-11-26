"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { GOALS, loadAccount, loadGoal, loadInterests, loadName, saveAccount, saveGoal, saveInterests, saveName, setOnboarded } from "@/lib/profile";

/* First-run onboarding, in Discover's dark deck look (serif caps titles, display-caps labels, 56px pill buttons).
   Account:  Welcome → Create account / Log in (Apple, Google, Email) → Email form → Check your inbox (6-digit code)
   Setup:    How it works → Interests → Daily goal → You're all set (asks your name only if sign-up didn't)
   There are no real accounts yet: sign-in is a demo kept in this browser, and any 6-digit code works.
   `?step=interests` opens just the interests step (edit from the profile) and returns there. */

export type OnboardTopic = { slug: string; title: string; count: number; stories: string[]; art?: string };
type Stack = { slug: string; title: string; art?: string }[];
type Step = "welcome" | "auth" | "email" | "code" | "how" | "interests" | "goal" | "ready";
type Mode = "signup" | "login";

const MIN = 2;
const SHOW_STACK = false; // welcome: the fanned cover stack (off while the picture background is being tried)
const SETUP: Step[] = ["how", "interests", "goal", "ready"]; // the setup steps (Skip shows on all but the last)
const SHOW_PROGRESS = false; // the dashed step bar at the top: off, it's the pattern every app uses
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// a thin chevron (Medium's), lighter than the app's arrows
const BackIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M15 4.5 7.5 12l7.5 7.5" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" /></svg>);
const CloseIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...ic} /></svg>);
const SaveIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} /></svg>);
const XIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...ic} /></svg>);
const TapIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M9 11.5V5.8a1.6 1.6 0 0 1 3.2 0v5.2l4 .9c1 .2 1.7 1.2 1.5 2.2l-.8 4.4c-.2.9-1 1.5-1.9 1.5h-4.4c-.6 0-1.2-.3-1.6-.8L5.6 15.4a1.5 1.5 0 0 1 2.2-2L9 14.6" {...ic} /></svg>);
// a small envelope in flight (the email step's illustration, line-drawn like the other icons)
const SendIcon = () => (<svg viewBox="0 0 48 48" aria-hidden><g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="m17 17.5 21.5-7.6 4.6 13.1-21.5 7.6z" /><path d="m17 17.5 13.4 5.6 8.1-13.2" /><path d="M5 29.5l7-2.5M8 35l6-2.1" /></g></svg>);
// line illustrations at the top of each setup step (Medium-style), drawn on a 48 grid in the icons' stroke
const g48 = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;
// interests: a few books on a shelf, one leaning (what you'd like to read)
const ShelfArt = () => (<svg viewBox="0 0 48 48" aria-hidden><g {...g48}><path d="M6 39h36" /><rect x="10" y="15" width="6" height="24" rx="1" /><path d="M12 19h2M12 35h2" /><rect x="17.5" y="10" width="7.5" height="29" rx="1" /><path d="M19.8 14.5h3M19.8 18h3M19.8 34.5h3" /><g transform="rotate(18 32.5 39)"><rect x="26.5" y="13" width="6" height="26" rx="1" /><path d="M28.5 17h2" /></g></g></svg>);
const TargetArt = () => (<svg viewBox="0 0 48 48" aria-hidden><g {...g48}><circle cx="22" cy="26" r="15" /><circle cx="22" cy="26" r="9.5" /><circle cx="22" cy="26" r="4" /><path d="M22 26 37 11M33 9.5l4.5 1.5 1.5 4.5M37 11l4-1" /></g><path d="M8 9v3M6.5 10.5h3" {...g48} /></svg>);
const BookArt = () => (<svg viewBox="0 0 48 48" aria-hidden><g {...g48}><path d="M24 15c-4-3-10-3.5-15-2.5v24c5-1 11-.5 15 2.5 4-3 10-3.5 15-2.5v-24c-5-1-11-.5-15 2.5Z" /><path d="M24 15v24" /><path d="M13 19c2.6-.4 5.2 0 7 .9M13 24c2.6-.4 5.2 0 7 .9M28 19.9c1.8-.9 4.4-1.3 7-.9M28 24.9c1.8-.9 4.4-1.3 7-.9" /><path d="M24 4.5v4M18.5 6.5l1.6 2.6M29.5 6.5l-1.6 2.6" /></g></svg>);
const MailIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><rect x="3.5" y="5.5" width="17" height="13" rx="2" {...ic} /><path d="m4 7 8 6 8-6" {...ic} /></svg>);
const AppleIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.5 2-3.6-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.6 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.3 0 2.1-1.1 2.8-2.3.9-1.3 1.3-2.6 1.3-2.6-.1 0-2.5-1-2.5-3.6ZM14.2 5.6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.7 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.7-1.3Z" /></svg>);
const GoogleIcon = () => (<svg viewBox="0 0 24 24" aria-hidden>
  <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" />
  <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
  <path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z" />
  <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" /></svg>);

export default function Onboarding({ topics, stack }: { topics: OnboardTopic[]; stack: Stack }) {
  const router = useRouter();
  const [trail, setTrail] = useState<Step[]>(["welcome"]); // steps you've been through, so Back retraces them
  const step = trail[trail.length - 1];
  const go = (s: Step) => setTrail((t) => [...t, s]);
  const back = () => (editOnly ? router.back() : setTrail((t) => (t.length > 1 ? t.slice(0, -1) : t)));
  const [mode, setMode] = useState<Mode>("signup");
  const [editOnly, setEditOnly] = useState(false); // came from the profile to edit interests
  const [picked, setPicked] = useState<string[]>([]);
  const [goal, setGoal] = useState(3);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resent, setResent] = useState(false);
  const [hadName, setHadName] = useState(false); // sign-up already asked your name, so "ready" doesn't
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const n = loadName();
    setPicked(loadInterests()); setGoal(loadGoal()); setName(n); setEmail(loadAccount()?.email ?? "");
    if (new URLSearchParams(location.search).get("step") === "interests") { setEditOnly(true); setTrail(["interests"]); }
  }, []);
  useEffect(() => { if (step === "code") { setCode(""); setResent(false); setTimeout(() => codeRef.current?.focus(), 350); } }, [step]);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  // finishing deals a fresh deck from your interests
  const finish = () => {
    saveInterests(picked); saveGoal(goal); saveName(name); setOnboarded();
    try { Object.keys(sessionStorage).filter((k) => k.startsWith("scrollbook:deck")).forEach((k) => sessionStorage.removeItem(k)); } catch {}
    router.replace(editOnly ? "/me" : "/");
  };
  const skip = () => { setOnboarded(); router.replace("/"); };
  const startAuth = (m: Mode) => { setMode(m); go("auth"); };
  // Apple / Google: no real sign-in yet, so they go straight on (log in: into the app; sign up: to setup)
  const social = (method: "apple" | "google") => { saveAccount({ method }); if (mode === "login") skip(); else go("how"); };
  const sendCode = () => { saveAccount({ method: "email", email: email.trim() }); if (mode === "signup") { saveName(name); setHadName(!!name.trim()); } go("code"); };
  const validate = () => { if (mode === "login") skip(); else go("how"); };

  const titles = picked.map((s) => topics.find((t) => t.slug === s)?.title).filter(Boolean) as string[];
  // stories in your picks, counting one that sits in two of your topics once
  const deckSize = new Set(topics.filter((t) => picked.includes(t.slug)).flatMap((t) => t.stories)).size;
  const setupAt = SETUP.indexOf(step);
  const emailOk = isEmail(email) && (mode === "login" || name.trim().length > 0);

  // the pinned button (and the helper line under it) for each step
  const cta: { label: string; onClick: () => void; disabled?: boolean; hint?: string } | null =
    // email + code keep their button right under the fields (Medium's form layout), so nothing is pinned there
    step === "how" ? { label: "Continue", onClick: () => go("interests") }
    : step === "interests" ? { label: editOnly ? "Save interests" : "Continue", onClick: editOnly ? finish : () => go("goal"), disabled: picked.length < MIN,
        hint: picked.length < MIN ? `Pick ${MIN - picked.length} more to continue` : undefined }
    : step === "goal" ? { label: "Continue", onClick: () => go("ready") }
    : step === "ready" ? { label: "Start discovering", onClick: finish }
    : null;

  return (
    <main id="main" className={`ob ob--${step}`} data-theme="dark">
      {/* top row: back (or close, on the code sheet), the setup progress, and Skip. None on welcome or on
          create account / log in (like Medium's: that screen is a starting point, not a step to undo) */}
      {step !== "welcome" && step !== "auth" && (
        <div className="ob__top">
          {/* no back on "How it works": you've just signed up, there's nothing to go back to (the slot keeps the bar in place) */}
          {step === "how" && !editOnly ? <span />
            : <button type="button" className="ob__icon" onClick={back} aria-label={step === "code" ? "Close" : "Back"}>{step === "code" ? <CloseIcon /> : <BackIcon />}</button>}
          {SHOW_PROGRESS && setupAt >= 0 && !editOnly ? (
            <div className="ob__progress" role="progressbar" aria-valuemin={1} aria-valuemax={SETUP.length} aria-valuenow={setupAt + 1} aria-label={`Step ${setupAt + 1} of ${SETUP.length}`}>
              {SETUP.map((s, i) => <span key={s} className={i <= setupAt ? "is-on" : ""} />)}
            </div>
          ) : <span />}
          <span /> {/* no Skip on the setup steps: they're short, and Continue is right there */}
        </div>
      )}

      <div className="ob__body" key={step}>
        {step === "welcome" && (
          <section className="ob__step ob__step--welcome">
            {/* cover stack hidden while trying the full-bleed picture background (.ob--welcome in pages.css); flip SHOW_STACK to bring it back */}
            {SHOW_STACK && <div className="ob__stack" aria-hidden>
              {stack.map((c, i) => (
                <div key={c.slug} className={`ob__stack-card ob__stack-card--${i}`}>
                  {c.art ? <img src={c.art} alt="" /> : <span>{c.title}</span>}
                </div>
              ))}
            </div>}
            <h1 className="ob__title ob__title--center">One story at a time.</h1>
            <p className="ob__lead ob__lead--center">Short, true stories about the companies and people that shape the world.</p>
            <div className="ob__actions">
              <button type="button" className="ob__btn ob__btn--primary" onClick={() => startAuth("signup")}>Create account</button>
              <button type="button" className="ob__btn" onClick={() => startAuth("login")}>Log in</button>
              <button type="button" className="ob__later t-label-xs" onClick={skip}>I&rsquo;ll look around first</button>
            </div>
          </section>
        )}

        {step === "auth" && (
          <section className="ob__step ob__step--center">
            <h1 className="ob__title ob__title--sm">{mode === "signup" ? "Create account" : "Welcome back"}</h1>
            <p className="ob__lead ob__lead--center">{mode === "signup" ? "Save stories, keep your notes and pick up where you left off." : "Log in to get your shelf and notes back."}</p>
            <div className="ob__providers">
              <button type="button" className="ob__btn ob__btn--provider" onClick={() => social("apple")}><AppleIcon /><span>Continue with Apple</span></button>
              <button type="button" className="ob__btn ob__btn--provider" onClick={() => social("google")}><GoogleIcon /><span>Continue with Google</span></button>
              <button type="button" className="ob__btn ob__btn--provider" onClick={() => go("email")}><MailIcon /><span>Continue with email</span></button>
            </div>
            <div className="ob__switch">
              <span className="ob__rule" aria-hidden />
              <p className="ob__switch-q">{mode === "signup" ? "Already have an account?" : "New to Scrollbook?"}</p>
              <button type="button" className="ob__btn" onClick={() => setMode(mode === "signup" ? "login" : "signup")}>{mode === "signup" ? "Log in" : "Create account"}</button>
            </div>
            <p className="ob__fine">By continuing, you agree to Scrollbook&rsquo;s Terms of Service and acknowledge our Privacy Policy.</p>
          </section>
        )}

        {step === "email" && (
          <section className="ob__step ob__step--center">
            <span className="ob__art" aria-hidden><SendIcon /></span>
            <h1 className="ob__title ob__title--sm">{mode === "signup" ? "Sign up with email" : "Log in with email"}</h1>
            <form className="ob__form" onSubmit={(e) => { e.preventDefault(); if (emailOk) sendCode(); }}>
              {mode === "signup" && (
                <label className="ob__input">
                  <span className="ob__label">Your name</span>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" maxLength={40} autoFocus />
                </label>
              )}
              <label className="ob__input">
                <span className="ob__label">Your email</span>
                <input type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email address" autoComplete="email" autoFocus={mode === "login"} />
              </label>
              <button type="submit" className="ob__btn ob__btn--primary ob__form-go" disabled={!emailOk}>{mode === "signup" ? "Create account" : "Send code"}</button>
            </form>
            <p className="ob__fine ob__fine--end">We&rsquo;ll email you a 6-digit code, no password needed. By continuing, you agree to Scrollbook&rsquo;s Terms of Service and Privacy Policy.</p>
          </section>
        )}

        {step === "code" && (
          <section className="ob__step ob__step--center">
            <h1 className="ob__title ob__title--sm">Check your inbox</h1>
            <p className="ob__lead ob__lead--center">Enter the code we sent to<br /><b>{email.trim()}</b></p>
            {/* one real input under six boxes: typing, pasting and the phone's code autofill all just work */}
            <label className="ob__code">
              <span className="sr-only">6-digit code</span>
              <input ref={codeRef} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
                onKeyDown={(e) => { if (e.key === "Enter" && code.length === 6) validate(); }} />
              {Array.from({ length: 6 }, (_, i) => (
                <span key={i} className={`ob__code-box${i === Math.min(code.length, 5) ? " is-cur" : ""}${code[i] ? " is-full" : ""}`} aria-hidden>{code[i] ?? ""}</span>
              ))}
            </label>
            <button type="button" className="ob__btn ob__btn--primary ob__form-go" onClick={validate} disabled={code.length < 6}>Validate</button>
            <button type="button" className="ob__link t-label-xs" onClick={() => { setResent(true); setCode(""); codeRef.current?.focus(); }}>{resent ? "Code sent again" : "Resend code"}</button>
            <p className="ob__fine">Demo: any 6 digits work.</p>
          </section>
        )}

        {step === "how" && (
          <section className="ob__step ob__step--setup">
            <div className="ob__demo" aria-hidden>
              <div className="ob__demo-card ob__demo-card--back"><div className="ob__demo-art">{stack[0]?.art && <img src={stack[0].art} alt="" />}</div><div className="ob__demo-lines"><span /><span /><span /></div></div>
              <div className="ob__demo-card">
                <div className="ob__demo-art">{stack[1]?.art && <img src={stack[1].art} alt="" />}</div>
                <div className="ob__demo-lines"><span /><span /><span /></div>
              </div>
            </div>
            <h1 className="ob__title">Swipe, save, read.</h1>
            <p className="ob__lead">Every card is a short true story. Here&rsquo;s how the deck works.</p>
            <ul className="ob__how">
              <li><span className="ob__how-dot"><SaveIcon /></span><span>Swipe right to save it for later</span></li>
              <li><span className="ob__how-dot"><XIcon /></span><span>Swipe left to skip to the next card</span></li>
              <li><span className="ob__how-dot"><TapIcon /></span><span>Tap to read the five-minute story</span></li>
            </ul>
          </section>
        )}

        {step === "interests" && (
          <section className="ob__step ob__step--setup">
            <span className="ob__art" aria-hidden><ShelfArt /></span>
            <h1 className="ob__title">What would you like to read?</h1>
            <p className="ob__lead">Choose {MIN} topics or more.</p>
            {/* the search panel's category chips (same size, same grid), filled when picked */}
            <div className="search-grid ob__chips" role="group" aria-label="Topics">
              {topics.map((t) => (
                <button key={t.slug} type="button" className="search-chip" aria-pressed={picked.includes(t.slug)} onClick={() => toggle(t.slug)}>{t.title}</button>
              ))}
            </div>
          </section>
        )}

        {step === "goal" && (
          <section className="ob__step ob__step--setup">
            <span className="ob__art" aria-hidden><TargetArt /></span>
            <h1 className="ob__title">How much a day?</h1>
            <p className="ob__lead">A small, steady habit beats a binge. You can change this any time.</p>
            <div className="ob__goals" role="radiogroup" aria-label="Daily goal">
              {GOALS.map((g) => (
                <button key={g.n} type="button" role="radio" aria-checked={goal === g.n} className={`ob__goal${goal === g.n ? " is-on" : ""}`} onClick={() => setGoal(g.n)}>
                  <span className="ob__goal-n">{g.n}</span>
                  <span className="ob__goal-text"><b>{g.label}</b><span>{g.sub}</span></span>
                  <span className="ob__goal-radio" aria-hidden />
                </button>
              ))}
            </div>
          </section>
        )}

        {step === "ready" && (
          <section className="ob__step ob__step--setup">
            <span className="ob__art" aria-hidden><BookArt /></span>
            <h1 className="ob__title">{hadName && name.trim() ? <>You&rsquo;re all set, {name.trim().split(" ")[0]}.</> : <>What should we call you?</>}</h1>
            <p className="ob__lead">{hadName && name.trim() ? "Your first deck is shuffled and waiting." : "Just your first name is fine."}</p>
            {!(hadName && name.trim()) && (
              <label className="ob__input">
                <span className="ob__label">Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="First name" autoComplete="given-name" maxLength={30}
                  onKeyDown={(e) => { if (e.key === "Enter") finish(); }} />
              </label>
            )}
            <div className="ob__summary">
              <p className="t-label-xs">Your deck is ready</p>
              <p className="ob__summary-main">{deckSize} stories{titles.length ? <> across <b>{titles.slice(0, 3).join(", ")}</b>{titles.length > 3 && ` +${titles.length - 3} more`}</> : null}</p>
              <p className="ob__summary-sub">{GOALS.find((g) => g.n === goal)?.sub.replace(" · ", ", ")}</p>
            </div>
          </section>
        )}
      </div>

      {cta && (
        <div className="ob__cta">
          <button type="button" className="ob__btn ob__btn--primary" onClick={cta.onClick} disabled={cta.disabled}>{cta.label}</button>
          {cta.hint && <p className="ob__hint">{cta.hint}</p>}
        </div>
      )}
    </main>
  );
}
