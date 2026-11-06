import type { Geometry, Mechanic, PlacedRole, Pt, Role, RoleSel, Scene, Selection, State } from "./types";
import { ROLES } from "./types";
import { allSelections, defaultSelection, matches, resolveScene, variationsFor } from "./variants";
import { arrowPlan, teleportChain, tileCells, tilesOf, type ArrowState } from "./arrows";

/** One step of a mechanic as the viewer sees it: the text state plus (if measured) its scene. */
export interface Step {
  mechanic: Mechanic;
  state: State;
  scene: Scene | undefined;
  key: string;
  /** Sub-label when this step is an intermediate frame of a state. */
  frame?: string;
  /** The variation this step was built for. */
  sel: Selection;
}

/**
 * Build the ordered steps for a mechanic given the chosen variation (one option per group).
 * States without a branch are always included; branched states only when their branch matches the selection.
 * Scenes are resolved for the selection (variant shapes, dodge). Feeds the guide and the replay.
 */
export function buildSteps(m: Mechanic, geometry: Geometry, sel: Selection): Step[] {
  const spec = variationsFor(m, geometry);
  return m.states
    .filter((s) => !s.branch || matches(spec.branches[s.branch] ?? { _missing: s.branch }, sel))
    .flatMap((s) => {
      const key = `${m.id}/${s.id}`;
      const raw = geometry.scenes[key];
      const scene = resolveScene(raw, sel);
      const frames: Step[] = (raw?.frames ?? []).map((f, i) => ({
        mechanic: m, state: s, key: `${key}#${i}`, frame: f.label, sel,
        scene: withTeleports(withArrows(resolveScene({ ...raw!, frames: undefined, debuff: f.debuff ?? raw!.debuff, positions: { ...raw!.positions, ...f.positions } }, sel), sel, (i - 1) as -1 | 0, key), sel, i, key, geometry),
      }));
      return [...frames, { mechanic: m, state: s, scene: withTeleports(withArrows(scene, sel, 1, key), sel, frames.length, key, geometry), key, sel }];
    });
}

/**
 * Tele-trouncing arrows. The scene has two frames (validator): at `stage` -1 the debuffs go out and nobody is placed
 * (they keep their spots via `carry`); at stage 0 roles stand on their short-timer arrow's cell, at stage 1 (the scene
 * itself) on the long-timer one. Arrows dropped so far go into `arrowState`. Scenes without `arrowDrops` are unchanged.
 */
function withArrows(scene: Scene | undefined, sel: Selection, stage: -1 | 0 | 1, key: string): Scene | undefined {
  const ad = scene?.arrowDrops;
  const tiles = tilesOf(scene);
  if (!scene || !ad || !tiles) return scene;
  const plan = arrowPlan(scene, sel);
  const positions = { ...scene.positions };
  const state: ArrowState = { pairs: {}, drops: [] };
  for (const [r, p] of Object.entries(plan) as [Role, NonNullable<(typeof plan)[Role]>][]) {
    state.pairs[r] = p.pair;
    const cells = tileCells(tiles.frames[p.frame]!);
    if (stage >= 0) positions[r] = { at: round(cells[p.cells[stage as 0 | 1]]!), method: "derived", note: ad.note };
    // The short-timer arrows drop at the scene's second frame (`key#1`), the long-timer ones at the scene itself.
    for (let i = 0; i <= stage; i++) state.drops.push({ frame: p.frame, cell: p.cells[i]!, role: r, index: i as 0 | 1, step: i === 0 ? `${key}#1` : key });
  }
  return { ...scene, positions, arrowState: state };
}

/**
 * Tele-trouncing confusion. At `stage` 0 (the first frame) each confused role stands on the first arrow on its way to
 * its quadrant partner; at stage k it has been teleported k times. The arrows used and the jumps so far go into
 * `arrowState` (taken, hops); buildPull adds the arrows already on the ground. Scenes without `teleports` are unchanged.
 */
