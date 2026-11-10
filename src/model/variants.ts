import type { Geometry, Mechanic, PlacedRole, Pt, Role, Scene, Selection, Shape, VariationSpec } from "./types";

/** Variation groups for a mechanic. Without an explicit spec, the text branches form one group. */
export function variationsFor(m: Mechanic, geometry: Geometry): VariationSpec {
  const spec = geometry.variations?.[m.id];
  if (spec) return spec;
  const branches = m.branches ?? [];
  if (!branches.length) return { groups: [], branches: {} };
  return {
    groups: [{ id: "variant", label: "Variation", options: branches.map((b) => ({ id: b.id, label: b.label })) }],
    branches: Object.fromEntries(branches.map((b) => [b.id, { variant: b.id }])),
  };
}

export const defaultSelection = (spec: VariationSpec): Selection =>
  Object.fromEntries(spec.groups.map((g) => [g.id, g.options[0]!.id]));

export const matches = (when: Selection | undefined, sel: Selection) =>
  !when || Object.entries(when).every(([k, v]) => sel[k] === v);

/** Every combination of the given groups (for exports and tests). */
export function allSelections(spec: VariationSpec): Selection[] {
  return spec.groups.reduce<Selection[]>((acc, g) => acc.flatMap((s) => g.options.map((o) => ({ ...s, [g.id]: o.id }))), [{}]);
}

// ---------- dodge solver ----------
const K = Math.SQRT1_2;
const QSIGN: Record<string, [number, number]> = { NE: [1, 1], SE: [1, -1], SW: [-1, -1], NW: [-1, 1] };

/** Signed distance to each drawn danger area: negative inside. Only quadrants and bands take part. */
function regions(shapes: Shape[]): ((p: Pt) => number)[] {
  const out: ((p: Pt) => number)[] = [];
  for (const s of shapes) {
    if (s.kind !== "danger") continue;
    if (s.type === "quadrants") for (const q of s.quadrants) {
      const [sx, sy] = QSIGN[q]!;
      out.push(([x, y]) => (sx * x > 0 && sy * y > 0 ? -Math.min(sx * x, sy * y) : Math.hypot(Math.max(0, -sx * x), Math.max(0, -sy * y))));
    }
    if (s.type === "bands") {
      const [nx, ny] = s.axis === "nwse" ? [K, K] : [-K, K];
      for (const [a, b] of s.ranges) out.push(([x, y]) => { const u = x * nx + y * ny; return u > a && u < b ? -Math.min(u - a, b - u) : Math.min(Math.abs(u - a), Math.abs(u - b)); });
    }
  }
  return out;
}

export function clearance(shapes: Shape[], p: Pt): number {
  const rs = regions(shapes);
  return rs.length ? Math.min(...rs.map((f) => f(p))) : Infinity;
}

interface Limits { keepSide: boolean; maxRadius: number }

/** Nearest point to `base` with clearance ≥ margin, inside the arena (or `maxRadius`), within maxShift. */
function nearestSafe(rs: ((p: Pt) => number)[], base: Pt, d: NonNullable<Scene["dodge"]>, lim: Limits): Pt | null {
  const ok = (p: Pt) => rs.every((f) => f(p) >= d.margin);
  if (ok(base)) return base;
  const side = lim.keepSide && Math.abs(base[0]) > 0.05 ? Math.sign(base[0]) : 0;
  let best: Pt | null = null, bestD = Infinity;
  const step = 0.01;
  for (let dx = -d.maxShift; dx <= d.maxShift; dx += step)
    for (let dy = -d.maxShift; dy <= d.maxShift; dy += step) {
      const dist = Math.hypot(dx, dy);
      if (dist > d.maxShift || dist >= bestD) continue;
      const p: Pt = [base[0] + dx, base[1] + dy];
      if (Math.hypot(p[0], p[1]) > lim.maxRadius) continue;
      if (side && Math.sign(p[0]) !== side) continue;
      if (ok(p)) { best = p; bestD = dist; }
    }
  return best && [Math.round(best[0] * 1000) / 1000, Math.round(best[1] * 1000) / 1000];
}

/** The scene as it looks for one selection: matching shapes only, roles moved out of danger if the scene asks for it. */
export function resolveScene(scene: Scene | undefined, sel: Selection): Scene | undefined {
  if (!scene) return scene;
  const shapes = scene.shapes?.filter((s) => matches(s.when, sel));
  const vp = scene.variantPositions?.filter((v) => matches(v.when, sel)).reduce((acc, v) => ({ ...acc, ...v.positions }), {} as Scene["positions"]);
  const out: Scene = { ...scene, shapes, ...(vp && Object.keys(vp).length ? { positions: { ...scene.positions, ...vp } } : {}) };
  const d = scene.dodge;
  if (!d || !out.positions) return out;
  const rs = regions(shapes ?? []);
  if (!rs.length) return out;
  const positions: Partial<Record<Role, PlacedRole>> = {};
  const unplaced: Partial<Record<Role, string>> = { ...scene.unplaced };
  for (const [r, p] of Object.entries(out.positions) as [Role, PlacedRole][]) {
    // A role with two candidate spots takes whichever needs the smaller move; the other is not shown.
    // Melee roles (if the scene says so) stay within reach of the boss instead of keeping their side;
    // if that is impossible they fall back to the general rule.
    const melee = d.melee?.roles.includes(r);
    const general: Limits = { keepSide: !!d.keepSide, maxRadius: 0.96 };
    const solve = (c: Pt) => (melee ? nearestSafe(rs, c, d, { keepSide: false, maxRadius: d.melee!.maxRadius }) : null) ?? nearestSafe(rs, c, d, general);
    const options = [p.at, ...(p.alt ? [p.alt] : [])]
      .map((c) => ({ c, to: solve(c) }))
      .filter((o): o is { c: Pt; to: Pt } => !!o.to)
      .sort((a, b) => Math.hypot(a.to[0] - a.c[0], a.to[1] - a.c[1]) - Math.hypot(b.to[0] - b.c[0], b.to[1] - b.c[1]));
    const pick = options[0];
    if (!pick) { unplaced[r] = "No safe spot within reach of the drawn position for this variation; not drawn."; continue; }
    const moved = pick.to !== pick.c;
    positions[r] = { ...p, alt: undefined, at: pick.to, method: moved ? "derived" : p.method,
      note: moved ? "Moved to the nearest safe spot (derived from the drawn AoEs, not from a source)." : p.note };
  }
  return { ...out, positions, unplaced: Object.keys(unplaced).length ? unplaced : undefined };
}
