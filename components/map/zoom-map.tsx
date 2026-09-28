"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, ViewTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { select } from "d3-selection";
import { zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from "d3-zoom";
import { ArrowLeft, ArrowRight, Check, Maximize2, Minus, Plus } from "lucide-react";
import { minutes, phaseHref, type NodeSummary, type PhaseInfo } from "@/lib/graph";
import { useHydrated, useUnderstood } from "@/lib/progress";
import { SearchBox } from "@/components/chrome/search-box";
import { PhaseTabs } from "@/components/chrome/phase-tabs";
import { ThemeSwitch } from "@/components/chrome/theme-switch";
import { MORPH_VT, NAV, toward } from "@/components/chrome/nav";
import { CHIP, type PhaseMap } from "./model";
import { setFocus, useFocus } from "./focus";
import s from "./map.module.css";

export type Concept = NodeSummary & { lines: string[] };

type Props = { map: PhaseMap; concepts: Record<string, Concept>; phases: PhaseInfo[] };

const FOCUS_K = { wide: 1.15, narrow: 0.95 };
const WIDE = 900; // at or above this width the reading panel sits on the left, below it at the bottom

type EdgeState = "need" | "lead" | "peek" | "dim" | undefined;
type ChipState = "focus" | "before" | "after" | "dim" | undefined;

export function ZoomMap({ map, concepts, phases }: Props) {
  const router = useRouter();
  const hash = useFocus();
  const hydrated = useHydrated();
  const { understood } = useUnderstood();
  const byId = useMemo(() => new Map(map.nodes.map(n => [n.id, n])), [map]);
  const focus = hash && byId.has(hash) ? hash : null;
  const node = focus ? byId.get(focus)! : null;
  const [hover, setHover] = useState<string | null>(null);
  const phase = phases.find(p => p.n === map.phase)!;
  const done = (id: string) => hydrated && understood.has(id);

  // ---------- what lights up ----------
  const chain = useMemo(() => new Set(node ? [node.id, ...node.before] : []), [node]);
  const stubsLit = useMemo(() => {
    const m = new Map<string, "before" | "after">();
    if (!node) return m;
    for (const id of chain) for (const k of byId.get(id)!.stubsIn) m.set(k, "before");
    for (const k of node.stubsOut) m.set(k, "after");
    return m;
  }, [node, chain, byId]);

  const chipState = (id: string): ChipState => {
    if (!node) return undefined;
    if (id === node.id) return "focus";
    if (chain.has(id)) return "before";
    if (node.unlocks.includes(id)) return "after";
    return "dim";
  };
  const edgeState = (from: string, to: string): EdgeState => {
    let st: EdgeState;
    if (node) {
      if (chain.has(to) && (chain.has(from) || stubsLit.get(from) === "before")) st = "need";
      else if (from === node.id && (node.unlocks.includes(to) || node.stubsOut.includes(to))) st = "lead";
      else st = "dim";
    }
    if (hover && (from === hover || to === hover) && st !== "need" && st !== "lead") st = "peek";
    return st;
  };

  // ---------- camera: d3-zoom holds the transform, CSS animates the flights ----------
  const stageRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<SVGGElement>(null);
  const miniRef = useRef<SVGRectElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const firstRef = useRef(true);

  const paint = useCallback((t: ZoomTransform) => {
    viewRef.current!.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
    // The part of the map on screen, for the small map's frame.
    const r = miniRef.current,
      el = stageRef.current;
    if (r && el) {
      r.setAttribute("x", String(-t.x / t.k));
      r.setAttribute("y", String(-t.y / t.k));
      r.setAttribute("width", String(el.clientWidth / t.k));
      r.setAttribute("height", String(el.clientHeight / t.k));
    }
  }, []);

  // A layout effect declared before the flight effect below, so the zoom exists before the first landing.
  useLayoutEffect(() => {
    const svg = svgRef.current!,
      view = viewRef.current!;
    const z = zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 2.5])
      .on("zoom", e => {
        if (e.sourceEvent) view.removeAttribute("data-flying"); // a hand on the map stops any flight
        paint(e.transform);
      });
    zoomRef.current = z;
    const sel = select(svg).call(z).on("dblclick.zoom", null);
    const land = (e: TransitionEvent) => e.propertyName === "transform" && view.removeAttribute("data-flying");
    view.addEventListener("transitionend", land);
    return () => {
      sel.on(".zoom", null);
      view.removeEventListener("transitionend", land);
    };
  }, [paint]);

  /** Where the camera aims: the part of the screen not under the bar, the title or the reading panel. */
  const target = useCallback(
    (id: string | null): ZoomTransform => {
      const el = stageRef.current!;
      const w = el.clientWidth,
        h = el.clientHeight;
      const wide = w >= WIDE;
      if (id) {
        const n = byId.get(id)!;
        const area = wide ? { x: 448, y: 80, w: w - 448 - 16, h: h - 96 } : { x: 0, y: 64, w, h: h * 0.5 - 64 };
        const cur = zoomTransform(svgRef.current!).k;
        const k = Math.max(wide ? FOCUS_K.wide : FOCUS_K.narrow, Math.min(1.6, cur));
        return zoomIdentity.translate(area.x + area.w / 2 - (n.x + CHIP.w / 2) * k, area.y + area.h / 2 - (n.y + CHIP.h / 2) * k).scale(k);
      }
      if (!wide) {
        // A phone can't show a whole phase legibly: fit its height, start at step 1, and pan from there.
        const area = { x: 8, y: 176, h: h - 176 - 64 };
        const k = Math.max(0.5, Math.min(0.9, area.h / map.height));
        return zoomIdentity.translate(area.x, area.y + (area.h - map.height * k) / 2).scale(k);
      }
      const area = { x: 24, y: 180, w: w - 48, h: h - 180 - 72 };
      const k = Math.max(0.2, Math.min(1, area.w / map.width, area.h / map.height));
      return zoomIdentity.translate(area.x + (area.w - map.width * k) / 2, area.y + (area.h - map.height * k) / 2).scale(k);
    },
    [byId, map.width, map.height],
  );

  const fly = useCallback((t: ZoomTransform, animate = true) => {
    const svg = svgRef.current!,
      z = zoomRef.current!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (animate && !reduce) viewRef.current!.setAttribute("data-flying", "");
    z.transform(select(svg), t);
  }, []);

  // Fly whenever the focus changes; land without flying on first paint.
  useLayoutEffect(() => {
    fly(target(focus), !firstRef.current);
    firstRef.current = false;
  }, [focus, fly, target]);

  useEffect(() => {
    const onResize = () => fly(target(focus), false);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [focus, fly, target]);

  const zoomBy = (f: number) => {
    const svg = svgRef.current!,
      el = stageRef.current!;
    const t = zoomTransform(svg);
    const k = Math.max(0.2, Math.min(2.5, t.k * f));
    const cx = el.clientWidth / 2,
      cy = el.clientHeight / 2;
    fly(zoomIdentity.translate(cx - ((cx - t.x) / t.k) * k, cy - ((cy - t.y) / t.k) * k).scale(k));
  };

  // ---------- going places ----------
  const open = useCallback(
    (id: string) => {
      const c = concepts[id];
      if (!c) return;
      if (byId.has(id)) setFocus(id);
      else router.push(`${phaseHref(c.phase)}#${id}`, { transitionTypes: toward(map.phase, c.phase) });
    },
    [byId, concepts, map.phase, router],
  );

  // Keys: Esc for the whole phase, ← to what it needs, → to what it unlocks, Enter to read.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, [contenteditable]") || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape" && focus) setFocus(null);
      else if (e.key === "ArrowLeft" && node && node.trail.length > 1) setFocus(node.trail[node.trail.length - 2]);
      else if (e.key === "ArrowRight" && node?.unlocks.length)
        setFocus([...node.unlocks].sort((a, b) => byId.get(a)!.level - byId.get(b)!.level)[0]);
      else if (e.key === "Enter" && node && !t?.closest("a, button")) router.push(`/n/${node.id}`, { transitionTypes: NAV.open });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focus, node, byId, router]);

  const items = useMemo(() => Object.values(concepts).map(c => ({ id: c.id, title: c.title, note: c.note, phase: c.phase })), [concepts]);
  const words = map.nodes.reduce((m, n) => m + concepts[n.id].words, 0);

  return (
    <div className={s.stage} ref={stageRef} data-focus={focus ? "" : undefined}>
      <svg ref={svgRef} className={s.canvas} role="application" aria-label={`Map of phase ${map.phase}: ${phase.title}`}>
        <g ref={viewRef} className={s.world}>
          {map.steps.map(st => (
            <text key={st.x} className={s.step} x={st.x} y={48 + 24}>
              {st.label}
            </text>
          ))}
          <g>
            {map.edges.map(e => (
              <g key={e.key} className={s.edge} data-state={edgeState(e.from, e.to)} data-cross={e.cross || undefined}>
                <path className={s.edgeBase} d={e.d} />
                <path className={s.edgeLit} d={e.d} pathLength={1} />
              </g>
            ))}
          </g>
          {map.stubs.map(st => {
            const c = concepts[st.id];
            return (
              <a
                key={st.key}
                href={`${phaseHref(st.phase)}#${st.id}`}
                className={s.chip}
                data-stub
                data-state={stubsLit.get(st.key) ?? (node ? "dim" : undefined)}
                aria-label={`Phase ${st.phase}: ${c.title}`}
                onClick={e => {
                  e.preventDefault();
                  open(st.id);
                }}
              >
                <rect className={s.chipBack} x={st.x} y={st.y} width={CHIP.w} height={CHIP.h} rx={10} />
                <g className={s.chipFace}>
                  <rect className={s.chipBox} x={st.x} y={st.y} width={CHIP.w} height={CHIP.h} rx={10} />
                  <text className={s.chipSub} x={st.x + 14} y={st.y + 22}>
                    {st.side === "in" ? "from" : "used in"} phase {st.phase}
                  </text>
                  <text className={s.chipLabel} x={st.x + 14} y={st.y + 41}>
                    {c.lines.length > 1 ? `${c.lines[0]}…` : c.lines[0]}
                  </text>
                </g>
              </a>
            );
          })}
          {map.nodes.map(n => {
            const c = concepts[n.id];
            const y0 = n.y + CHIP.h / 2 + (c.lines.length === 1 ? 5.5 : -3.5);
            return (
              <a
                key={n.id}
                href={`#${n.id}`}
                className={s.chip}
                data-state={chipState(n.id)}
                data-done={done(n.id) || undefined}
                aria-label={c.title}
                aria-current={focus === n.id ? "true" : undefined}
                onClick={e => {
                  e.preventDefault();
                  setFocus(n.id);
                }}
                onDoubleClick={() => router.push(`/n/${n.id}`, { transitionTypes: NAV.open })}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(h => (h === n.id ? null : h))}
              >
                <rect className={s.chipBack} x={n.x} y={n.y} width={CHIP.w} height={CHIP.h} rx={10} />
                <g className={s.chipFace}>
                  <rect className={s.chipBox} x={n.x} y={n.y} width={CHIP.w} height={CHIP.h} rx={10} />
                  <text className={s.chipLabel} x={n.x + 16} y={y0}>
                    {c.lines.map((l, i) => (
                      <tspan key={i} x={n.x + 16} dy={i ? 18 : 0}>
                        {l}
                      </tspan>
                    ))}
                  </text>
                  <g className={s.chipDone} transform={`translate(${n.x + CHIP.w - 12} ${n.y + 12})`}>
                    <circle r={8} />
                    <path d="M-3.5 0.2 L-1 2.8 L3.6 -2.4" />
                  </g>
                </g>
              </a>
            );
          })}
        </g>
      </svg>

      {/* ---------- floating: bar, title, panel, small map, legend, zoom ---------- */}
      <header className={s.bar}>
        <Link href="/" className={s.brand}>
          backend-eng-graph
        </Link>
        <PhaseTabs phases={phases} current={map.phase} />
        <SearchBox items={items} phase={map.phase} onPick={open} />
        <ThemeSwitch />
      </header>

      <div className={s.title} aria-hidden={!!focus}>
        <p className={s.eyebrow}>
          Phase {map.phase} of {phases.length}
        </p>
        <h1>{phase.title}</h1>
        <p className={s.meta}>
          {map.nodes.length} concepts, left to right in the order you can read them. About {Math.round(minutes(words) / 6) / 10} hours of
          reading. Pick one to fly to it, or press <kbd>/</kbd> to search.
        </p>
      </div>

      <aside className={s.panel} aria-label="Concept" data-open={focus ? "" : undefined}>
        {node && (
          <div className={s.panelInner} key={node.id}>
            <p className={s.trail}>
              {node.trail.map((id, i) => (
                <span key={id}>
                  {i > 0 && <span className={s.arr}>›</span>}
                  {id === node.id ? (
                    <b>{concepts[id].title}</b>
                  ) : (
                    <a
                      href={`#${id}`}
                      onClick={e => {
                        e.preventDefault();
                        setFocus(id);
                      }}
                    >
                      {concepts[id].title}
                    </a>
                  )}
                </span>
              ))}
            </p>
            <ViewTransition name={`title-${node.id}`} share={MORPH_VT} default="none">
              <h2 className={s.panelTitle}>{concepts[node.id].title}</h2>
            </ViewTransition>
            <p className={s.facts}>
              {concepts[node.id].depth === "deep" ? "Deep" : "Short"} · step {node.level + 1} of{" "}
              {map.steps.filter(x => x.label.startsWith("Step")).length} · {minutes(concepts[node.id].words)} min
              {done(node.id) && (
                <span className={s.doneTag}>
                  <Check size={12} strokeWidth={3} /> understood
                </span>
              )}
            </p>
            <p className={s.note}>{concepts[node.id].note}</p>
            <div className={s.rel}>
              <Related
                title="Needs"
                tone="need"
                ids={directNeeds(map, node.id)}
                here={map.phase}
                concepts={concepts}
                onOpen={open}
                empty="Nothing. A place to start."
              />
              <Related
                title="Unlocks"
                tone="lead"
                ids={[...node.unlocks, ...node.stubsOut.map(stubId)]}
                here={map.phase}
                concepts={concepts}
                onOpen={open}
                empty="Nothing yet."
              />
            </div>
            <p className={s.acts}>
              <Link href={`/n/${node.id}`} transitionTypes={NAV.open} className={s.btn}>
                Read the article <ArrowRight size={15} />
              </Link>
            </p>
            <p className={s.keys}>
              <span>
                <kbd aria-label="Left arrow">
                  <ArrowLeft size={12} strokeWidth={2.2} />
                </kbd>
                what it needs
              </span>
              <span>
                <kbd aria-label="Right arrow">
                  <ArrowRight size={12} strokeWidth={2.2} />
                </kbd>
                what it unlocks
              </span>
              <span>
                <kbd>Esc</kbd>
                whole phase
              </span>
            </p>
          </div>
        )}
      </aside>

      <nav className={s.mini} aria-label="Whole phase" data-open={focus ? "" : undefined}>
        <p className={s.miniCap}>Whole phase</p>
        <svg viewBox={`0 0 ${map.width} ${map.height}`}>
          {map.edges
            .filter(e => !e.cross)
            .map(e => {
              const a = byId.get(e.from)!,
                b = byId.get(e.to)!;
              return (
                <line
                  key={e.key}
                  data-state={edgeState(e.from, e.to)}
                  x1={a.x + CHIP.w / 2}
                  y1={a.y + CHIP.h / 2}
                  x2={b.x + CHIP.w / 2}
                  y2={b.y + CHIP.h / 2}
                />
              );
            })}
          {map.nodes.map(n => (
            <circle
              key={n.id}
              cx={n.x + CHIP.w / 2}
              cy={n.y + CHIP.h / 2}
              r={30}
              data-state={chipState(n.id)}
              onClick={() => setFocus(n.id)}
            >
              <title>{concepts[n.id].title}</title>
            </circle>
          ))}
          <rect ref={miniRef} className={s.miniFrame} rx={24} />
        </svg>
      </nav>

      <div className={s.legend} aria-hidden data-hidden={focus ? "" : undefined}>
        <span>
          <i className={s.lgNeed} />
          needs
        </span>
        <span>
          <i className={s.lgLead} />
          unlocks
        </span>
        <span>
          <i className={s.lgDone} />
          understood
        </span>
      </div>

      <div className={s.zoom} data-focus={focus ? "" : undefined}>
        <button type="button" aria-label="Zoom in" onClick={() => zoomBy(1.3)}>
          <Plus size={16} />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.3)}>
          <Minus size={16} />
        </button>
        <button type="button" aria-label="Show the whole phase" onClick={() => (focus ? setFocus(null) : fly(target(null)))}>
          <Maximize2 size={15} />
        </button>
      </div>
    </div>
  );
}

/** A stub's key is "in:<id>" or "out:<id>". */
const stubId = (key: string) => key.slice(key.indexOf(":") + 1);

function directNeeds(map: PhaseMap, id: string) {
  return map.edges.filter(e => e.to === id).map(e => (e.cross ? stubId(e.from) : e.from));
}

function Related({
  title,
  tone,
  ids,
  here,
  concepts,
  onOpen,
  empty,
}: {
  title: string;
  tone: "need" | "lead";
  ids: string[];
  here: number;
  concepts: Record<string, Concept>;
  onOpen: (id: string) => void;
  empty: string;
}) {
  const unique = [...new Set(ids)].filter(id => concepts[id]);
  return (
    <div>
      <h3 className={s.relTitle} data-tone={tone}>
        {title}
      </h3>
      {unique.length ? (
        <ul>
          {unique.map(id => (
            <li key={id}>
              <button type="button" onClick={() => onOpen(id)}>
                {concepts[id].title}
              </button>
              {concepts[id].phase !== here && <em>phase {concepts[id].phase}</em>}
            </li>
          ))}
        </ul>
      ) : (
        <p>{empty}</p>
      )}
    </div>
  );
}