function withTeleports(scene: Scene | undefined, sel: Selection, stage: number, key: string, geometry: Geometry): Scene | undefined {
  const tp = scene?.teleports;
  const tiles = tilesOf(scene);
  if (!scene || !tp || !tiles) return scene;
  const from = geometry.scenes[tp.from]?.positions ?? {};
  const positions = { ...scene.positions };
  const state: ArrowState = { pairs: {}, drops: [], taken: [], hops: [] };
  const step = (k: number) => (k < tp.hops ? `${key}#${k}` : key);
  for (const r of rolesFor(tp.confused, sel)) {
    const p = from[r]?.at;
    if (!p) continue;
    // Partner: the other player in the same quadrant (owner). By raw distance in Yan's picture some inner players
    // are about as close to each other, so the quadrant decides.
    const quad = (q: Pt) => `${Math.sign(q[0])}${Math.sign(q[1])}`;
    const partner = (Object.entries(from) as [Role, PlacedRole][])
      .filter(([q, x]) => q !== r && quad(x.at) === quad(p)).map(([, x]) => x.at).sort((a, b) => len(sub(a, p)) - len(sub(b, p)))[0];
    const chain = partner && teleportChain(tiles, p, partner, tp.hops);
    if (!chain) continue;
    const k = Math.min(stage, chain.spots.length - 1);
    positions[r] = { at: round(chain.spots[k]!), method: "derived", note: tp.note };
    for (let j = 1; j <= k; j++) {
      const c = chain.cells[j - 1]!;
      state.taken!.push({ frame: c.frame, cell: c.cell, role: r, step: step(j) });
      state.hops!.push({ role: r, from: round(chain.spots[j - 1]!), to: round(chain.spots[j]!), step: step(j) });
    }
  }
  return { ...scene, positions, arrowState: state };
}

/** The roles a RoleSel names for this selection. */
export function rolesFor(rs: RoleSel, sel: Selection): Role[] {
  return rs.flatMap((x) => (typeof x === "string" ? [x] : matches(x.when, sel) ? x.roles : []));
}

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const len = (a: Pt) => Math.hypot(a[0], a[1]);
const round = (p: Pt): Pt => [Math.round(p[0] * 1000) / 1000, Math.round(p[1] * 1000) / 1000];

/** Where to stand so a push of `distance` straight away from `from` lands on `target` (or as close as `minGap` allows). */
export function preKnockSpot(target: Pt, from: Pt, distance: number, minGap: number): Pt {
  const d = sub(target, from);
  const D = len(d) || 1;
  const along = Math.max(minGap, D - distance);
  return round([from[0] + (d[0] / D) * along, from[1] + (d[1] / D) * along]);
}

/** Where a push of `distance` straight away from `from` lands someone standing at `p` (kept inside the arena). */
export function knockLanding(p: Pt, from: Pt, distance: number, rim = 0.95): Pt {
  const d = sub(p, from);
  const D = len(d) || 1;
  let q: Pt = [p[0] + (d[0] / D) * distance, p[1] + (d[1] / D) * distance];
  const r = len(q);
  if (r > rim) q = [(q[0] / r) * rim, (q[1] / r) * rim];
  return round(q);
}

function selectionsFor(mechanics: Mechanic[], geometry: Geometry, selections: Record<string, Selection>) {
  return Object.fromEntries(mechanics.map((m) => [m.id, selections[m.id] ?? defaultSelection(variationsFor(m, geometry))]));
}

/** Resolved steps plus pre-knockback spots: everything that depends only on this one selection. */
function buildCore(mechanics: Mechanic[], geometry: Geometry, sels: Record<string, Selection>): Step[] {
  const steps = [...mechanics].sort((a, b) => a.order - b.order).flatMap((m) => buildSteps(m, geometry, sels[m.id]!));
  return steps.map((st, i) => {
    const kp = st.scene?.knockbackPrep;
    if (!kp) return st;
    const next = steps.slice(i + 1).find((x) => x.scene?.positions && Object.keys(x.scene.positions).length)?.scene?.positions ?? {};
    const knocked = rolesFor(kp.roles, st.sel);
    const positions: Partial<Record<Role, PlacedRole>> = {};
    for (const r of ROLES) {
      const t = next[r];
      if (!t) continue;
      positions[r] = knocked.includes(r)
        ? { at: preKnockSpot(t.at, kp.from, kp.distance, kp.minGap), method: "derived", note: kp.note }
        : { at: t.at, method: "derived", note: "Goes straight to the next spot (not knocked back)." };
    }
    return { ...st, scene: { ...st.scene!, positions } };
  });
}

