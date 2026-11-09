import { allEntries, candidateAbilities, durationOf, HEALER_JOBS, jobForSlot, slotsFor, type HealerJob, type MitEntry, type Slot, type Who } from "./mitigation";
import { ikuyaTiming } from "./timeline";

// Mitigation lanes for the replay: one row per column of Ikuya's sheet. Who presses what and when comes from
// Ikuya (press time = the sheet's time); how long it lasts comes from the official Job Guide (abilities.json
// durations). Nothing here adds an assignment.

export const LANE_ORDER: Slot[] = ["MT", "OT", "WHM", "AST", "SCH", "SGE", "D1", "D2", "D3", "D4"];

export interface LaneBar {
  slot: Slot; entry: MitEntry; eventId: string;
  /** Press time (Ikuya) in seconds from the pull. */
  press: number;
  /**
   * How long the effect lasts. A range when the lane's job isn't known (e.g. Party Mit is 15 s on DRK, 30 s on WAR);
   * null = no lasting effect (drawn as a press only). A term covering several abilities lasts as long as its longest one.
   */
  min: number | null; max: number | null;
  /** Each possible job and its abilities with their durations, for the tooltip. */
  options: { job?: string; parts: { ability: string; sec: number | null; optional?: boolean }[] }[];
  /** Later Ikuya events this press is carried over to (➔), at their hit time. */
  carries: { eventId: string; at: number; entry: MitEntry }[];
}
export interface Lane { slot: Slot; mine: boolean; bars: LaneBar[] }

function spanOf(entry: MitEntry, who: Who) {
  const options = candidateAbilities(entry, who).map((c) => ({
    job: c.job,
    parts: c.abilities.map((a) => ({ ability: a.ability, sec: durationOf(a.ability)?.sec ?? null, optional: a.optional })),
  }));
  const lengths = options.map((o) => {
    const secs = o.parts.filter((p) => !p.optional && p.sec !== null).map((p) => p.sec!);
    return secs.length ? Math.max(...secs) : null;
  }).filter((x): x is number => x !== null);
  return { options, min: lengths.length ? Math.min(...lengths) : null, max: lengths.length ? Math.max(...lengths) : null };
}

/** Healer lanes to show: the party's healer jobs when chosen, else all four. */
export function laneSlots(who: Who): Slot[] {
  const hs = who.party?.healers?.length ? who.party.healers : undefined;
  return LANE_ORDER.filter((s) => !HEALER_JOBS.includes(s as HealerJob) || !hs || hs.includes(s as HealerJob));
}

/** All lanes for this viewer, in sheet order; the viewer's own lane(s) marked. */
export function buildLanes(who: Who): Lane[] {
  const mine = new Set(slotsFor(who) ?? []);
  // The replay covers P1 only so far.
  const entries = allEntries(1).filter((x) => x.action !== "flag");
  return laneSlots(who).map((slot) => {
    const own = entries.filter((x) => x.slot === slot);
    const bars: LaneBar[] = own.filter((x) => x.action === "press").flatMap((entry) => {
      const t = ikuyaTiming(entry.eventId);
      if (!t) return [];
      const job = jobForSlot(slot, who);
      if (entry.jobVariant && job && !entry.jobVariant.includes(job)) return [];
      return [{ slot, entry, eventId: entry.eventId, press: t.press, ...spanOf(entry, who), carries: [] }];
    });
    for (const c of own.filter((x) => x.action === "carry-over")) {
      const bar = bars.find((b) => b.eventId === c.carriedFromEventId && b.entry.ability === c.ability);
      const t = ikuyaTiming(c.eventId);
      if (bar && t) bar.carries.push({ eventId: c.eventId, at: t.hit, entry: c });
    }
    return { slot, mine: mine.has(slot), bars: bars.sort((a, b) => a.press - b.press) };
  });
}

/** A carry-over that lands after the effect has certainly worn off (its longest possible duration). */
export function overruns(lanes: Lane[]) {
  return lanes.flatMap((l) => l.bars.flatMap((b) => b.carries.filter((c) => b.max !== null && c.at > b.press + b.max + 0.05).map((c) => ({ bar: b, carry: c, late: c.at - (b.press + b.max!) }))));
}

/** Effects active at `now` in a lane: certainly (before the shortest duration) or maybe (job-dependent tail). */
export function activeAt(lane: Lane, now: number) {
  return lane.bars.filter((b) => b.max !== null && now >= b.press && now < b.press + b.max)
    .map((b) => ({ bar: b, left: b.press + b.max! - now, sure: now < b.press + b.min! }));
}
