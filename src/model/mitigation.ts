import ikuyaP1 from "../../data/mitigation/p1.ikuya.json";
import overlayP1 from "../../data/mitigation/p1.overlay.json";
import ikuyaP2 from "../../data/mitigation/p2.ikuya.json";
import overlayP2 from "../../data/mitigation/p2.overlay.json";
import abilitiesRaw from "../../data/mitigation/abilities.json";
import type { Role } from "./types";

export type Slot = Role | "WHM" | "AST" | "SCH" | "SGE" | "Extras";
export type TankJob = "WAR" | "PLD" | "DRK" | "GNB";
export type HealerJob = "WHM" | "AST" | "SCH" | "SGE";
export const TANK_JOBS: TankJob[] = ["WAR", "PLD", "DRK", "GNB"];
export const HEALER_JOBS: HealerJob[] = ["WHM", "AST", "SCH", "SGE"];
export type DpsJob = "BRD" | "MCH" | "DNC";
/** Only D3 (physical ranged) has a job-specific action in Ikuya's P1 plan. */
export const D3_JOBS: DpsJob[] = ["BRD", "MCH", "DNC"];

export interface MitEvent {
  /** Phase of the sheet tab the event comes from (added when the phase files are merged). */
  phase: number;
  id: string; sheet: "phase" | "omnitank"; row: number; name: string; footnotes: string[];
  time: { absolute: string; phaseRelative: string | null };
}
export interface MitEntry {
  eventId: string; slot: Slot; action: "press" | "carry-over" | "flag"; ability: string;
  jobVariant: string[] | null; footnotes: string[]; cell: string; carriedFromEventId?: string;
  /** A trailing note on the cell that is not a job list, e.g. "Close" / "Far" (Omnitank P2). */
  qualifier?: string;
}
interface Link { mechanic: string; state?: string; status: string; owner?: string; note?: string }

interface Book {
  sheetVersion: string; phase: number; sheets: Record<string, { name: string; footnotes: Record<string, string>; notes: string[] }>;
  events: Omit<MitEvent, "phase">[]; entries: MitEntry[];
}
type Overlay = { links: Record<string, Link>; decisions?: Record<string, { cell: string; decision: string }> };
// One sheet file and one overlay per phase; event ids are unique across phases (ik-p1-…, ik-p2-…).
const books = [ikuyaP1, ikuyaP2] as unknown as Book[];
const overlays = [overlayP1, overlayP2] as unknown as Overlay[];
const ikuya = {
  sheetVersion: books[0]!.sheetVersion,
  events: books.flatMap((b) => b.events.map((e) => ({ ...e, phase: b.phase }) as MitEvent)),
  entries: books.flatMap((b) => b.entries),
};
const overlay = {
  links: Object.assign({}, ...overlays.map((o) => o.links)) as Record<string, Link>,
  // Decision keys repeat across phases (e.g. "extras-check" in both), so keep them as a list.
  decisions: overlays.flatMap((o) => Object.values(o.decisions ?? {})),
};
const bookFor = (phase: number) => books.find((b) => b.phase === phase);

export const sheetVersion = ikuya.sheetVersion;
export const sheetNotes = (phase: number, sheet: string) => bookFor(phase)?.sheets[sheet]?.notes ?? [];
export const footnoteText = (phase: number, sheet: string, marker: string) => bookFor(phase)?.sheets[sheet]?.footnotes[marker];
const ignoredCells = new Set(overlay.decisions.filter((d) => d.decision === "ignore").map((d) => d.cell));
const byId = new Map(ikuya.events.map((e) => [e.id, e]));
export const eventById = (id: string) => byId.get(id);

const sec = (t: string) => { const [m, s] = t.split(":").map(Number); return m! * 60 + s!; };

/** Damage events linked to a mechanic (optionally to one of its states), in time order. Only owner-approved links. */
export function eventsFor(mechanicId: string, stateId?: string): MitEvent[] {
  return ikuya.events
    .filter((e) => { const l = overlay.links[e.id]; return l && l.owner === "approved" && l.mechanic === mechanicId && (stateId === undefined || l.state === stateId); })
    .sort((a, b) => sec(a.time.absolute) - sec(b.time.absolute));
}

/**
 * The viewer's party, as far as the plan cares: the two tanks' jobs, which two healer jobs are in the party, and D3's
 * job (the only DPS with a job-specific action in P1). Anything unset means "not chosen".
 */
export interface Party { MT?: TankJob; OT?: TankJob; D3?: DpsJob; healers?: HealerJob[] }
export interface Who { role?: Role; tankJob?: TankJob; healerJob?: HealerJob; dpsJob?: DpsJob; party?: Party }

