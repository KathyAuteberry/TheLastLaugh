import { useEffect, useRef } from "react";
import { ROLES } from "../model/types";
import { D3_JOBS, HEALER_JOBS, TANK_JOBS, type HealerJob } from "../model/mitigation";
import { jobsForRole, myJob, setMyJob, toggleHealer, type Settings } from "./party";

/** A row of toggle chips; clicking the selected one clears it when `clearable`. */
function Chips({ label, options, value, onChange, clearable = true }: { label: string; options: readonly string[]; value?: string; onChange: (v: string | undefined) => void; clearable?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button key={o} type="button" role="radio" aria-checked={value === o} className="toggle" onClick={() => onChange(value === o && clearable ? undefined : o)}>{o}</button>
      ))}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5 sm:grid-cols-[7.5rem_1fr] sm:items-baseline sm:gap-4">
      <div><p className="text-sm font-medium text-zinc-200">{label}</p>{hint && <p className="text-[11px] text-zinc-500">{hint}</p>}</div>
      <div>{children}</div>
    </div>
  );
}

export function PartySettings({ s, onChange, onClose }: { s: Settings; onChange: (s: Settings) => void; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    box.current?.querySelector<HTMLElement>("button, select")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const p = s.party;
  const healers = p.healers ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-labelledby="party-title" className="panel w-full max-w-xl shadow-2xl shadow-black/60">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div>
            <h2 id="party-title" className="text-base font-semibold text-white">You and your party</h2>
            <p className="text-xs text-zinc-500">Changes which lanes and ability names are shown. The plan itself is always Ikuya's.</p>
          </div>
          <button type="button" className="btn btn-icon" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <section className="space-y-3">
            <h3 className="eyebrow">You</h3>
            <Field label="Role"><Chips label="My role" options={ROLES} value={s.role} onChange={(r) => onChange({ ...s, role: r as Settings["role"] })} /></Field>
            {jobsForRole(s.role).length > 0 && (
              <Field label="Job" hint={s.role === "H1" || s.role === "H2" ? "Also adds it to the party's healers." : "Same as your slot below."}>
                <Chips label="My job" options={jobsForRole(s.role)} value={myJob(s)} onChange={(j) => onChange(setMyJob(s, j ?? ""))} />
              </Field>
            )}
          </section>

          <section className="space-y-3 border-t border-white/[0.06] pt-5">
            <h3 className="eyebrow">Party</h3>
            <Field label="MT"><Chips label="MT job" options={TANK_JOBS} value={p.MT} onChange={(j) => onChange({ ...s, party: { ...p, MT: j as typeof p.MT } })} /></Field>
            <Field label="OT"><Chips label="OT job" options={TANK_JOBS} value={p.OT} onChange={(j) => onChange({ ...s, party: { ...p, OT: j as typeof p.OT } })} /></Field>
            <Field label="Healers" hint="Pick two; only their lanes show.">
              <div role="group" aria-label="Healer jobs in the party" className="flex flex-wrap gap-1.5">
                {HEALER_JOBS.map((h) => (
                  <button key={h} type="button" role="checkbox" aria-checked={healers.includes(h)} className="toggle" onClick={() => onChange(toggleHealer(s, h as HealerJob))}>{h}</button>
                ))}
              </div>
            </Field>
            <Field label="D3" hint="The only DPS with a job-specific press in P1."><Chips label="D3 job" options={D3_JOBS} value={p.D3} onChange={(j) => onChange({ ...s, party: { ...p, D3: j as typeof p.D3 } })} /></Field>
          </section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3">
          <button type="button" className="text-xs text-zinc-500 underline decoration-white/20 underline-offset-2 hover:text-zinc-300" onClick={() => onChange({ role: s.role, party: {} })}>Clear party</button>
          <button type="button" className="btn btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
