import type { ArrowDir, Pt, Role, Scene, Selection, Shape } from "./types";
import { matches } from "./variants";
import type { TimedStep } from "./timeline";

// Tele-trouncing arrows. Each player gets two arrow debuffs (a short and a long timer); when one runs out,
// the arrow drops where the player stands. Players stand on the tile cell that shows that arrow in Yan's
// layout (yan-p1-17). Cell spots come from the measured tile frames; nothing here adds coordinates.

type Tiles = Extract<Shape, { type: "tiles" }>;
export type TileFrame = Tiles["frames"][number];

/** The two cell centres of a tile frame, in the order its `arrows` list them (top→bottom or left→right). */
export function tileCells(f: TileFrame): [Pt, Pt] {
  const [x0, y0, x1, y1] = f.rect;
  const w = Math.abs(x1 - x0), h = Math.abs(y0 - y1), t = Math.min(w, h);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
  return w > h ? [[x0 + t / 2, my], [x1 - t / 2, my]] : [[mx, y0 - t / 2], [mx, y1 + t / 2]];
}

/** One dropped arrow: tile frame and cell, who dropped it, which of their two arrows (0 = short timer), and at which step. */
export interface ArrowDrop { frame: number; cell: number; role: Role; index: 0 | 1; step: string }
/** Computed per step (never stored): each role's arrow pair (short timer first) and the arrows on the ground so far. */
export interface ArrowState {
  pairs: Partial<Record<Role, [ArrowDir, ArrowDir]>>;
  drops: ArrowDrop[];
  /** Arrows used up by a confused player's teleport (the cell goes dark again), and at which step. */
  taken?: { frame: number; cell: number; role: Role; step: string }[];
  /** Teleports so far: who jumped from where to where, and at which step. */
  hops?: { role: Role; from: Pt; to: Pt; step: string }[];
}

export const tilesOf = (scene: Scene | undefined): Tiles | undefined =>
  scene?.shapes?.find((s): s is Tiles => s.type === "tiles");

/** For each role: the frame whose arrows match its pair, and the cell for its short- and long-timer arrow. */
export function arrowPlan(scene: Scene, sel: Selection): Partial<Record<Role, { frame: number; cells: [number, number]; pair: [ArrowDir, ArrowDir] }>> {
  const tiles = tilesOf(scene);
  const pairs = scene.arrowDrops?.assign.find((a) => matches(a.when, sel))?.pairs ?? {};
  const out: ReturnType<typeof arrowPlan> = {};
  if (!tiles) return out;
  for (const [r, pair] of Object.entries(pairs) as [Role, [ArrowDir, ArrowDir]][]) {
    const key = [...pair].sort().join();
    const frame = tiles.frames.findIndex((f) => [...f.arrows].sort().join() === key);
    if (frame < 0) continue;
    const arrows = tiles.frames[frame]!.arrows;
    const first = arrows.indexOf(pair[0]);
    // Same arrow twice: either cell order works (Azurite video); the listed order is used.
    const second = pair[0] === pair[1] ? 1 - first : arrows.indexOf(pair[1]);
    out[r] = { frame, cells: [first, second], pair };
  }
  return out;
}

/** Every arrow cell of the tiles: frame, cell, centre and the arrow it holds. */
export function allCells(tiles: Tiles): { frame: number; cell: number; at: Pt; dir: ArrowDir }[] {
  return tiles.frames.flatMap((f, frame) => tileCells(f).map((at, cell) => ({ frame, cell, at, dir: f.arrows[cell]! })));
}

/** Arrow radius: BossMod Reborn draws each dropped arrow as a 2 y circle (arena radius 20 y = 1). */
export const ARROW_RADIUS = 0.1;
const DIR_VEC: Record<ArrowDir, Pt> = { up: [0, 1], down: [0, -1], left: [-1, 0], right: [1, 0] };

function segDist(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = dx * dx + dy * dy || 1;
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L));
  return Math.hypot(a[0] + u * dx - p[0], a[1] + u * dy - p[1]);
}

/** Teleport length: every arrow warp lands 6 y (arena radius 20 y = 1) from the arrow's centre, in its direction
 * (owner's RaidTrace: 31 of 31 warps at 5.97–6.03 y, sideways ≤ 0.03 y, wherever the player entered; D-P1-08). */
export const TELEPORT_JUMP = 0.3;

/**
 * A confused player's teleports. They walk from `from` at their quadrant partner `partner`; the first arrow on
 * that line is where they step in. Each arrow warps them TELEPORT_JUMP from its centre in its direction. When the
 * landing is within ARROW_RADIUS of an arrow not used yet, that arrow warps them on (after about 1 s of Bind);
 * otherwise the ride ends there. Returns the cells used and the spots: spots[0] = the first arrow, spots[k] = where
 * teleport k lands.
 */
export function teleportChain(tiles: Tiles, from: Pt, partner: Pt, hops: number) {
  const cells = allCells(tiles);
  const first = cells.map((c) => ({ c, d: segDist(c.at, from, partner) })).sort((a, b) => a.d - b.d)[0];
  if (!first || first.d > ARROW_RADIUS) return undefined;
  const used = [first.c];
  const spots: Pt[] = [first.c.at];
  for (let k = 0; k < hops; k++) {
    const cur = used[k]!;
    const v = DIR_VEC[cur.dir];
    const land: Pt = [cur.at[0] + v[0] * TELEPORT_JUMP, cur.at[1] + v[1] * TELEPORT_JUMP];
    spots.push(land);
    const next = cells
      .filter((c) => !used.includes(c))
      .map((c) => ({ c, d: Math.hypot(c.at[0] - land[0], c.at[1] - land[1]) }))
      .filter((x) => x.d <= ARROW_RADIUS)
      .sort((a, b) => a.d - b.d)[0];
    if (!next || k === hops - 1) break; // off the arrows (or out of steps): the ride ends here
    used.push(next.c);
  }
  return { cells: used, spots };
}

/**
 * Tele-trouncing arrows as of `now`: an arrow is on the ground once its step has resolved, and the debuffs show
 * on the players from the first arrow step (when the debuffs go out) until each arrow drops.
 */
export function arrowsAt(tl: TimedStep[], cur: TimedStep, now: number): ArrowState | undefined {
  const as = cur.step.scene?.arrowState;
  if (!as) return undefined;
  const at = new Map(tl.map((s) => [s.step.key, s.at]));
  const first = tl.find((s) => s.step.scene?.arrowState);
  const dealt = now >= (first?.at ?? 0); // the first arrow step is the moment the debuffs go out
  const done = (step: string) => (at.get(step) ?? Infinity) <= now;
  const drops = as.drops.filter((d) => done(d.step));
  // Before the debuffs go out nobody has arrows yet: hide pairs so no chips are drawn.
  return { pairs: dealt ? as.pairs : {}, drops, taken: as.taken?.filter((x) => done(x.step)), hops: as.hops?.filter((x) => done(x.step)) };
}