/** The job playing a sheet column, if known: the party setting, else the viewer's own job for their own column. */
export function jobForSlot(slot: Slot, who: Who): string | undefined {
  if (slot === "MT" || slot === "OT") return who.party?.[slot] ?? (slot === who.role ? who.tankJob : undefined);
  if (slot === "D3") return who.party?.D3 ?? (who.role === "D3" ? who.dpsJob : undefined);
  return undefined;
}

// ---------- real ability names (official Job Guide), resolved per job ----------
export interface RealAbility { ability: string; level: number; optional?: boolean }
interface Term { ikuyaTerm?: string; slots: string[]; byJob?: Record<string, RealAbility[]>; allJobs?: RealAbility[]; confirmed?: boolean }
const abilities = abilitiesRaw as unknown as { owner: string; terms: Record<string, Term> };

/**
 * The real abilities behind an Ikuya term for this viewer, or undefined to keep Ikuya's term
 * (no job selected, or the term is already a real ability name).
 */
export function realAbilities(x: Pick<MitEntry, "slot" | "ability">, who: Who): { list: RealAbility[]; confirmed: boolean } | undefined {
  if (abilities.owner !== "approved") return undefined;
  const term = Object.entries(abilities.terms).find(([k, t]) => (t.ikuyaTerm ?? k) === x.ability && t.slots.includes(x.slot))?.[1];
  if (!term) return undefined;
  const confirmed = term.confirmed !== false;
  if (term.allJobs) return { list: term.allJobs, confirmed };
  const job = jobForSlot(x.slot, who);
  const list = job ? term.byJob?.[job] : undefined;
  return list ? { list, confirmed } : undefined;
}

/** Display name: real abilities joined with "+", optional ones last; Ikuya's term as fallback. */
export function abilityName(x: Pick<MitEntry, "slot" | "ability">, who: Who): string {
  const r = realAbilities(x, who);
  if (!r) return x.ability;
  const main = r.list.filter((a) => !a.optional).map((a) => a.ability).join(" + ");
  const opt = r.list.filter((a) => a.optional).map((a) => a.ability);
  return opt.length ? `${main} (optional: ${opt.join(", ")})` : main;
}

/** Slots relevant to a viewer. Healers map to their job column; tanks/DPS to their role column. */
export function slotsFor(who: Who): Slot[] | undefined {
  if (!who.role) return undefined;
  if (who.role === "H1" || who.role === "H2") return who.healerJob ? [who.healerJob] : HEALER_JOBS;
  return [who.role];
}

/** Entries for an event, filtered to the viewer and their tank job variant. */
export function entriesFor(eventId: string, who: Who): MitEntry[] {
  const slots = slotsFor(who);
  return ikuya.entries.filter((x) =>
    x.eventId === eventId &&
    !ignoredCells.has(x.cell) &&
    (!slots || slots.includes(x.slot)) &&
    (!x.jobVariant || !jobForSlot(x.slot, who) || x.jobVariant.includes(jobForSlot(x.slot, who)!)),
  );
}

/** Every Ikuya entry except cells the owner chose to ignore (overlay decisions). */
export const allEntries = (phase?: number): MitEntry[] =>
  ikuya.entries.filter((x) => !ignoredCells.has(x.cell) && (phase === undefined || byId.get(x.eventId)?.phase === phase));

// ---------- durations (official Job Guide) ----------
export interface Duration { sec: number | null; effect: string; status: "source-stated" | "derived"; note?: string }
const durations = (abilitiesRaw as unknown as { durations: { owner: string; byAbility: Record<string, Duration> } }).durations;
export const durationOf = (ability: string): Duration | undefined => durations.byAbility[ability];
export const durationsOwner = durations.owner;

/**
 * The abilities an entry can stand for, one list per possible job: a job the viewer chose for their own lane,
 * else every job the term covers (narrowed by Ikuya's job note, e.g. "GNB/DRK"). A real ability name is its own list.
 */
export function candidateAbilities(x: Pick<MitEntry, "slot" | "ability" | "jobVariant">, who: Who): { job?: string; abilities: RealAbility[] }[] {
  const term = Object.entries(abilities.terms).find(([k, t]) => (t.ikuyaTerm ?? k) === x.ability && t.slots.includes(x.slot))?.[1];
  if (!term) return [{ abilities: [{ ability: x.ability, level: 0 }] }];
  if (term.allJobs) return [{ abilities: term.allJobs }];
  const own = jobForSlot(x.slot, who);
  const jobs = Object.keys(term.byJob ?? {}).filter((j) => (own ? j === own : !x.jobVariant || x.jobVariant.includes(j)));
  return jobs.map((job) => ({ job, abilities: term.byJob![job]! }));
}
