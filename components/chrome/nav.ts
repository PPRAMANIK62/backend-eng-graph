// Navigation types. Each navigation carries one view transition type; the
// animations are CSS in app/globals.css.

export const NAV = { forward: ["forward"], back: ["back"], open: ["open"], close: ["close"] };

/** How a whole page enters and leaves, per type. Untyped navigations (browser back) don't animate. */
export const PAGE_VT = { forward: "vt-forward", back: "vt-back", open: "vt-open", close: "vt-close", default: "none" };

/** A concept's title, carried between the map's reading panel and the article heading. */
export const MORPH_VT = { open: "vt-morph", close: "vt-morph", default: "none" };
