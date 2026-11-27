"use client";
import { useEffect, useState } from "react";
import type { DraftReply, DraftSource } from "@/app/api/draft/route";

/* The writing studio: sources in, a first draft out. Claude writes only from what you paste (it doesn't browse),
   in Scrollbook's shape and house style, and lists what you should check. You edit it, check it against the sources,
   then paste the three pieces into content/scrollbook.json. */
const empty = (): DraftSource => ({ label: "", url: "", text: "" });

export default function Studio() {
  const [status, setStatus] = useState<{ ai: boolean; topics: string[] } | null>(null);
  const [idea, setIdea] = useState("");
  const [topic, setTopic] = useState("");
  const [sources, setSources] = useState<DraftSource[]>([empty()]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<DraftReply | null>(null);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/draft").then((r) => r.json()).then((s) => { setStatus(s); setTopic(s.topics[0] ?? ""); }).catch(() => setStatus({ ai: false, topics: [] }));
  }, []);

  const setSource = (i: number, patch: Partial<DraftSource>) => setSources((list) => list.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const ready = idea.trim() && sources.some((s) => s.text.trim().length > 40);

  const write = async () => {
    setBusy(true); setError(""); setDraft(null);
    try {
      const res = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, topic, sources }) });
      const data = await res.json();
      if (res.ok) setDraft(data); else setError(data.error ?? "Something went wrong.");
    } catch { setError("Couldn't reach the server."); }
    setBusy(false);
  };
  const copy = async (key: string, value: unknown) => {
    try { await navigator.clipboard.writeText(typeof value === "string" ? value : JSON.stringify(value, null, 2)); setCopied(key); setTimeout(() => setCopied(""), 1600); } catch {}
  };

  return (
    <div className="studio" data-theme="dark">
      <div className="studio__inner">
        <header className="studio__head">
          <p className="t-label-xs">Scrollbook studio</p>
          <h1 className="studio__title">Write a story from sources</h1>
          <p className="studio__lede">Paste what you found. Claude drafts a story in the Scrollbook shape using only those sources, and tells you what to check. You edit it and add it to the app.</p>
        </header>

        {status && !status.ai && (
          <p className="studio__notice">Claude isn&rsquo;t connected yet. Add <code>ANTHROPIC_API_KEY</code> to <code>.env.local</code> in the project, then restart the dev server.</p>
        )}

        <section className="studio__card">
          <label className="studio__field">
            <span>What&rsquo;s the story?</span>
            <textarea rows={3} value={idea} onChange={(e) => setIdea(e.target.value)} placeholder="e.g. How Riot designed Valorant's telekinetic agent Hush, and why she was revealed in Shanghai" />
          </label>
          <label className="studio__field">
            <span>Topic</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>{status?.topics.map((t) => <option key={t}>{t}</option>)}</select>
          </label>
        </section>

        {sources.map((s, i) => (
          <section key={i} className="studio__card">
            <div className="studio__card-head">
              <p className="t-label-xs">Source {i + 1}</p>
              {sources.length > 1 && <button type="button" className="studio__link" onClick={() => setSources((l) => l.filter((_, k) => k !== i))}>Remove</button>}
            </div>
            <div className="studio__row">
              <label className="studio__field"><span>Title</span><input value={s.label} onChange={(e) => setSource(i, { label: e.target.value })} placeholder="Hush, official agent page" /></label>
              <label className="studio__field"><span>Link</span><input type="url" value={s.url} onChange={(e) => setSource(i, { url: e.target.value })} placeholder="https://" /></label>
            </div>
            <label className="studio__field">
              <span>Text</span>
              <textarea rows={7} value={s.text} onChange={(e) => setSource(i, { text: e.target.value })} placeholder="Paste the article or transcript. Claude reads only what's pasted here, not the link." />
            </label>
          </section>
        ))}
        <button type="button" className="studio__add" onClick={() => setSources((l) => [...l, empty()])}>Add another source</button>

        <button type="button" className="studio__cta" onClick={write} disabled={!ready || busy || !status?.ai}>{busy ? "Writing the draft…" : "Write the draft"}</button>
        {busy && <p className="studio__hint">This takes about a minute.</p>}
        {error && <p className="studio__error" role="alert">{error}</p>}

        {draft && (
          <section className="studio__out" aria-label="Draft">
            {draft.notes.length > 0 && (
              <div className="studio__notes">
                <p className="t-label-xs">Check before publishing</p>
                <ul>{draft.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
              </div>
            )}

            <div className="studio__preview">
              <p className="t-label-xs">{String(draft.deck.topic)} · {String(draft.deck.min)} min read</p>
              <h2>{draft.cardTitle}</h2>
              <p className="studio__hook">{String(draft.deck.hook)}</p>
            </div>
            <article className="studio__story">
              <h3>{String(draft.story.title)}</h3>
              {(draft.story.overview as string[]).map((p, i) => <p key={`o${i}`}>{p}</p>)}
              {(draft.story.story as ({ h: string; p: string[] } | { quote: string })[]).map((b, i) => "quote" in b
                ? <blockquote key={i}>{b.quote}</blockquote>
                : <div key={i}><h4>{b.h}</h4>{b.p.map((p, k) => <p key={k}>{p}</p>)}</div>)}
            </article>

            <div className="studio__paste">
              <p className="t-label-xs">Add it to content/scrollbook.json</p>
              <button type="button" className="studio__copy" onClick={() => copy("story", { [draft.slug]: draft.story })}>{copied === "story" ? "Copied" : "Copy story"}<span>into &ldquo;stories&rdquo;</span></button>
              <button type="button" className="studio__copy" onClick={() => copy("deck", draft.deck)}>{copied === "deck" ? "Copied" : "Copy card"}<span>into &ldquo;deck&rdquo;</span></button>
              <button type="button" className="studio__copy" onClick={() => copy("title", `"${draft.slug}": ${JSON.stringify(draft.cardTitle)}`)}>{copied === "title" ? "Copied" : "Copy card title"}<span>into &ldquo;cardTitles&rdquo;</span></button>
              <p className="studio__hint">Then add a cover image at <code>public/images/art/{draft.slug}.jpg</code> and set <code>image</code> and <code>cover</code>.</p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
