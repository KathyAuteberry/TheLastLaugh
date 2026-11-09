import { formatClock, parseClock } from "../model/timeline";
import type { Selection, VariationSpec } from "../model/types";

// Replay deep links: #replay?t=2:53.4&p1-tele-trouncing=confused:dps,fire:stack
// Only choices that differ from a mechanic's default are written; anything unknown in a link is ignored.

export interface ReplayLink { t?: number; selections: Record<string, Selection> }

export function parseReplayLink(hash: string, specs: Record<string, VariationSpec>): ReplayLink {
  const q = hash.split("?")[1];
  const out: ReplayLink = { selections: {} };
  if (!q) return out;
  for (const part of q.split("&")) {
    const [k, v = ""] = part.split("=").map((x) => decodeURIComponent(x));
    if (!k) continue;
    if (k === "t") { const t = parseClock(v); if (t !== undefined) out.t = t; continue; }
    const spec = specs[k];
    if (!spec) continue;
    const sel: Selection = {};
    for (const pair of v.split(",")) {
      const [g, o] = pair.split(":");
      if (spec.groups.some((x) => x.id === g && x.options.some((y) => y.id === o))) sel[g!] = o!;
    }
    if (Object.keys(sel).length) out.selections[k] = sel;
  }
  return out;
}

export function buildReplayLink(t: number, selections: Record<string, Selection>, specs: Record<string, VariationSpec>, defaults: Record<string, Selection>): string {
  const parts = [`t=${formatClock(Math.max(0, t))}`];
  for (const [id, sel] of Object.entries(selections)) {
    if (!specs[id]) continue;
    const diff = Object.entries(sel).filter(([g, o]) => defaults[id]?.[g] !== o).map(([g, o]) => `${g}:${o}`);
    if (diff.length) parts.push(`${id}=${diff.join(",")}`);
  }
  return `#replay?${parts.join("&")}`;
}
