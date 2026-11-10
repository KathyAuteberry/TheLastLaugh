import type { ForsakenDeal, ForsakenSpec, PlacedRole, Pt, Role, Scene, Selection, Shape, Spell } from "./types";
import { ROLES, roleKind } from "./types";

// Forsaken (P2) rules, Yan's method ① as Kitten ERP's Mana tab states it:
// - Fixed pairs MT+H1, OT+H2, D1+D3, D2+D4. The pairs holding a stack right after the cast are the "tower group":
//   they soak sets 1, 2, 3 and 8; the other pairs ("helpers") soak sets 4, 5, 6 and 7.
// - Odd sets: cone → bottom of the left tower, circle → bottom of the right tower, stacks on the top spots,
//   support stack left and DPS stack right; if both stacks are in one role group, its melee takes the other side.
// - Even sets: the support pair takes the left tower, the DPS pair the right; cone on the top spot, circle at the
//   bottom; if both supports hold the same spell, the melee of each pair swaps sides (tank right, melee DPS left).
//   Set 8 goes by the signs instead: bind 1 / ignore 1 left, bind 2 / ignore 2 right.
// - Helpers stand on fixed spots by role: odd sets tank by the left tower, healer below it (cone bait),
//   both DPS by the right tower; even sets tank at the boss's NW, melee DPS at its NE (Past/Future End baits),
//   healer west of the left tower and ranged DPS east of the right tower (cone baits).

export const PAIRS: [Role, Role][] = [["MT", "H1"], ["OT", "H2"], ["D1", "D3"], ["D2", "D4"]];
export const partner = (r: Role): Role => { const p = PAIRS.find((x) => x.includes(r))!; return p[0] === r ? p[1] : p[0]; };
export const isSupport = (r: Role) => roleKind(r) !== "dps";
export const isMelee = (r: Role) => roleKind(r) === "tank" || r === "D1" || r === "D2";
export const TOWER_SETS = [1, 2, 3, 8];
/** Each soak turns the towers 45°, the same way for the whole mechanic (Yan: 時計or反時計に45度ずれる; Kitten). */
export const TURN_DEG = 45;
export const HELPER_SETS = [4, 5, 6, 7];

/** The pairs that hold a stack right after the cast. */
export function towerGroup(deal: ForsakenDeal): Role[] {
  const stacks = ROLES.filter((r) => deal.sets[0]![r] === "stack");
  return ROLES.filter((r) => stacks.includes(r) || stacks.includes(partner(r)));
}

/** Who soaks set n (1-8). */
export function soakers(deal: ForsakenDeal, n: number): Role[] {
  const tg = towerGroup(deal);
  return TOWER_SETS.includes(n) ? tg : ROLES.filter((r) => !tg.includes(r));
}

/** The spell each player holds once set `after` has resolved (0 = right after the cast). Empty once you are done. */
export function held(deal: ForsakenDeal, after: number): Partial<Record<Role, Spell>> {
  const tg = towerGroup(deal);
  const out: Partial<Record<Role, Spell>> = {};
  for (const r of ROLES) {
    const next = (tg.includes(r) ? TOWER_SETS : HELPER_SETS).find((s) => s > after);
    if (next) out[r] = deal.sets[next - 1]![r];
  }
  return out;
}

const SIDE = { left: "left tower", right: "right tower" } as const;

