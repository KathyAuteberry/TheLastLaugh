import p1Raw from "../data/phases/p1.json";
import p2Raw from "../data/phases/p2.json";
import geometryP1 from "../data/geometry/p1.json";
import geometryP2 from "../data/geometry/p2.json";
import sourcesRaw from "../data/sources.json";
import type { Geometry, PhaseData } from "./model/types";

export const p1 = p1Raw as unknown as PhaseData;
export const p2 = p2Raw as unknown as PhaseData;
/** Every phase shown in the guide, in fight order. */
export const phases: PhaseData[] = [p1, p2];
export const allMechanics = phases.flatMap((p) => p.mechanics);
/** The mechanics of one phase (a pull is built per phase: positions never carry across a phase change). */
export const phaseMechanics = (phase: number) => phases.find((p) => p.phase === phase)?.mechanics ?? [];

// One geometry file per phase, merged: scene keys start with the mechanic id, so they never clash.
const g1 = geometryP1 as unknown as Geometry;
const g2 = geometryP2 as unknown as Partial<Geometry>;
export const geometry: Geometry = {
  ...g1,
  scenes: { ...g1.scenes, ...g2.scenes },
  variations: { ...g1.variations, ...g2.variations },
  seeAlso: { ...g1.seeAlso, ...g2.seeAlso },
};

interface SourceEntry { title?: string; url?: string; section?: string; parent?: string; sheet?: string; source?: string; at?: string }
interface ImageEntry { parent: string; file: string; caption?: string }
const reg = sourcesRaw as unknown as { sources: Record<string, SourceEntry & { imageUrlBase?: string }>; images: Record<string, ImageEntry> };

/** Human label + link for a source ref. */
export function describeSource(ref: string): { label: string; url?: string } {
  const img = reg.images[ref];
  if (img) {
    const base = reg.sources.yan?.imageUrlBase ?? "";
    return { label: `Yan Flash diagram (${reg.sources[img.parent]?.section ?? ""})`, url: base + img.file };
  }
  const s = reg.sources[ref];
  if (!s) return { label: ref };
  const parent = s.parent ? reg.sources[s.parent] : undefined;
  if (s.source === "yan") return { label: `Yan Flash · ${s.section ?? "page"}`, url: parent?.url ?? s.url };
  if (s.source === "ikuya") return { label: `Ikuya Mitty v6.3 · ${s.sheet ?? "sheet"}` };
  if (s.source === "owner") return { label: "Owner review" };
  return { label: s.title ?? ref, url: s.url };
}
