import { useMemo } from "react";
import { abilityName, durationOf, sheetVersion, type Slot, type Who } from "../model/mitigation";
import { activeAt, buildLanes, overruns, type Lane, type LaneBar } from "../model/lanes";
import { formatClock } from "../model/timeline";

// Mitigation lanes: who presses what (Ikuya) and how long it lasts (official Job Guide), on the replay clock.

const KIND: Record<string, { bar: string; tail: string; label: string }> = {
  tank: { bar: "bg-role-tank/70", tail: "bg-role-tank/25", label: "text-sky-300" },
  healer: { bar: "bg-role-healer/70", tail: "bg-role-healer/25", label: "text-emerald-300" },
  dps: { bar: "bg-role-dps/70", tail: "bg-role-dps/25", label: "text-rose-300" },
};
const kindOf = (s: Slot) => (s === "MT" || s === "OT" ? "tank" : s.startsWith("D") ? "dps" : "healer");
const LABEL: Partial<Record<Slot, string>> = { WHM: "H · WHM", AST: "H · AST", SCH: "H · SCH", SGE: "H · SGE" };

function tooltip(b: LaneBar, who: Who, late?: number) {
  const name = abilityName(b.entry, who);
  const lines = [`${b.slot}: ${name}${name !== b.entry.ability ? ` (Ikuya: ${b.entry.ability})` : ""}`, `Press at ${formatClock(b.press)} (Ikuya)`];
  for (const o of b.options) {
    const parts = o.parts.map((p) => `${p.ability} ${p.sec === null ? "no duration" : `${p.sec} s`}${p.optional ? " (optional)" : ""}`).join(", ");
    lines.push(`${o.job ? o.job + ": " : ""}${parts}`);
  }
  for (const o of b.options) for (const p of o.parts) { const d = durationOf(p.ability); if (d?.note) lines.push(`${p.ability}: ${d.note}`); }
  for (const c of b.carries) lines.push(`➔ Still meant to cover the hit at ${formatClock(c.at)}`);
  if (late) lines.push(`Runs out ${late.toFixed(1)} s before that hit (Job Guide duration).`);
  lines.push(`Ikuya cell ${b.entry.cell}`);
  return lines.join("\n");
}

