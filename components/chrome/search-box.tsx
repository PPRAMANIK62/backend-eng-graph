"use client";

// The ARIA combobox pattern: keys are handled on the input, the list only takes pointer picks.
/* oxlint-disable jsx-a11y/prefer-tag-over-role, jsx-a11y/no-noninteractive-element-to-interactive-role, jsx-a11y/click-events-have-key-events */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { NodeSummary } from "@/lib/graph";
import s from "./chrome.module.css";

export type SearchItem = Pick<NodeSummary, "id" | "title" | "note" | "phase">;

/** "Find a concept": a combobox over titles and notes, in every phase. Press / to focus it. */
export function SearchBox({ items, phase, onPick }: { items: SearchItem[]; phase: number | null; onPick: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || t?.closest("input, textarea, [contenteditable]")) return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    const all = [...items].sort((a, b) => a.title.localeCompare(b.title));
    if (!t) return all.slice(0, 8);
    const words = (x: SearchItem) => x.title.toLowerCase().split(/[^a-z0-9/]+/);
    const starts = all.filter(x => x.title.toLowerCase().startsWith(t) || x.id.startsWith(t));
    const wordStarts = all.filter(x => !starts.includes(x) && words(x).some(w => w.startsWith(t)));
    // Anywhere in the title or note, once the query is long enough to mean something.
    const rest =
      t.length < 3
        ? []
        : all.filter(
            x => !starts.includes(x) && !wordStarts.includes(x) && (x.title.toLowerCase().includes(t) || x.note.toLowerCase().includes(t)),
          );
    return [...starts, ...wordStarts, ...rest].slice(0, 8);
  }, [q, items]);

  const pick = (id: string) => {
    onPick(id);
    setQ("");
    setOpen(false);
    input.current?.blur();
  };

  return (
    <div className={s.search}>
      <Search size={15} className={s.searchIcon} aria-hidden />
      <input
        ref={input}
        type="text"
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
        aria-label="Find a concept"
        placeholder="Find a concept"
        value={q}
        onChange={e => {
          setQ(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={e => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive(a => Math.min(results.length - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive(a => Math.max(0, a - 1));
          } else if (e.key === "Enter" && results[active]) {
            e.preventDefault();
            pick(results[active].id);
          } else if (e.key === "Escape") {
            setOpen(false);
            input.current?.blur();
          }
        }}
      />
      <kbd className={s.searchKey} aria-hidden>
        /
      </kbd>
      {results.length > 0 && (
        <ul id={listId} role="listbox" className={s.results} data-open={open}>
          {results.map((r, i) => (
            <li
              key={r.id}
              id={`${listId}-${r.id}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={e => e.preventDefault()}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(r.id)}
            >
              <span className={s.resTitle}>{r.title}</span>
              {r.phase !== phase && <span className={s.resPhase}>phase {r.phase}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
