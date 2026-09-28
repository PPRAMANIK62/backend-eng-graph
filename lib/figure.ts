/** Prefix every selector in a flat stylesheet with a scope. */
const prefix = (css: string, scope: string) =>
  css.replace(/([^{}]+)\{([^{}]*)\}/g, (_, sel: string, body: string) => {
    const sels = sel
      .split(",")
      .map(x => `${scope} ${x.trim()}`)
      .join(",");
    return `${sels}{${body}}`;
  });

/**
 * Figures are hand-written SVGs (visuals/STYLE.md) with short class names and a
 * prefers-color-scheme block. Inlined as-is they'd leak styles into the page and
 * ignore the site's theme switch, so each gets its own scope: every selector is
 * prefixed, the dark block keys off the site's .dark class, and ids are renamed.
 */
export function scopeFigure(svg: string, key: string, alt: string): string {
  let out = svg.replace(/<style>([\s\S]*?)<\/style>/, (_, css: string) => {
    let light = css,
      dark = "";
    const m = css.match(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{/);
    if (m) {
      const start = m.index! + m[0].length;
      let depth = 1,
        i = start;
      for (; i < css.length && depth > 0; i++) {
        if (css[i] === "{") depth++;
        else if (css[i] === "}") depth--;
      }
      dark = css.slice(start, i - 1); // i is just past the block's closing brace
      light = css.slice(0, m.index) + css.slice(i);
    }
    return `<style>${prefix(light, `.${key}`)}${dark ? prefix(dark, `.dark .${key}`) : ""}</style>`;
  });
  out = out
    .replace(/\bid="([^"]+)"/g, `id="${key}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${key}-$1)`)
    .replace(/href="#([^"]+)"/g, `href="#${key}-$1"`);
  const label = alt.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return out.replace(/<svg\b/, `<svg class="${key}" role="img" aria-label="${label}"`);
}
