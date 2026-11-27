import type { Book } from "./content";

/** A story as plain text for Claude (and for the no-AI fallback search): numbered paragraphs, quick facts and sources. */
export type StoryDoc = { title: string; paras: string[]; facts: string[]; sources: { label: string; url: string }[] };

export function storyDoc(b: Book): StoryDoc {
  const paras: string[] = [...(b.overview ?? [])];
  for (const block of b.story ?? []) {
    if ("p" in block) paras.push(...block.p.map((p) => `${block.h}: ${p}`));
    else if ("quote" in block) paras.push(`Pull quote: ${block.quote}`);
    else if (block.caption) paras.push(`Video: ${block.caption}`);
  }
  return {
    title: b.title, paras,
    facts: (b.facts ?? []).map((f) => `${f.label}: ${f.value}`),
    sources: (b.deeper?.sources ?? []).filter((s) => s.url),
  };
}

export function storyPrompt(d: StoryDoc) {
  return [
    `<story title="${d.title}">`,
    ...d.paras.map((p, i) => `[p${i + 1}] ${p}`),
    d.facts.length ? `\nQuick facts:\n${d.facts.map((f) => `- ${f}`).join("\n")}` : "",
    `</story>`,
    `<sources>`,
    ...d.sources.map((s, i) => `[${i + 1}] ${s.label} (${s.url})`),
    `</sources>`,
  ].join("\n");
}
