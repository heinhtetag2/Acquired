"use client";
import { useState } from "react";

type Props = { id: string; eyebrow?: string; copy?: string; cta: string; variant?: "stack" | "row"; dark?: boolean; gap?: "sm" | "base"; onSuccess?: () => void };

export default function EmailForm({ id, eyebrow, copy, cta, variant = "stack", dark, gap = "sm", onSuccess }: Props) {
  const [state, setState] = useState<"idle" | "invalid" | "done">("idle");
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const v = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); setState(ok ? "done" : "invalid"); if (ok) onSuccess?.();
  };
  if (state === "done") return <p className="t-body-140" role="status">Thanks — you’re on the list.</p>;
  return (
    <form onSubmit={onSubmit} noValidate aria-describedby={eyebrow ? `${id}-eyebrow` : undefined}>
      {eyebrow && <div id={`${id}-eyebrow`} className="t-label-lg muted" style={{ lineHeight: "var(--lh-140)" }}>{eyebrow}</div>}
      {copy && (<>{eyebrow && <div className="spacer-2xs" />}<div className="t-body-140">{copy}</div><div className={`spacer-${gap}`} /></>)}
      <label htmlFor={`${id}-input`} className="sr-only">Email address</label>
      <div className={variant === "row" ? "fcta__row" : ""}>
        <input id={`${id}-input`} name="email" type="email" className="input" placeholder="Email address" autoComplete="email"
          aria-invalid={state === "invalid"} onChange={() => state === "invalid" && setState("idle")} />
        {variant === "stack" && <div className="spacer-2xs" />}
        <button type="submit" className={`btn btn--lg btn--rect ${variant === "stack" ? "btn--block" : ""} ${dark ? "btn--cream" : "btn--dark"}`}>
          {variant === "row" ? <span aria-hidden>→</span> : cta}
          {variant === "row" && <span className="sr-only">{cta}</span>}
        </button>
      </div>
    </form>
  );
}
