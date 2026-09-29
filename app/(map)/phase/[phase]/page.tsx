import type { Metadata } from "next";
import { getPhases } from "@/lib/content";
import { MapPage } from "@/components/map/map-page";

export const dynamicParams = false;

/** Phase 1 lives at /; every other phase with something written gets a map. */
export function generateStaticParams() {
  return getPhases()
    .filter(p => p.n !== 1 && p.concepts > 0)
    .map(p => ({ phase: String(p.n) }));
}

export async function generateMetadata({ params }: PageProps<"/phase/[phase]">): Promise<Metadata> {
  const n = Number((await params).phase);
  const p = getPhases().find(x => x.n === n);
  return p ? { title: `Phase ${p.n}: ${p.title}` } : {};
}

export default async function PhaseMap({ params }: PageProps<"/phase/[phase]">) {
  return <MapPage phase={Number((await params).phase)} />;
}