/** Slot per role for set n, plus one line per role saying why. */
export function placeSet(deal: ForsakenDeal, n: number): { at: Record<Role, string>; why: Record<Role, string> } {
  const spells = deal.sets[n - 1]!;
  const soak = soakers(deal, n);
  const helpers = ROLES.filter((r) => !soak.includes(r));
  const at = {} as Record<Role, string>;
  const why = {} as Record<Role, string>;
  const odd = n % 2 === 1;
  if (odd) {
    const stacks = soak.filter((r) => spells[r] === "stack");
    for (const r of soak) {
      if (spells[r] === "cone") { at[r] = "left-bottom"; why[r] = "Cone: bottom of the left tower. Your cone fires at the nearest player, the healer just below you, so aim it outwards."; }
      if (spells[r] === "circle") { at[r] = "right-bottom"; why[r] = "Circle: bottom of the right tower, as far south as you can while still in the tower."; }
    }
    const [a, b] = stacks as [Role, Role];
    if (isSupport(a) !== isSupport(b)) {
      for (const r of stacks) { const left = isSupport(r); at[r] = left ? "left-top" : "right-top"; why[r] = `Stack: top of the ${left ? SIDE.left : SIDE.right} (support stack left, DPS stack right).`; }
    } else {
      const sup = isSupport(a);
      for (const r of stacks) {
        // Both stacks in one role group: the melee of the two moves to the other side.
        const left = sup ? !isMelee(r) : isMelee(r);
        at[r] = left ? "left-top" : "right-top";
        why[r] = `Stack: top of the ${left ? SIDE.left : SIDE.right}. Both stacks are ${sup ? "supports" : "DPS"}, so the ${sup ? "tank" : "melee DPS"} takes the ${sup ? "right" : "left"} instead.`;
      }
    }
    for (const r of helpers) {
      if (roleKind(r) === "tank") { at[r] = "helper-tank"; why[r] = "Not your set: stand by the left tower on the boss ring and share the left stack."; }
      else if (roleKind(r) === "healer") { at[r] = "helper-healer"; why[r] = "Not your set: stand just below the left tower and take the cone (healer is always the cone bait)."; }
      else { at[r] = "helper-dps"; why[r] = "Not your set: stand between the towers by the right tower and share the right stack."; }
    }
  } else if (n === 8) {
    const SLOT = { bind1: "left-top", bind2: "right-top", ignore1: "left-bottom", ignore2: "right-bottom" } as const;
    for (const r of soak) {
      const s = deal.signs[r]!;
      at[r] = SLOT[s];
      why[r] = `${s.startsWith("bind") ? "Cone" : "Circle"} with ${signLabel(s)}: ${s.endsWith("1") ? "left" : "right"} tower, ${s.startsWith("bind") ? "top" : "bottom"} spot. The signs decide, not the priority.`;
    }
  } else {
    const sup = soak.filter(isSupport);
    const swap = spells[sup[0]!] === spells[sup[1]!];
    for (const r of soak) {
      const left = isSupport(r) !== (swap && isMelee(r));
      const top = spells[r] === "cone";
      at[r] = `${left ? "left" : "right"}-${top ? "top" : "bottom"}`;
      const base = top
        ? `Cone: top of the ${left ? SIDE.left : SIDE.right}, where it meets the boss ring. You also take a Past's/Future's End bait.`
        : `Circle: bottom of the ${left ? SIDE.left : SIDE.right}, opposite the cone.`;
      why[r] = base + (swap && isMelee(r) ? ` Both supports hold ${spells[sup[0]!]}s, so the ${isSupport(r) ? "tank" : "melee DPS"} swaps to the ${left ? "left" : "right"}.` : swap ? " (Your melee partner swaps sides; you stay.)" : "");
    }
  }
  if (!odd) for (const r of helpers) {
    if (roleKind(r) === "tank") { at[r] = "helper-tank"; why[r] = "Not your set: boss's north-west edge. You bait a Past's/Future's End AoE."; }
    else if (roleKind(r) === "healer") { at[r] = "helper-healer"; why[r] = "Not your set: west of the left tower, 90° round the tower from its cone; bait that cone."; }
    else if (isMelee(r)) { at[r] = "helper-melee"; why[r] = "Not your set: boss's north-east edge. You bait a Past's/Future's End AoE."; }
    else { at[r] = "helper-ranged"; why[r] = "Not your set: east of the right tower, 90° round the tower from its cone; bait that cone."; }
  }
  return { at, why };
}

export const signLabel = (s: string) => `${s.startsWith("bind") ? "Bind" : "Ignore"} ${s.slice(-1)}`;

/**
 * Which tower set a Forsaken scene is drawn against: its own set; between sets, the next towers (already up);
 * a carry step stays on the towers its players just left.
 */
export function frameOf(scene: Scene): number {
  const f = scene.forsaken!;
  if (f.at === "set") return f.set;
  return scene.carry ? Math.max(1, f.after) : Math.min(8, f.after + 1);
}

/** How far set `frame` is turned from set 1 (map clockwise, degrees). Set 1 is drawn at south: no source fixes its true spot. */
export const turnDeg = (frame: number, sel: Selection) => (frame - 1) * TURN_DEG * (sel.turn === "ccw" ? -1 : 1);

