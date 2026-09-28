"use client";

import { useCallback, useSyncExternalStore } from "react";

// What the reader has marked as understood. Lives in this browser only.

const KEY = "backend-eng-graph:understood";
const EVENT = "understood-change";
const EMPTY: ReadonlySet<string> = new Set();

let cached: { raw: string | null; set: ReadonlySet<string> } = { raw: null, set: EMPTY };

function read(): ReadonlySet<string> {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cached.raw) {
    let ids: string[] = [];
    try {
      ids = raw ? JSON.parse(raw) : [];
    } catch {}
    cached = { raw, set: new Set(ids) };
  }
  return cached.set;
}

function write(set: ReadonlySet<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...set]));
  } catch {}
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // other tabs
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function useUnderstood() {
  const understood = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: string) => {
    const next = new Set(read());
    if (next.has(id)) next.delete(id);
    else next.add(id);
    write(next);
  }, []);
  const clear = useCallback(() => write(EMPTY), []);
  return { understood, toggle, clear };
}

const noop = () => () => {};
/** False during server render and hydration, true after. For UI that depends on stored progress. */
export function useHydrated() {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