/**
 * Average spot of each role in the first of `target` steps, over every combination of the options of `groups`
 * (the other choices stay as selected). Used for "halfway between where I might have to go".
 */
export function hedgeSpots(mechanics: Mechanic[], geometry: Geometry, selections: Record<string, Selection>, target: string[], groups: string[]): Partial<Record<Role, Pt>> {
  const tm = mechanics.find((m) => target.some((k) => k.startsWith(m.id + "/")));
  if (!tm) return {};
  const sels = selectionsFor(mechanics, geometry, selections);
  const spec = variationsFor(tm, geometry);
  const subSpec = { groups: spec.groups.filter((g) => groups.includes(g.id)), branches: {} };
  const sums: Partial<Record<Role, { x: number; y: number; n: number }>> = {};
  for (const combo of allSelections(subSpec)) {
    const core = buildCore(mechanics, geometry, { ...sels, [tm.id]: { ...sels[tm.id], ...combo } });
    const ps = core.find((s) => target.includes(s.key))?.scene?.positions ?? {};
    for (const [r, p] of Object.entries(ps) as [Role, PlacedRole][]) {
      const s = (sums[r] ??= { x: 0, y: 0, n: 0 });
      s.x += p.at[0]; s.y += p.at[1]; s.n++;
    }
  }
  return Object.fromEntries(Object.entries(sums).map(([r, s]) => [r, round([s!.x / s!.n, s!.y / s!.n])]));
}

/**
 * The whole pull in order: every mechanic's steps for its chosen variation (default when not chosen).
 * Fills in, in order: pre-knockback spots, hedged spots (`hedge`), then carried spots (`carry`: each role a
 * scene does not place stays where the previous step left it; no source moves it).
 */
export function buildPull(mechanics: Mechanic[], geometry: Geometry, selections: Record<string, Selection> = {}): Step[] {
  const sels = selectionsFor(mechanics, geometry, selections);
  const steps = buildCore(mechanics, geometry, sels).map((st) => {
    const h = st.scene?.hedge;
    if (!h) return st;
    const spots = hedgeSpots(mechanics, geometry, sels, h.target, h.groups);
    const positions = { ...st.scene!.positions };
    for (const r of ROLES) if (!positions[r] && spots[r]) positions[r] = { at: spots[r]!, method: "derived", note: h.note };
    return { ...st, scene: { ...st.scene!, positions } };
  });
  let last: Partial<Record<Role, PlacedRole>> = {};
  let arrows: ArrowState | undefined;
  return steps.map((st) => {
    const sc = st.scene;
    if (!sc) return st;
    let scene = sc;
    // Arrows stay on the ground for later steps that still draw the tiles.
    // A confusion scene adds the arrows used up so far to the arrows already dropped.
    if (sc.arrowState && !sc.teleports) arrows = sc.arrowState;
    else if (arrows && tilesOf(sc)) {
      const merged = sc.arrowState ? { ...arrows, taken: sc.arrowState.taken, hops: sc.arrowState.hops } : arrows;
      scene = { ...scene, arrowState: merged };
      if (sc.teleports) arrows = merged;
    }
    if (sc.carry) {
      const positions = { ...sc.positions };
      for (const r of ROLES) {
        const prev = last[r];
        if (positions[r] || !prev) continue;
        positions[r] = { at: prev.at, method: "carried", note: sc.unplaced?.[r] ?? sc.carry.note };
      }
      scene = { ...scene, positions };
    }
    last = { ...last };
    for (const [r, p] of Object.entries(scene.positions ?? {}) as [Role, PlacedRole][]) last[r] = p;
    return scene === sc ? st : { ...st, scene };
  });
}

/** One mechanic's steps as they sit in the pull (carried spots come from the mechanics before it). */
export function stepsInPull(m: Mechanic, mechanics: Mechanic[], geometry: Geometry, sel: Selection): Step[] {
  return buildPull(mechanics, geometry, { [m.id]: sel }).filter((s) => s.mechanic.id === m.id);
}
