import type { Role } from "../model/types";
import { ROLES } from "../model/types";
import { D3_JOBS, HEALER_JOBS, TANK_JOBS, type DpsJob, type HealerJob, type Party, type TankJob, type Who } from "../model/mitigation";

// Viewer settings: who you are and, optionally, the jobs in your party. One source of truth for the header's
// quick Role/Job selects and the party pop-up. Stored per browser; display only, never changes the plan.

export interface Settings { role?: Role; healerJob?: HealerJob; party: Party }

const KEY = "tll.settings";
const isTank = (r?: Role) => r === "MT" || r === "OT";
const isHealer = (r?: Role) => r === "H1" || r === "H2";

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));
    // One-time move from the old separate keys (role + one job).
    const role = localStorage.getItem("tll.focusRole") as Role | null;
    const job = localStorage.getItem("tll.job") ?? "";
    return setMyJob(sanitize({ role: role ?? undefined, party: {} }), job);
  } catch { return { party: {} }; }
}
export function saveSettings(s: Settings) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* storage unavailable */ } }

function sanitize(x: Partial<Settings>): Settings {
  const p = (x.party ?? {}) as Party;
  return {
    role: ROLES.includes(x.role as Role) ? x.role : undefined,
    healerJob: HEALER_JOBS.includes(x.healerJob as HealerJob) ? x.healerJob : undefined,
    party: {
      MT: TANK_JOBS.includes(p.MT as TankJob) ? p.MT : undefined,
      OT: TANK_JOBS.includes(p.OT as TankJob) ? p.OT : undefined,
      D3: D3_JOBS.includes(p.D3 as DpsJob) ? p.D3 : undefined,
      healers: (p.healers ?? []).filter((h) => HEALER_JOBS.includes(h)).slice(0, 2),
    },
  };
}

/** Jobs the header's Job select offers for the current role. */
export const jobsForRole = (r?: Role): string[] => isTank(r) ? TANK_JOBS : isHealer(r) ? HEALER_JOBS : r === "D3" ? D3_JOBS : [];

export function myJob(s: Settings): string | undefined {
  if (isTank(s.role)) return s.party[s.role as "MT" | "OT"];
  if (isHealer(s.role)) return s.healerJob;
  if (s.role === "D3") return s.party.D3;
  return undefined;
}

/** Sets the viewer's own job; for a healer it also joins the party's healer pair (replacing the other one if full). */
export function setMyJob(s: Settings, job: string): Settings {
  const j = job || undefined;
  if (isTank(s.role)) return { ...s, party: { ...s.party, [s.role!]: j as TankJob | undefined } };
  if (s.role === "D3") return { ...s, party: { ...s.party, D3: j as DpsJob | undefined } };
  if (isHealer(s.role)) {
    const hs = s.party.healers ?? [];
    const healers = !j || hs.includes(j as HealerJob) ? hs : [...hs.slice(-1), j as HealerJob];
    return { ...s, healerJob: j as HealerJob | undefined, party: { ...s.party, healers } };
  }
  return s;
}

/** Adds or removes a healer job from the party (at most two; adding a third drops the earliest). */
export function toggleHealer(s: Settings, h: HealerJob): Settings {
  const hs = s.party.healers ?? [];
  const healers = hs.includes(h) ? hs.filter((x) => x !== h) : [...hs, h].slice(-2);
  return { ...s, healerJob: s.healerJob && !healers.includes(s.healerJob) ? undefined : s.healerJob, party: { ...s.party, healers } };
}

export function whoFrom(s: Settings): Who {
  return {
    role: s.role,
    tankJob: isTank(s.role) ? s.party[s.role as "MT" | "OT"] : undefined,
    healerJob: isHealer(s.role) ? s.healerJob : undefined,
    dpsJob: s.role === "D3" ? s.party.D3 : undefined,
    party: s.party,
  };
}

/** Short summary for the header button, e.g. "DRK · GNB · WHM SCH · BRD". */
export function partySummary(p: Party): string {
  return [p.MT, p.OT, p.healers?.length ? p.healers.join(" ") : undefined, p.D3].filter(Boolean).join(" · ");
}
