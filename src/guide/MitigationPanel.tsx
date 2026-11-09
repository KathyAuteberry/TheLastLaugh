import { abilityName, entriesFor, eventById, eventsFor, footnoteText, realAbilities, sheetVersion, type MitEntry, type MitEvent, type Who } from "../model/mitigation";

const SLOT_ORDER = ["MT", "OT", "WHM", "AST", "SCH", "SGE", "D1", "D2", "D3", "D4", "Extras"];

function Footnotes({ e, ev }: { e: { footnotes: string[] }; ev: MitEvent }) {
  return <>{e.footnotes.map((f) => <sup key={f} className="ml-0.5 cursor-help text-jester-gold" title={footnoteText(ev.phase, ev.sheet, f)}>{f}</sup>)}</>;
}

function Name({ x, who }: { x: MitEntry; who: Who }) {
  const r = realAbilities(x, who);
  const unsure = r && !r.confirmed;
  return <span title={r ? `Ikuya: ${x.ability}${unsure ? " (expansion not yet confirmed by a healer)" : ""}` : undefined}>{abilityName(x, who)}{unsure && <span className="ml-0.5 text-zinc-500" aria-label="expansion not yet confirmed">*</span>}</span>;
}

function Entry({ x, ev, who }: { x: MitEntry; ev: MitEvent; who: Who }) {
  const variant = <>{x.jobVariant ? <span className="badge ml-1.5 bg-white/[0.04] text-zinc-300 ring-white/15">{x.jobVariant.join("/")} only</span> : null}{x.qualifier ? <span className="ml-1 text-xs text-zinc-400">({x.qualifier})</span> : null}</>;
  if (x.action === "carry-over") {
    const from = x.carriedFromEventId ? eventById(x.carriedFromEventId) : undefined;
    return (
      <li className="text-zinc-400">
        <span className="mr-1 text-zinc-500" aria-hidden>➔</span><Name x={x} who={who} /><Footnotes e={x} ev={ev} />{variant}
        <span className="ml-1 text-xs text-zinc-500">still active{from ? ` (pressed at ${from.time.absolute} ${from.name})` : ""}, don't press again</span>
      </li>
    );
  }
  return <li className="font-medium text-zinc-100"><span className="mr-1 text-jester-crimson" aria-hidden>●</span>Press <Name x={x} who={who} /><Footnotes e={x} ev={ev} />{variant}</li>;
}

export function EventMitigation({ ev, who, active }: { ev: MitEvent; who: Who; active?: boolean }) {
  const entries = entriesFor(ev.id, who);
  const bySlot = new Map<string, MitEntry[]>();
  for (const x of entries) bySlot.set(x.slot, [...(bySlot.get(x.slot) ?? []), x]);
  const notes = [...new Set(entries.flatMap((x) => x.footnotes).concat(ev.footnotes))];
  return (
    <div className={`rounded-lg p-3 ring-1 transition-colors ${active ? "bg-jester-gold/[0.05] ring-jester-gold/60" : "bg-ink-950/40 ring-white/[0.07]"}`}>
      <p className="mb-2 flex flex-wrap items-baseline gap-x-2 text-sm">
        <span className="font-mono text-jester-gold">{ev.time.absolute}</span>
        <strong className="text-white">{ev.name}<Footnotes e={ev} ev={ev} /></strong>
        <span className="text-xs text-zinc-500">{ev.sheet === "omnitank" ? "tank plan (Omnitank)" : "party plan"}</span>
        {active && <span className="badge bg-jester-gold/15 text-jester-gold ring-jester-gold/40">this step</span>}
      </p>
      {entries.length === 0 ? <p className="text-xs text-zinc-500">Nothing assigned to you here.</p> : (
        <dl className="grid grid-cols-[3.5rem_1fr] gap-x-2 gap-y-1 text-sm">
          {SLOT_ORDER.filter((s) => bySlot.has(s)).map((s) => (
            <div key={s} className="contents">
              <dt className="font-mono text-xs leading-5 text-zinc-500">{s}</dt>
              <dd><ul className="space-y-0.5">{bySlot.get(s)!.map((x, k) => <Entry key={k} x={x} ev={ev} who={who} />)}</ul></dd>
            </div>
          ))}
        </dl>
      )}
      {notes.length > 0 && (
        <ul className="mt-2 space-y-1 border-t border-white/[0.06] pt-2 text-xs text-zinc-400">
          {notes.map((n) => <li key={n}><sup className="text-jester-gold">{n}</sup> {footnoteText(ev.phase, ev.sheet, n)}</li>)}
        </ul>
      )}
    </div>
  );
}

export function MitigationPanel({ mechanicId, who, activeIds = [] }: { mechanicId: string; who: Who; activeIds?: string[] }) {
  const events = eventsFor(mechanicId);
  if (!events.length) return <p className="text-xs text-zinc-500">No damage event from Ikuya's sheet is linked to this mechanic.</p>;
  return (
    <div className="space-y-2">
      {events.map((ev) => <EventMitigation key={ev.id} ev={ev} who={who} active={activeIds.includes(ev.id)} />)}
      <p className="note text-zinc-500">Ikuya Mitty sheet v{sheetVersion}. Real ability names follow your Job (official Job Guide); without a job, Ikuya's terms are shown. * = healer shorthand expansion not yet confirmed. ● press now · ➔ already active from an earlier press.</p>
    </div>
  );
}