const r3 = (v: number) => Math.round(v * 1000) / 1000;
/** Turn a point clockwise on the map (bearings grow clockwise; +y is north). */
export function rotate(p: Pt, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return [r3(p[0] * c + p[1] * s) || 0, r3(-p[0] * s + p[1] * c) || 0];
}

function rotateShape(s: Shape, deg: number): Shape {
  switch (s.type) {
    case "cone": return { ...s, origin: rotate(s.origin, deg), directionDeg: s.directionDeg + deg };
    case "halfroom": return { ...s, fromDeg: s.fromDeg + deg, toDeg: s.toDeg + deg };
    case "towers": case "circles": return { ...s, centres: s.centres.map((c) => rotate(c, deg)) };
    default: return s;
  }
}

/** The scene for the chosen deal: spots (set steps), spells over heads, signs and per-role lines, turned to its tower set. */
export function withForsaken(scene: Scene | undefined, sel: Selection, spec: ForsakenSpec | undefined): Scene | undefined {
  const f = scene?.forsaken;
  if (!scene || !f || !spec) return scene;
  const deal = spec.deals[sel.deal ?? ""] ?? Object.values(spec.deals)[0]!;
  const tg = towerGroup(deal);
  const after = f.at === "set" ? f.set - 1 : f.after;
  const holding = held(deal, after);
  const spells: NonNullable<Scene["spells"]> = {};
  const resolving = f.at === "set" ? soakers(deal, f.set) : [];
  for (const r of ROLES) if (holding[r]) spells[r] = { spell: holding[r]!, resolving: resolving.includes(r) };
  const signs = after >= 3 && after < 8 ? deal.signs : undefined;
  const group = (r: Role) => (tg.includes(r) ? "tower group: sets 1, 2, 3 and 8" : "helpers: sets 4, 5, 6 and 7");
  let out: Scene;
  if (f.at === "held") {
    const roleText: NonNullable<Scene["roleText"]> = {};
    for (const r of ROLES) roleText[r] = holding[r]
      ? `You hold a ${holding[r]}${signs?.[r] ? ` and wear ${signLabel(signs[r]!)}` : ""}; your pair is in the ${group(r)}.`
      : "No spells left.";
    out = { ...scene, spells, signs, roleText };
  } else {
    const layout = f.set % 2 === 1 ? spec.slots.odd : spec.slots.even;
    const place = placeSet(deal, f.set);
    const positions: Partial<Record<Role, PlacedRole>> = {};
    for (const r of ROLES) positions[r] = { ...layout[place.at[r]]!, note: place.why[r] };
    out = { ...scene, positions, spells, signs, roleText: place.why };
  }
  return scene.relative ? turned(out, sel) : out;
}

/** Turn a towers-as-south scene to its tower set, and add the last set's towers (dashed). */
function turned(scene: Scene, sel: Selection): Scene {
  const frame = frameOf(scene);
  const deg = turnDeg(frame, sel);
  const positions: Partial<Record<Role, PlacedRole>> = {};
  for (const [r, p] of Object.entries(scene.positions ?? {}) as [Role, PlacedRole][]) positions[r] = { ...p, at: rotate(p.at, deg) };
  const shapes = (scene.shapes ?? []).map((s) => rotateShape(s, deg));
  const towers = scene.shapes?.find((s) => s.type === "towers");
  const extra: Shape[] = [];
  if (towers?.type === "towers" && frame > 1)
    extra.push({ type: "towers", kind: "ghost", radius: towers.radius, centres: towers.centres.map((c) => rotate(c, turnDeg(frame - 1, sel))), label: `Dashed: set ${frame - 1}'s towers, to show the turn` });
  const dir = sel.turn === "ccw" ? "anticlockwise" : "clockwise";
  const what = scene.forsaken!.at === "set" || scene.carry ? `set ${frame}` : `next towers (set ${frame})`;
  const frameLabel = frame === 1 ? `${what} · drawn at south` : `${what} · ${(frame - 1) * TURN_DEG}° ${dir} from set 1`;
  return { ...scene, positions: scene.positions ? positions : undefined, shapes: [...extra, ...shapes], frameLabel };
}
