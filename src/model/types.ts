// Types mirroring the JSON data. The JSON is validated by scripts/validate.mjs; these types
// only describe what the app reads.

export type Role = "MT" | "OT" | "H1" | "H2" | "D1" | "D2" | "D3" | "D4";
export const ROLES: Role[] = ["MT", "OT", "H1", "H2", "D1", "D2", "D3", "D4"];
export type RoleKind = "tank" | "healer" | "dps";
export const roleKind = (r: Role): RoleKind => (r[0] === "D" ? "dps" : r[0] === "H" ? "healer" : "tank");

export type Status = "verified" | "source-stated" | "derived" | "derived-from-image" | "unverified";
export interface SourceRef { ref: string; quoteJa?: string; at?: string }
export interface Claim<T> { value: T | null; status: Status; sources: SourceRef[]; note?: string }
export interface RoleClaim extends Claim<string> { notInvolved?: true }

export interface Position { kind: string; anchor: string; description: string; candidates?: string[] }
export interface Hazard { type: string; description: string; geometry?: { angleDeg?: number; hits?: number } }

export interface State {
  id: string;
  label: string;
  branch?: string;
  trigger: Claim<string>;
  images?: string[];
  positions: Partial<Record<Role, Claim<Position>>>;
  hazards: Claim<Hazard>[];
  objects?: Claim<Hazard>[];
  /** What to do in this step, in order (shown under the step title). */
  actions?: Claim<string>[];
}

export interface Branch { id: string; label: string; condition: Claim<string> }

export interface Mechanic {
  id: string;
  phase: number;
  order: number;
  instance?: number;
  occursWithin?: string;
  names: { ja: string; en: Claim<string> };
  whatHappens: Claim<string>;
  recognition: Claim<string>[];
  branches?: Branch[];
  roles: Record<Role, RoleClaim>;
  states: State[];
  resolutionOrder: Claim<string>[];
  whyItWorks: Claim<string>;
  commonMistakes: { mistake: string; consequence: string; claim: Claim<string> }[];
  ownerVerification: { state: "unreviewed" | "approved" | "rejected" | "unsure"; date?: string };
}

export interface PhaseData { phase: number; names: { ja: string; en: Claim<string> }; notes: Claim<string>[]; mechanics: Mechanic[] }

// ---------- geometry ----------
export type Pt = [number, number];
/**
 * How a spot was obtained. Stored in data: "auto" (measured), "eye" (read by eye), "copy" (copied from another
 * diagram), "loose" (a loose area given in text, e.g. "spread in the south half"; the exact dot is illustrative).
 * Computed at render time only, never stored: "derived" (dodge solver, variants.ts) and "carried"
 * (no source moves this role here, so it stays where the previous step left it; sequence.ts).
 */
export interface PlacedRole { at: Pt; method: "auto" | "eye" | "copy" | "loose" | "derived" | "carried"; group?: string; note?: string; alt?: Pt }
/** A chosen option per variation group, e.g. { fire: "spread", ice: "lie", thunder: "true" }. */
export type Selection = Record<string, string>;
export type ArrowDir = "up" | "down" | "left" | "right";
export type Shape = ShapeBody & { /** Drawn only when the selection matches. */ when?: Selection };
type ShapeBody =
  | { type: "cone"; origin: Pt; directionDeg: number; angleDeg: number; radius: number; kind: string; label: string; example?: boolean }
  | { type: "quadrants"; quadrants: ("NE" | "NW" | "SE" | "SW")[]; kind: string; label: string; example?: boolean; telegraphed?: boolean }
  | { type: "spreads"; radius: number; kind: string; label: string; example?: boolean; roles?: Role[] }
  | { type: "knockback"; from: Pt; through: Pt; to?: Pt; end?: Pt; lane?: number; kind: string; label: string; example?: boolean }
  | { type: "bands"; axis: "nwse" | "nesw"; ranges: [number, number][]; kind: string; label: string; example?: boolean; telegraphed?: boolean }
  | { type: "raidwide"; kind: string; label: string; example?: boolean }
  | { type: "target"; role: Role; text: string; kind: string; label: string; example?: boolean }
  | { type: "halfroom"; fromDeg: number; toDeg: number; kind: string; label: string; example?: boolean }
  | { type: "tiles"; frames: { colour: "red" | "blue"; rect: [number, number, number, number]; arrows: ArrowDir[] }[]; kind: string; label: string; example?: boolean }
  | { type: "stacks"; kind: string; label: string; example?: boolean }
  | { type: "tethers"; from: "statue"; targets: Role[]; kind: string; label: string; example?: boolean }
  | { type: "beams"; from: "statue"; targets: Role[]; width: number; kind: string; label: string; example?: boolean }
  | { type: "towers"; centres: Pt[]; radius: number; kind: string; label: string; example?: boolean }
  | { type: "circles"; centres: Pt[]; radius: number; kind: string; label: string; example?: boolean };

