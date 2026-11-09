import { useCallback, useEffect, useMemo, useState } from "react";
import { describeSource, p1, geometry } from "./data";
import { MechanicView } from "./guide/MechanicView";
import { ReplayView } from "./replay/ReplayView";
import type { Role } from "./model/types";
import { ROLES } from "./model/types";
import { sheetVersion } from "./model/mitigation";
import { jobsForRole, loadSettings, myJob, partySummary, saveSettings, setMyJob, whoFrom, type Settings } from "./settings/party";
import { PartySettings } from "./settings/PartySettings";

export function App() {
  const mechanics = [...p1.mechanics].sort((a, b) => a.order - b.order);
  const fromHash = () => mechanics.find((m) => `#${m.id}` === window.location.hash)?.id;
  const [selected, setSelected] = useState<string>(fromHash() ?? mechanics[0]!.id);
  const [view, setView] = useState<"guide" | "replay">(window.location.hash.startsWith("#replay") ? "replay" : "guide");
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [partyOpen, setPartyOpen] = useState(false);
  const closeParty = useCallback(() => setPartyOpen(false), []);
  useEffect(() => saveSettings(settings), [settings]);
  const focus = settings.role;
  const jobs = jobsForRole(focus);
  const job = myJob(settings) ?? "";
  const who = useMemo(() => whoFrom(settings), [settings]);
  const summary = partySummary(settings.party);
  useEffect(() => { const h = () => { const id = fromHash(); if (id) { setSelected(id); setView("guide"); } else if (window.location.hash.startsWith("#replay")) setView("replay"); }; window.addEventListener("hashchange", h); return () => window.removeEventListener("hashchange", h); });
  const m = mechanics.find((x) => x.id === selected)!;
  const hasDiagram = (id: string) => !!geometry.seeAlso?.[id] || Object.keys(geometry.scenes).some((k) => k.startsWith(id + "/"));

  const mechName = (x: typeof m) => `${x.names.en.value ?? x.names.ja}${x.instance && x.names.en.value?.match(/Ruin|Light|Hyperdrive/) ? ` #${x.instance}` : ""}`;

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 sm:px-8">
          <a href={`#${selected}`} onClick={() => setView("guide")} className="group flex items-baseline gap-3">
            <span className="font-display text-xl font-bold tracking-wide text-white">The Last Laugh</span>
            <span className="hidden text-xs text-zinc-500 md:inline">Dancing Mad (Ultimate) · Phase 1</span>
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <nav aria-label="View" className="seg">
              {(["guide", "replay"] as const).map((v) => (
                <a key={v} href={v === "replay" ? "#replay" : `#${selected}`} onClick={() => setView(v)} aria-current={view === v ? "page" : undefined} className="seg-item capitalize">{v}</a>
              ))}
            </nav>
            <label className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="hidden sm:inline">Role</span>
              <select aria-label="My role" className="select" value={focus ?? ""} onChange={(e) => setSettings((x) => ({ ...x, role: (e.target.value || undefined) as Role | undefined }))}>
                <option value="">Everyone</option>
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
            {jobs.length > 0 && (
              <label className="flex items-center gap-1.5 text-xs text-zinc-500"><span className="hidden sm:inline">Job</span>
                <select aria-label="Job" className="select" value={jobs.includes(job) ? job : ""} onChange={(e) => setSettings((x) => setMyJob(x, e.target.value))}>
                  <option value="">Any</option>
                  {jobs.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </label>
            )}
            <button type="button" className="btn gap-2" onClick={() => setPartyOpen(true)} aria-haspopup="dialog" title="You and your party">
              <svg viewBox="0 0 16 16" className="h-4 w-4 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden><circle cx="6" cy="5.5" r="2.3" /><path d="M1.8 13.5c.4-2.4 2.1-3.8 4.2-3.8s3.8 1.4 4.2 3.8" /><circle cx="11.3" cy="6.3" r="1.8" /><path d="M11 9.8c1.7 0 3 1.1 3.3 3" /></svg>
              <span className="hidden lg:inline">{summary ? <span className="font-mono text-xs text-zinc-300">{summary}</span> : "Party"}</span>
            </button>
          </div>
        </div>
      </header>
      {partyOpen && <PartySettings s={settings} onChange={setSettings} onClose={closeParty} />}

      {view === "replay" ? (
        <main className="mx-auto w-full max-w-[88rem] flex-1 px-4 py-6 sm:px-8"><ReplayView who={who} /></main>
      ) : (
      <div className="mx-auto grid w-full max-w-[88rem] flex-1 grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-5 px-4 py-6 sm:px-8 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
        <nav aria-label="Phase 1 mechanics" className="min-w-0 lg:sticky lg:top-[4.75rem] lg:self-start">
          <p className="eyebrow-gold mb-2 lg:px-3">Phase 1 · Kefka</p>
          <ol className="no-scrollbar fade-x -mx-4 flex snap-x gap-1.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:block lg:space-y-0.5 lg:overflow-visible lg:px-0 lg:pb-0 lg:[mask-image:none]">
            {mechanics.map((x, k) => {
              const on = x.id === selected;
              return (
                <li key={x.id} className="snap-start">
                  <a href={`#${x.id}`} onClick={() => setSelected(x.id)} aria-current={on ? "page" : undefined}
                    className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-colors ${on ? "bg-white/[0.06] text-white ring-1 ring-white/10 lg:ring-0" : "text-zinc-400 ring-1 ring-white/[0.06] hover:bg-white/[0.03] hover:text-zinc-100 lg:ring-0"}`}>
                    {on && <span className="absolute inset-y-1.5 left-0 hidden w-0.5 rounded-full bg-jester-gold lg:block" aria-hidden />}
                    <span className={`font-mono text-[10px] ${on ? "text-jester-gold" : "text-zinc-600"}`}>{String(k + 1).padStart(2, "0")}</span>
                    <span className="flex-1">{mechName(x)}</span>
                    {!hasDiagram(x.id) && <span className="text-[10px] text-zinc-600" title="No diagram: described in text only">text</span>}
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
        <main className="min-w-0"><MechanicView m={m} who={who} /></main>
      </div>
      )}

      <footer className="border-t border-white/[0.06]">
        <div className="mx-auto flex max-w-[88rem] flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500 sm:px-8">
          <p>Strategy: <a className="text-zinc-300 underline decoration-white/20 underline-offset-2 hover:decoration-white/60" href={describeSource("yan").url}>Yan Flash</a> (ヤーン速報) · Mitigation: Ikuya Mitty (sheet v{sheetVersion}) · Fan-made, no official Square Enix art.</p>
          <p className="italic text-jester-gold/80">Study hard. Clown responsibly.</p>
        </div>
      </footer>
    </div>
  );
}
