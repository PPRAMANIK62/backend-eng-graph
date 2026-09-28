"use client";

import { useSyncExternalStore } from "react";

// The concept in focus lives in the URL hash (/#fsync), so every focus is a
// history entry: back and forward retrace the path, and a link can point at one.

const EVENT = "focus-change";

function read(): string | null {
  const h = decodeURIComponent(window.location.hash.slice(1));
  return h || null;
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("popstate", onChange);
  window.addEventListener("hashchange", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("popstate", onChange);
    window.removeEventListener("hashchange", onChange);
  };
}

export function useFocus(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}

/** Focus a concept (or the whole phase, with null) as a new history entry. */
export function setFocus(id: string | null) {
  if (id === read()) return;
  const url = new URL(window.location.href);
  url.hash = id ? id : "";
  // Keep Next's own history state, so its router stays in sync.
  window.history.pushState(window.history.state, "", id ? url : url.pathname + url.search);
  window.dispatchEvent(new Event(EVENT));
}
