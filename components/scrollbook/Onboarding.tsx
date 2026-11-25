"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { GOALS, loadGoal, loadInterests, loadName, saveGoal, saveInterests, saveName, setOnboarded } from "@/lib/profile";

/* First-run onboarding, in Discover's dark deck look:
   1 Welcome (a fanned stack of real covers) → 2 How the deck works (an animated swipe) →
   3 Pick at least 2 interests → 4 A daily goal → 5 Your name, then into a deck dealt from your interests.
   `?step=interests` opens just the interests step (edit from the profile) and returns there. */

export type OnboardTopic = { slug: string; title: string; count: number; stories: string[]; art?: string };
type Stack = { slug: string; title: string; art?: string }[];

const MIN = 2;
const ic = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const BackIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M19 12H5M11 6l-6 6 6 6" {...ic} /></svg>);
const ArrowIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6.5l5.5 5.5-5.5 5.5" {...ic} /></svg>);
const CheckIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M5.5 12.5l4 4 9-9.5" {...ic} /></svg>);
const SaveIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 4.5h11v15l-5.5-4-5.5 4z" {...ic} /></svg>);
const XIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M6.5 6.5l11 11M17.5 6.5l-11 11" {...ic} /></svg>);
const TapIcon = () => (<svg viewBox="0 0 24 24" aria-hidden><path d="M9 11.5V5.8a1.6 1.6 0 0 1 3.2 0v5.2l4 .9c1 .2 1.7 1.2 1.5 2.2l-.8 4.4c-.2.9-1 1.5-1.9 1.5h-4.4c-.6 0-1.2-.3-1.6-.8L5.6 15.4a1.5 1.5 0 0 1 2.2-2L9 14.6" {...ic} /></svg>);

