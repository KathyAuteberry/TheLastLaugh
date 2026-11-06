import timelineRaw from "../../data/timeline/p1.json";
import type { Geometry, Mechanic, Pt, RoleSel, Selection } from "./types";
import { buildPull, type Step } from "./sequence";
import { eventById } from "./mitigation";

// Replay timing. Times come from cactbot and BossMod Reborn (see data/timeline/p1.json);
// positions still come only from the guide's steps, and mitigation only from Ikuya.

export interface TimingEntry {
  t: number | null;
  until?: number;
  /** "estimate": no source times this moment; `t` is a placement explained in `note`, shown as "≈". */
  source: "cactbot" | "bmr" | "estimate" | null;
  ability: string;
  ids: string[];
  cactbot: { t: number; line: "sync" | "no-sync" | "annotation" } | null;
  bmr: number | null;
  note?: string;
  /** Start moving toward this step at `t` (+ reaction unless `react` is false); default: when the previous step resolves. */
  cue?: Cue & { react?: boolean };
  /** Before the cue: head halfway between the possible spots of `target` (default this step) over `groups`. */
  hedges?: (Cue & { groups: string[]; target?: string[] })[];
  /** These roles reach this step's spot by being knocked back when the previous step resolves, then walk. */
  /** Roles whose spot changes here jump to it instantly when the step resolves (a teleport), instead of walking. */
  teleport?: { source: string; what: string };
  knockback?: { from: Pt | "nearest-holder"; distance: number; roles: RoleSel | "all-but-holders"; source: string; what: string };
}
export interface Cue { t: number; source: string; what: string; roles?: RoleSel }
export interface Tick extends TimingEntry { id: string; t: number }
/** One Kefka castbar (data/timeline/p1.json "casts"). */
export interface Cast { ability: string; ids: string[]; start: number; end: number; length: number; how: "starts-using" | "end-minus-length"; bmrStart?: number; note?: string }
interface TimelineData {
  casts: Cast[];
  steps: Record<string, TimingEntry>;
  ticks: Tick[];
  end: { t: number; label: string; note?: string };
  ikuya: Record<string, { at: string; gap?: string }>;
  owner: string;
  motion: { start: number; reaction: number; runSpeed: number; knockbackSeconds: number; note: string };
}
export const timeline = timelineRaw as unknown as TimelineData;

export interface TimedStep {
  mechanic: Mechanic;
  step: Step;
  timing: TimingEntry;
  /** When this step resolves. For an untimed step, the midpoint of its neighbours. */
  at: number;
  /** True when no source times this step: `at` is only a placement, shown as "≈". */
  approx: boolean;
  /** The step is on screen from `from` until `at`. */
  from: number;
}

/** The replay's sequence: every mechanic's steps for the chosen variations, with times. */
export function buildTimeline(mechanics: Mechanic[], geometry: Geometry, selections: Record<string, Selection> = {}): TimedStep[] {
  const raw = buildPull(mechanics, geometry, selections).map((step) => {
    const timing = timeline.steps[step.key];
    if (!timing) throw new Error(`no timeline entry for ${step.key}`);
    return { mechanic: step.mechanic, step, timing };
  });
  const out: TimedStep[] = [];
  raw.forEach((r, i) => {
    let at = r.timing.t;
    const approx = at === null || r.timing.source === "estimate";
    if (at === null) {
      const prev = out.at(-1)?.at ?? timeline.motion.start;
      const next = raw.slice(i + 1).find((x) => x.timing.t !== null)?.timing.t ?? timeline.end.t;
      at = (prev + next) / 2;
    }
    out.push({ ...r, at, approx, from: out.at(-1)?.at ?? timeline.motion.start });
  });
  return out;
}

/** The step on screen at time `now`: the first one that has not resolved yet (the last one after it). */
export function stepAt(tl: TimedStep[], now: number): TimedStep {
  return tl.find((s) => s.at >= now) ?? tl.at(-1)!;
}

const sec = (t: string) => { const [m, s] = t.split(":").map(Number); return m! * 60 + s!; };

/**
 * For an Ikuya damage event: when Ikuya says to act (`press`, from the sheet) and when the hit lands
 * (`hit`, from the timeline). They may differ; Ikuya's time is read as the press time.
 */
export function ikuyaTiming(eventId: string): { press: number; hit: number; gap?: string } | undefined {
  const ev = eventById(eventId);
  const m = timeline.ikuya[eventId];
  if (!ev || !m) return undefined;
  const target = timeline.steps[m.at] ?? timeline.ticks.find((x) => x.id === m.at);
  if (!target || target.t === null) return undefined;
  return { press: sec(ev.time.absolute), hit: target.t, gap: m.gap };
}

/** The castbar showing at `now`, with how far it has filled (0–1) and the seconds left. */
export function castAt(now: number, casts: Cast[] = timeline.casts): { cast: Cast; progress: number; left: number } | undefined {
  const cast = casts.find((c) => now >= c.start && now < c.end);
  return cast && { cast, progress: (now - cast.start) / (cast.end - cast.start), left: cast.end - now };
}

/** "2:48.2" style clock. */
export const formatClock = (t: number) => {
  const a = Math.abs(t);
  const m = Math.floor(a / 60);
  const s = a - m * 60;
  return `${t < 0 ? "-" : ""}${m}:${s < 10 ? "0" : ""}${s.toFixed(1)}`;
};

/** Parses "1:28", "1:28.5" or "88" into seconds; undefined when malformed. */
export function parseClock(x: string): number | undefined {
  const m = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(x.trim());
  if (!m) return undefined;
  const secs = Number(m[2]);
  if (m[1] !== undefined && secs >= 60) return undefined;
  return Number(m[1] ?? 0) * 60 + secs;
}