export function MitigationLanes({ who, now, start, end, hits, onSeek }: { who: Who; now: number; start: number; end: number; hits: { id: string; hit: number }[]; onSeek: (t: number) => void }) {
  const lanes = useMemo(() => buildLanes(who), [who]);
  const late = useMemo(() => new Map(overruns(lanes).map((o) => [o.carry.eventId + o.bar.slot, o.late])), [lanes]);
  const span = end - start;
  const pct = (t: number) => `${((Math.max(start, Math.min(end, t)) - start) / span) * 100}%`;
  const w = (a: number, b: number) => `${((Math.min(end, b) - Math.max(start, a)) / span) * 100}%`;
  const anyMine = lanes.some((l) => l.mine);

  return (
    <section aria-label="Mitigation lanes" className="panel p-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="eyebrow">Mitigation lanes · Ikuya{who.party?.healers?.length ? <span className="ml-2 normal-case tracking-normal text-zinc-600">healers: {who.party.healers.join(", ")} (your party)</span> : null}</h3>
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-zinc-500">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-white" />press</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-zinc-400/70" />lasts (Job Guide)</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-5 rounded-sm bg-zinc-400/25" />depends on the tank's job</span>
          <span className="flex items-center gap-1.5"><span className="text-jester-gold">➔</span>carried to this hit</span>
          <span className="flex items-center gap-1.5"><span className="text-red-400">➔</span>runs out before it</span>
        </p>
      </div>
      <div className="no-scrollbar -mx-4 overflow-x-auto px-4">
        <div className="relative min-w-[52rem]">
          {lanes.map((l) => <LaneRow key={l.slot} lane={l} who={who} dim={anyMine && !l.mine} pct={pct} w={w} late={late} onSeek={onSeek} start={start} span={span} />)}
          {/* Hit times and the playhead span all lanes (offset by the label column). */}
          <div className="pointer-events-none absolute inset-y-0 left-20 right-0">
            {hits.map((h) => <div key={h.id} className="absolute inset-y-0 w-px bg-jester-gold/15" style={{ left: pct(h.hit) }} />)}
            <div className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-jester-crimson shadow-[0_0_8px_rgba(224,49,79,0.6)]" style={{ left: pct(now) }} />
          </div>
        </div>
      </div>
      <p className="note mt-3 text-zinc-500">
        Ikuya Mitty sheet v{sheetVersion}: who presses what, and when (the sheet's time is taken as the press time). Bar lengths come from the official Job Guide; where it lists several durations the bar shows the mitigating effect (hover a bar for details). Without a tank's job (set it under Party, top right), its bar fades between the shortest and longest job. Faint gold lines = Ikuya's damage events. Click a lane to jump there.
      </p>
    </section>
  );
}

function LaneRow({ lane, who, dim, pct, w, late, onSeek, start, span }: {
  lane: Lane; who: Who; dim: boolean; pct: (t: number) => string; w: (a: number, b: number) => string;
  late: Map<string, number>; onSeek: (t: number) => void; start: number; span: number;
}) {
  const k = KIND[kindOf(lane.slot)]!;
  // Overlapping presses go on separate tracks inside the lane, so none hides another.
  const ends: number[] = [];
  const track = lane.bars.map((b) => {
    const end = b.press + Math.max(b.max ?? 0, 3);
    let t = ends.findIndex((e) => e <= b.press);
    if (t < 0) { t = ends.length; ends.push(end); } else ends[t] = end;
    return t;
  });
  const ROW = 18;
  return (
    <div style={{ height: Math.max(1, ends.length) * ROW + 10 }} className={`flex items-center rounded-md ${lane.mine ? "bg-jester-gold/[0.06] ring-1 ring-jester-gold/25" : ""} ${dim ? "opacity-55" : ""}`}>
      <div className={`w-20 shrink-0 pl-2 font-mono text-[11px] ${lane.mine ? "font-semibold text-jester-gold" : k.label}`}>{LABEL[lane.slot] ?? lane.slot}</div>
      <div className="relative h-full flex-1 cursor-pointer border-b border-white/[0.04]"
        onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); onSeek(start + ((e.clientX - r.left) / r.width) * span); }}>
        {lane.bars.map((b, i) => {
          const name = abilityName(b.entry, who);
          return (
            <div key={i} className="absolute" style={{ top: 5 + track[i]! * ROW + 1, height: ROW - 3, left: pct(b.press), width: b.max === null ? "0.5rem" : w(b.press, b.press + b.max) }} title={tooltip(b, who, Math.max(0, ...b.carries.map((c) => late.get(c.eventId + b.slot) ?? 0)) || undefined)}>
              {b.max !== null && <>
                <div className={`absolute inset-y-0 left-0 rounded-sm ${k.bar}`} style={{ width: `${((b.min ?? b.max) / b.max) * 100}%` }} />
                {b.min !== b.max && <div className={`absolute inset-y-0 right-0 rounded-r-sm ${k.tail}`} style={{ left: `${(b.min! / b.max) * 100}%` }} />}
                <span className="absolute inset-0 overflow-hidden whitespace-nowrap pl-2.5 text-[10px] font-medium leading-[15px] text-white/90">{name}</span>
              </>}
              <span className="absolute -left-1 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-white ring-2 ring-ink-900" />
            </div>
          );
        })}
        {lane.bars.flatMap((b) => b.carries.map((c) => {
          const bad = late.has(c.eventId + b.slot);
          const t = track[lane.bars.indexOf(b)]!;
          return <span key={c.eventId + b.entry.cell} className={`pointer-events-none absolute -translate-x-1/2 text-xs font-bold leading-[15px] ${bad ? "text-red-400" : "text-jester-gold"}`} style={{ left: pct(c.at), top: 5 + t * ROW + 1 }}>➔</span>;
        }))}
      </div>
    </div>
  );
}

/** Your active effects right now, for the step panel. */
export function ActiveMits({ who, now }: { who: Who; now: number }) {
  const lanes = useMemo(() => buildLanes(who), [who]);
  const mine = lanes.filter((l) => l.mine);
  if (!mine.length) return null;
  const active = mine.flatMap((l) => activeAt(l, now));
  const next = mine.flatMap((l) => l.bars).filter((b) => b.press > now).sort((a, b) => a.press - b.press)[0];
  return (
    <div className="panel-quiet p-4 text-xs text-zinc-400">
      <h3 className="eyebrow mb-1.5">Your mitigation</h3>
      {active.length ? active.map((a, i) => (
        <p key={i} className="text-zinc-200">{abilityName(a.bar.entry, who)} <span className="font-mono text-zinc-500">{a.sure ? `${a.left.toFixed(1)} s left` : `maybe ${a.left.toFixed(1)} s left (job)`}</span></p>
      )) : <p>Nothing of yours active.</p>}
      {next && <p className="mt-1.5">Next: <span className="text-zinc-200">{abilityName(next.entry, who)}</span> at <span className="font-mono text-jester-gold">{formatClock(next.press)}</span>{next.press - now < 10 && <span className="text-zinc-500"> (in {(next.press - now).toFixed(1)} s)</span>}</p>}
    </div>
  );
}