export interface Scene {
  image?: string;
  sources: SourceRef[];
  note?: string;
  positions?: Partial<Record<Role, PlacedRole>>;
  unplaced?: Partial<Record<Role, string>>;
  zones?: { label: string; group: string; half: "N" | "S" | "E" | "W" }[];
  shapes?: Shape[];
  unmeasured?: string[];
  owner?: "approved" | "rejected" | "unsure";
  /** Drawn relative to the mechanic (e.g. towers as south), not to the arena: waymarks are hidden. */
  relative?: boolean;
  /** Roles holding the Double-Trouble Trap debuff in this scene. */
  debuff?: Role[];
  /** Intermediate moments shown before the scene's final layout (position overrides). */
  frames?: { label: string; debuff?: Role[]; positions: Partial<Record<Role, PlacedRole>> }[];
  /**
   * Move roles that stand in a drawn danger area (quadrants/bands) to the nearest safe spot.
   * The result is marked "derived": it is computed from the drawn AoEs, not read from a source.
   */
  /**
   * Pre-knockback spots, computed from where each knocked role must be in the next step: stand so the push
   * (straight away from `from`, `distance` long) lands you on your next spot, or as close as the source allows
   * (`minGap` from it). Roles not knocked go straight to their next spot. All drawn as "derived".
   */
  knockbackPrep?: { from: Pt; distance: number; minGap: number; roles: RoleSel; note: string };
  /**
   * Spots for roles this scene does not place: the average of their spots in `target` over every option of
   * `groups` (the choices not known yet), i.e. halfway between where they might have to go. Drawn as "derived".
   */
  hedge?: { target: string[]; groups: string[]; note: string };
  /**
   * Tele-trouncing: each role's example arrow pair (short timer first) per variation. Roles stand on the tile cell
   * showing the arrow that drops at this step: a scene's first frame drops the short-timer arrows, the scene itself
   * the long-timer ones. Positions are computed from the scene's tiles shape ("derived").
   */
  arrowDrops?: { assign: { when: Selection; pairs: Partial<Record<Role, [ArrowDir, ArrowDir]>> }[]; note: string; sources: SourceRef[] };
  /**
   * Tele-trouncing confusion: the `confused` roles (per variation) walk from their spot in scene `from` at the
   * other player in their quadrant, step into the first arrow on the way and are teleported `hops` times along the arrows
   * (arrows.ts teleportChain). The scene's frames are: stepped into the first arrow, then teleports 1..hops-1;
   * the scene itself is after the last teleport. Other roles keep their spots (`carry`). Computed ("derived").
   */
  teleports?: { from: string; confused: RoleSel; hops: number; note: string; sources: SourceRef[] };
  /** Computed, never stored (sequence.ts): arrow pairs and the arrows on the ground at this step. */
  arrowState?: import("./arrows").ArrowState;
  /** Roles this scene does not place keep their spot from the previous step (drawn as "carried"). */
  carry?: { note: string };
  dodge?: { margin: number; maxShift: number; keepSide?: boolean; note: string; melee?: { roles: Role[]; maxRadius: number; note: string } };
  /** Positions that depend on the variation (merged over `positions` when `when` matches). */
  variantPositions?: { when: Selection; positions: Partial<Record<Role, PlacedRole>> }[];
  /**
   * Forsaken (P2): players and their spells come from the chosen example deal (`geometry.forsaken`).
   * "set": tower set n is resolving (spots from the odd/even slot layout, placed by the rules in forsaken.ts).
   * "held": no towers resolve; show the spells everyone holds after set `after` (0 = right after the cast).
   */
  forsaken?: { at: "set"; set: number } | { at: "held"; after: number };
  /** Computed, never stored (forsaken.ts): the spell over each head, and whether it resolves in this step. */
  spells?: Partial<Record<Role, { spell: Spell; resolving: boolean }>>;
  /** Computed, never stored: signs players put on themselves (Forsaken, after set 3). */
  signs?: Partial<Record<Role, Sign>>;
  /** Computed, never stored: one line per role explaining its spot in this step. */
  roleText?: Partial<Record<Role, string>>;
  /** Computed (Forsaken): what the turned picture shows, printed under the arena instead of "towers = relative south". */
  frameLabel?: string;
}

export type Spell = "stack" | "circle" | "cone";
export type Sign = "bind1" | "bind2" | "ignore1" | "ignore2";
/** One example run of Forsaken: who resolves which spell in each tower set (random in the fight). */
export interface ForsakenDeal {
  label: string;
  note: string;
  sources: SourceRef[];
  /** Built by us from the rules, not copied from a source. */
  constructed?: boolean;
  /** Index 0 = set 1. Each entry: the four soakers and the spell they resolve. */
  sets: Partial<Record<Role, Spell>>[];
  /** Signs the first tower group puts on itself after set 3 (bind = cone, ignore = circle; the number = order of marking). */
  signs: Partial<Record<Role, Sign>>;
}
export interface ForsakenSpec {
  note: string;
  /** Named spots, measured once per layout (odd sets, even sets). */
  slots: { odd: Record<string, PlacedRole>; even: Record<string, PlacedRole> };
  deals: Record<string, ForsakenDeal>;
}

/** A fixed set of roles, or one set per variation (e.g. whichever group the statue tethers). */
export type RoleSel = Role[] | { when: Selection; roles: Role[] }[];

export interface VariationGroup { id: string; label: string; note?: string; options: { id: string; label: string }[] }
export interface VariationSpec {
  groups: VariationGroup[];
  /** Text branch id (phase file) → the selection it stands for. */
  branches: Record<string, Selection>;
}

export interface Geometry {
  waymarks: { points: Record<string, Pt> };
  statue: { point: Pt };
  scenes: Record<string, Scene>;
  /** Per mechanic: variation groups shown as radio rows. Mechanics without an entry use their text branches as one group. */
  variations?: Record<string, VariationSpec>;
  /** Mechanics that happen inside another one and have no steps of their own: the parent's scenes that show them. */
  seeAlso?: Record<string, string[]>;
  forsaken?: ForsakenSpec;
}
