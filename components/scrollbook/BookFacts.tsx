"use client";
import { useId, useState } from "react";
import { PlusIcon } from "../Icons";

/* "Quick facts": a row in the same style as Transcript / Sources that opens in place into a fact card (label / value rows). */
export default function BookFacts({ facts }: { facts: { label: string; value: string }[] }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rows = facts;
  return (
    <div className={`sb-facts${open ? " is-open" : ""}`}>
      <button type="button" className="popup-btn sb-facts__btn" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)}>
        Quick facts<PlusIcon />
      </button>
      <div id={id} className="sb-facts__panel" role="region" aria-label="Quick facts" inert={!open}>
        <div className="sb-facts__inner">
          <dl className="sb-facts__list">
            {rows.map((r) => (
              <div key={r.label} className="sb-facts__row">
                <dt>{r.label}</dt>
                <dd>{r.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
