import { getGraph, getPhases } from "@/lib/content";
import { MapChrome } from "@/components/map/map-chrome";

/** Phase maps share this layout, so the bar and legend stay mounted between phases. */
export default function MapLayout({ children }: LayoutProps<"/">) {
  const items = getGraph().nodes.map(n => ({ id: n.id, title: n.title, note: n.note, phase: n.phase }));
  return (
    <>
      {children}
      <MapChrome items={items} phases={getPhases()} />
    </>
  );
}
