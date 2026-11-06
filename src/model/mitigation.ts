import ikuyaRaw from "../../data/mitigation/p1.ikuya.json";
import overlayRaw from "../../data/mitigation/p1.overlay.json";
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
  id: string; sheet: "phase" | "omnitank"; row: number; name: string; footnotes: string[];
  time: { absolute: string; phaseRelative: string | null };
}
export interface MitEntry {
  eventId: string; slot: Slot; action: "press" | "carry-over" | "flag"; ability: string;
  jobVariant: string[] | null; footnotes: string[]; cell: string; carriedFromEventId?: string;
}
interface Link { mechanic: string; state?: string; status: string; owner?: string; note?: string }

const ikuya = ikuyaRaw as unknown as {
  sheetVersion: string; sheets: Record<string, { name: string; footnotes: Record<string, string>; notes: string[] }>;
  events: MitEvent[]; entries: MitEntry[];
};
const overlay = overlayRaw as unknown as { links: Record<string, Link>; decisions?: Record<string, { cell: string; decision: string }> };

export const sheetVersion = ikuya.sheetVersion;
export const sheetNotes = (sheet: string) => ikuya.sheets[sheet]?.notes ?? [];
export const footnoteText = (sheet: string, marker: string) => ikuya.sheets[sheet]?.footnotes[marker];
const ignoredCells = new Set(Object.values(overlay.decisions ?? {}).filter((d) => d.decision === "ignore").map((d) => d.cell));
const byId = new Map(ikuya.events.map((e) => [e.id, e]));
export const eventById = (id: string) => byId.get(id);

const sec = (t: string) => { const [m, s] = t.split(":").map(Number); return m! * 60 + s!; };

/** Damage events linked to a mechanic (optionally to one of its states), in time order. Only owner-approved links. */
export function eventsFor(mechanicId: string, stateId?: string): MitEvent[] {
  return ikuya.events
    .filter((e) => { const l = overlay.links[e.id]; return l && l.owner === "approved" && l.mechanic === mechanicId && (stateId === undefined || l.state === stateId); })
    .sort((a, b) => sec(a.time.absolute) - sec(b.time.absolute));
}

export interface Who { role?: Role; tankJob?: TankJob; healerJob?: HealerJob; dpsJob?: DpsJob }

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
  const job = x.slot === "MT" || x.slot === "OT" ? who.tankJob : x.slot === "D3" ? who.dpsJob : undefined;
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
    (!x.jobVariant || !who.tankJob || x.jobVariant.includes(who.tankJob)),
  );
}
