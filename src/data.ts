import p1Raw from "../data/phases/p1.json";
import geometryRaw from "../data/geometry/p1.json";
import sourcesRaw from "../data/sources.json";
import type { Geometry, PhaseData } from "./model/types";

export const p1 = p1Raw as unknown as PhaseData;
export const geometry = geometryRaw as unknown as Geometry;

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