export default function Onboarding({ topics, stack }: { topics: OnboardTopic[]; stack: Stack }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [editOnly, setEditOnly] = useState(false); // came from the profile to edit interests
  const [picked, setPicked] = useState<string[]>([]);
  const [goal, setGoal] = useState(3);
  const [name, setName] = useState("");

  useEffect(() => {
    setPicked(loadInterests()); setGoal(loadGoal()); setName(loadName());
    if (new URLSearchParams(location.search).get("step") === "interests") { setEditOnly(true); setStep(2); }
  }, []);

  const STEPS = 5;
  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : [...p, slug]));
  // finishing deals a fresh deck from your interests
  const finish = () => {
    saveInterests(picked); saveGoal(goal); saveName(name); setOnboarded();
    try { Object.keys(sessionStorage).filter((k) => k.startsWith("scrollbook:deck")).forEach((k) => sessionStorage.removeItem(k)); } catch {}
    router.replace(editOnly ? "/me" : "/");
  };
  const skip = () => { setOnboarded(); router.replace("/"); };
  const next = () => (editOnly ? finish() : step < STEPS - 1 ? setStep(step + 1) : finish());
  const back = () => (editOnly ? router.back() : setStep(Math.max(0, step - 1)));

  const titles = picked.map((s) => topics.find((t) => t.slug === s)?.title).filter(Boolean) as string[];
  // stories in your picks, counting one that sits in two of your topics once
  const deckSize = new Set(topics.filter((t) => picked.includes(t.slug)).flatMap((t) => t.stories)).size;
  const canNext = step !== 2 || picked.length >= MIN;
  const cta = editOnly ? "Save interests"
    : step === 0 ? "Get started"
    : step === 2 ? (picked.length >= MIN ? `Continue with ${picked.length}` : `Pick ${MIN - picked.length} more`)
    : step === STEPS - 1 ? "Start discovering" : "Continue";

  return (
    <main id="main" className="ob" data-theme="dark">
      {/* top row: back, progress, skip (not on the welcome screen) */}
      {step > 0 && (
        <div className="ob__top">
          <button type="button" className="ob__icon" onClick={back} aria-label="Back"><BackIcon /></button>
          {!editOnly && (
            <div className="ob__progress" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS - 1} aria-valuenow={step} aria-label={`Step ${step} of ${STEPS - 1}`}>
              {Array.from({ length: STEPS - 1 }, (_, i) => <span key={i} className={i < step ? "is-on" : ""} />)}
            </div>
          )}
          {!editOnly ? <button type="button" className="ob__skip t-label-xs" onClick={skip}>Skip</button> : <span />}
        </div>
      )}

      <div className="ob__body" key={step}>
        {step === 0 && (
          <section className="ob__step ob__step--welcome">
            <div className="ob__stack" aria-hidden>
              {stack.map((c, i) => (
                <div key={c.slug} className={`ob__stack-card ob__stack-card--${i}`}>
                  {c.art ? <img src={c.art} alt="" /> : <span>{c.title}</span>}
                </div>
              ))}
            </div>
            <p className="t-label-xs ob__eyebrow">Welcome to Scrollbook</p>
            <h1 className="ob__title">One story<br />at a time.</h1>
            <p className="ob__lead">Short, true stories about the companies and people that shape the world. Swipe through, keep what grabs you, and remember what you read.</p>
          </section>
        )}

        {step === 1 && (
          <section className="ob__step">
            <p className="t-label-xs ob__eyebrow">How it works</p>
            <h1 className="ob__title">Swipe. Save.<br />Read.</h1>
            <div className="ob__demo" aria-hidden>
              <div className="ob__demo-card ob__demo-card--back" />
              <div className="ob__demo-card">
                <div className="ob__demo-art">{stack[1]?.art && <img src={stack[1].art} alt="" />}</div>
                <div className="ob__demo-lines"><span /><span /><span /></div>
              </div>
            </div>
            <ul className="ob__how">
              <li><span className="ob__how-dot"><SaveIcon /></span><div><b>Swipe right to save</b><span>It goes on your Shelf for later.</span></div></li>
              <li><span className="ob__how-dot"><XIcon /></span><div><b>Swipe left to skip</b><span>Every card still teaches you one fact.</span></div></li>
              <li><span className="ob__how-dot"><TapIcon /></span><div><b>Tap to read</b><span>A five-minute story. Highlight anything worth keeping.</span></div></li>
            </ul>
          </section>
        )}

        {step === 2 && (
          <section className="ob__step">
            <p className="t-label-xs ob__eyebrow">{editOnly ? "Your interests" : "Make it yours"}</p>
            <h1 className="ob__title">What are you<br />curious about?</h1>
            <p className="ob__lead">Pick at least {MIN}. Discover deals these first, with a few surprises mixed in.</p>
            <div className="ob__topics" role="group" aria-label="Topics">
              {topics.map((t) => {
                const on = picked.includes(t.slug);
                return (
                  <button key={t.slug} type="button" className={`ob__topic${on ? " is-on" : ""}`} aria-pressed={on} onClick={() => toggle(t.slug)}>
                    <span className="ob__topic-art">{t.art && <img src={t.art} alt="" loading="lazy" />}{on && <span className="ob__topic-check"><CheckIcon /></span>}</span>
                    <span className="ob__topic-name">{t.title}</span>
                    <span className="ob__topic-n t-label-xs">{t.count} stories</span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="ob__step">
            <p className="t-label-xs ob__eyebrow">Daily goal</p>
            <h1 className="ob__title">How much<br />a day?</h1>
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

        {step === 4 && (
          <section className="ob__step">
            <p className="t-label-xs ob__eyebrow">Last thing</p>
            <h1 className="ob__title">What should<br />we call you?</h1>
            <label className="ob__field">
              <span className="sr-only">Your name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your first name" autoComplete="given-name" maxLength={30}
                onKeyDown={(e) => { if (e.key === "Enter") finish(); }} />
            </label>
            <div className="ob__summary">
              <p className="t-label-xs">Your deck is ready</p>
              <p className="ob__summary-main">{deckSize} stories{titles.length ? <> across <b>{titles.slice(0, 3).join(", ")}</b>{titles.length > 3 && ` +${titles.length - 3} more`}</> : null}</p>
              <p className="ob__summary-sub">{GOALS.find((g) => g.n === goal)?.sub.replace(" · ", ", ")}</p>
            </div>
          </section>
        )}
      </div>

      <div className="ob__cta">
        <button type="button" className="ob__next" onClick={next} disabled={!canNext}>{cta}<ArrowIcon /></button>
        {step === 0 && <button type="button" className="ob__later t-label-xs" onClick={skip}>I&rsquo;ll look around first</button>}
      </div>
    </main>
  );
}
