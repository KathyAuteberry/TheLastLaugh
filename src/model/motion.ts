import type { Geometry, Mechanic, Pt, Role, Selection } from "./types";
import { ROLES } from "./types";
import { hedgeSpots, knockLanding, rolesFor } from "./sequence";
import { timeline, type TimedStep } from "./timeline";

// Replay movement. Spots always come from the steps (Yan, or derived/carried as labelled there);
// this only decides WHEN each role walks between them. See data/timeline/p1.json "motion".

export interface Segment { t0: number; t1: number; p0: Pt; p1: Pt; kind: "walk" | "knock" | "teleport" }
export interface Late { role: Role; key: string; arrives: number; due: number }
export interface Motion { segments: Partial<Record<Role, Segment[]>>; start: Partial<Record<Role, Pt>>; late: Late[] }

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function buildMotion(tl: TimedStep[], mechanics: Mechanic[], geometry: Geometry, selections: Record<string, Selection> = {}): Motion {
  const { start: t0, reaction: R, runSpeed: v, knockbackSeconds: kbT, knockbackDelay: kbD = 0 } = timeline.motion;
  const first = tl[0]?.step.scene?.positions ?? {};
  const motion: Motion = { segments: {}, start: {}, late: [] };
  // Hedge spots are the same for every role of a step; compute once per step.
  const hedgeCache = new Map<string, Partial<Record<Role, Pt>>>();
  const hedge = (st: TimedStep, i: number) => {
    const id = `${st.step.key}#${i}`;
    if (!hedgeCache.has(id)) {
      const h = st.timing.hedges![i]!;
      hedgeCache.set(id, hedgeSpots(mechanics, geometry, { ...selections, [st.mechanic.id]: st.step.sel }, h.target ?? [st.step.key], h.groups));
    }
    return hedgeCache.get(id)!;
  };

  for (const r of ROLES) {
    let pos = first[r]?.at;
    if (!pos) continue;
    motion.start[r] = pos;
    const segs: Segment[] = [];
    let cursor = t0;
    const walk = (to: Pt, from: number) => {
      if (dist(pos!, to) < 1e-6) return;
      const s = Math.max(cursor, from);
      const e = s + dist(pos!, to) / v;
      segs.push({ t0: s, t1: e, p0: pos!, p1: to, kind: "walk" });
      pos = to; cursor = e;
    };
    tl.forEach((st, k) => {
      if (k === 0) return;
      const target = st.step.scene?.positions?.[r]?.at;
      if (!target) return;
      const prev = tl[k - 1]!;
      const e = st.timing;
      const kb = e.knockback;
      const holders = prev.step.scene?.debuff ?? [];
      const knocked = kb && (kb.roles === "all-but-holders" ? !holders.includes(r) : rolesFor(kb.roles, st.step.sel).includes(r));
      if (e.teleport) {
        // A teleport: the role stays put until the step resolves, then is at the new spot at once.
        if (dist(pos!, target) > 1e-6) {
          const s = Math.max(cursor, st.at);
          segs.push({ t0: s, t1: s + 0.05, p0: pos!, p1: target, kind: "teleport" });
          pos = target; cursor = s + 0.05;
        }
      } else if (kb && knocked) {
        let from: Pt | undefined = kb.from === "nearest-holder" ? undefined : kb.from;
        if (!from) {
          const hs = holders.map((h) => prev.step.scene?.positions?.[h]?.at).filter((x): x is Pt => !!x);
          from = hs.sort((a, b) => dist(a, pos!) - dist(b, pos!))[0];
        }
        if (from) {
          const land = knockLanding(pos!, from, kb.distance);
          const s = Math.max(cursor, prev.at + kbD);
          segs.push({ t0: s, t1: s + kbT, p0: pos!, p1: land, kind: "knock" });
          pos = land; cursor = s + kbT;
        }
        walk(target, cursor + R);
      } else {
        (e.hedges ?? []).forEach((h, i) => {
          if (h.roles && !rolesFor(h.roles, st.step.sel).includes(r)) return;
          const spot = hedge(st, i)[r];
          if (spot) walk(spot, h.t + R);
        });
        const cue = e.cue && (!e.cue.roles || rolesFor(e.cue.roles, st.step.sel).includes(r)) ? e.cue : undefined;
        walk(target, cue ? cue.t + (cue.react === false ? 0 : R) : prev.at + R);
      }
      if (!st.approx && cursor > st.at + 0.05) motion.late.push({ role: r, key: st.step.key, arrives: Math.round(cursor * 10) / 10, due: st.at });
    });
    motion.segments[r] = segs;
  }
  return motion;
}

/** Where each role is at time `t`. */
export function positionsAt(m: Motion, t: number): Partial<Record<Role, Pt>> {
  const out: Partial<Record<Role, Pt>> = {};
  for (const r of ROLES) {
    let p = m.start[r];
    if (!p) continue;
    for (const s of m.segments[r] ?? []) {
      if (t < s.t0) break;
      if (t >= s.t1) { p = s.p1; continue; }
      const f = (t - s.t0) / (s.t1 - s.t0);
      p = [s.p0[0] + (s.p1[0] - s.p0[0]) * f, s.p0[1] + (s.p1[1] - s.p0[1]) * f];
      break;
    }
    out[r] = p;
  }
  return out;
}

/** The early-move notes active at `t` (a hedge or cue whose move is under way), for the replay's status line. */
export function cuesAt(tl: TimedStep[], t: number, reaction = timeline.motion.reaction): string[] {
  const out: string[] = [];
  for (const st of tl) {
    for (const h of st.timing.hedges ?? []) if (t >= h.t && t < st.at) out.push(h.what);
    const c = st.timing.cue;
    if (c && t >= c.t && t < st.at) out.push(c.what);
    if (st.from - reaction > t) break;
  }
  return [...new Set(out)];
}
