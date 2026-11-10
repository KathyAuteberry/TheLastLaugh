import { useEffect, useMemo, useState } from "react";
import { Arena } from "../arena/Arena";
import { allMechanics, describeSource, geometry, phaseMechanics } from "../data";
import { stepsInPull } from "../model/sequence";
import { defaultSelection, variationsFor } from "../model/variants";
import type { Claim, Mechanic, Role, Scene, Selection, SourceRef, Status, VariationSpec } from "../model/types";
import { ROLES } from "../model/types";
import { eventsFor, type Who } from "../model/mitigation";
import { MitigationPanel } from "./MitigationPanel";

const STATUS_LABEL: Record<Status, { text: string; cls: string }> = {
  verified: { text: "verified", cls: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" },
  "source-stated": { text: "source", cls: "bg-sky-400/10 text-sky-300 ring-sky-400/25" },
  derived: { text: "derived", cls: "bg-violet-400/10 text-violet-300 ring-violet-400/25" },
  "derived-from-image": { text: "from diagram", cls: "bg-violet-400/10 text-violet-300 ring-violet-400/25" },
  unverified: { text: "unverified", cls: "bg-red-500/15 text-red-200 ring-red-400/40" },
};

export function StatusChip({ status }: { status: Status }) {
  const s = STATUS_LABEL[status];
  return <span className={`badge ml-2 ${s.cls}`}>{s.text}</span>;
}

/** Compact source marker: a small book icon with a count; click to see the list. */
export function Sources({ refs }: { refs: SourceRef[] }) {
  const [open, setOpen] = useState(false);
  if (!refs.length) return null;
  const items = refs.map((r) => { const d = describeSource(r.ref); return { ...d, label: d.label + (r.at ? ` @${r.at}` : "") }; });
  return (
    <span className="relative ml-1 inline-block align-baseline">
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={`${refs.length} source${refs.length > 1 ? "s" : ""}`}
        title={items.map((i) => i.label).join("\n")}
        className="inline-flex items-center gap-0.5 rounded px-0.5 text-[10px] leading-none text-zinc-500 hover:text-zinc-200 focus-visible:outline focus-visible:outline-1 focus-visible:outline-jester-gold">
        <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden fill="currentColor"><path d="M2 2.5A1.5 1.5 0 0 1 3.5 1H13v11H3.5a.5.5 0 0 0 0 1H13v2H3.5A1.5 1.5 0 0 1 2 13.5z" /></svg>
        {refs.length}
      </button>
      {open && (
        <span role="dialog" className="absolute left-0 top-full z-20 mt-1 block w-72 rounded-lg bg-ink-800 p-2.5 text-xs leading-snug text-zinc-300 shadow-2xl shadow-black/60 ring-1 ring-white/10">
          {items.map((i, k) => (
            <span key={k} className="block py-0.5">{i.url ? <a className="underline decoration-dotted hover:text-white" href={i.url} target="_blank" rel="noreferrer">{i.label}</a> : i.label}</span>
          ))}
        </span>
      )}
    </span>
  );
}

export function ClaimText({ c, empty = "Not stated by any source." }: { c: Claim<string>; empty?: string }) {
  return (
    <span>
      {c.value ?? <em className="text-red-300">{empty}</em>}
      <StatusChip status={c.status} />
      <Sources refs={c.sources} />
    </span>
  );
}

export function MechanicView({ m, who }: { m: Mechanic; who: Who }) {
  const focus: Role | undefined = who.role;
  const spec = useMemo(() => variationsFor(m, geometry), [m]);
  const [sel, setSel] = useState<Selection>(() => defaultSelection(spec));
  // A mechanic that happens inside another one (no steps of its own) shows the parent's scenes for it.
  const parent = m.states.length === 0 && geometry.seeAlso?.[m.id] ? allMechanics.find((x) => x.id === m.occursWithin) : undefined;
  const pull = phaseMechanics(m.phase);
  const steps = useMemo(() => parent
    ? stepsInPull(parent, pull, geometry, defaultSelection(variationsFor(parent, geometry))).filter((s) => geometry.seeAlso![m.id]!.includes(s.key))
    : stepsInPull(m, pull, geometry, sel), [m, sel, parent, pull]);
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => { setI(0); setPlaying(false); setSel(defaultSelection(spec)); }, [m, spec]);
  useEffect(() => { if (i >= steps.length) setI(Math.max(0, steps.length - 1)); }, [steps, i]);
  useEffect(() => {
    if (!playing) return;
    if (i >= steps.length - 1) { setPlaying(false); return; }
    const t = setTimeout(() => setI((x) => x + 1), 2200);
    return () => clearTimeout(t);
  }, [playing, i, steps.length]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select")) return;
      if (e.key === "ArrowRight") setI((x) => Math.min(steps.length - 1, x + 1));
      if (e.key === "ArrowLeft") setI((x) => Math.max(0, x - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [steps.length]);

  const step = steps[i];
  const scene = step?.scene;
  const approved = m.ownerVerification.state === "approved";

  const stepper = (
    <div className="panel">
      <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.06] p-3">
        <button className="btn btn-icon" onClick={() => setI(Math.max(0, i - 1))} disabled={i === 0} aria-label="Previous step"><Chevron left /></button>
        <button className="btn btn-primary w-20" onClick={() => { if (i >= steps.length - 1) setI(0); setPlaying(!playing); }}>{playing ? "Pause" : "Play"}</button>
        <button className="btn btn-icon" onClick={() => setI(Math.min(steps.length - 1, i + 1))} disabled={i >= steps.length - 1} aria-label="Next step"><Chevron /></button>
        <span className="ml-1 text-sm tabular-nums text-zinc-400">Step <span className="text-white">{i + 1}</span> of {steps.length}</span>
        <span className="ml-auto hidden items-center gap-1 text-xs text-zinc-500 sm:flex"><span className="kbd">←</span><span className="kbd">→</span> to step</span>
      </div>
      <ol className="flex flex-wrap gap-1.5 px-3 pt-3" aria-label="Steps">
        {steps.map((s, k) => (
          <li key={s.key}><button onClick={() => { setI(k); setPlaying(false); }} aria-current={k === i ? "step" : undefined} className="toggle">
            <span className={`mr-1 font-mono ${k === i ? "text-jester-gold" : "text-zinc-600"}`}>{k + 1}</span>{s.frame ?? s.state.label}</button></li>
        ))}
      </ol>
      {step && (
        <div className="p-4 pt-3">
          <h3 className="text-base font-semibold text-white">{step.frame ?? step.state.label}</h3>
          <p className="mt-1 text-zinc-300"><ClaimText c={step.state.trigger} /></p>
          {step.state.actions?.length ? (
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-300 marker:text-zinc-600">{step.state.actions.map((c, k) => <li key={k}><ClaimText c={c} /></li>)}</ol>
          ) : null}
          {focus && scene?.roleText?.[focus] && (
            <p className="mt-3 rounded-lg bg-jester-gold/[0.07] px-3 py-2 text-zinc-200 ring-1 ring-jester-gold/20"><strong className="text-jester-gold">{focus}</strong>{" "}
              {scene.roleText[focus]} <span className="text-xs text-zinc-500">({step.sel.deal ? "this example deal" : "example"})</span></p>
          )}
          {focus && step.state.positions[focus] && (
            <p className="mt-3 rounded-lg bg-jester-gold/[0.07] px-3 py-2 text-zinc-200 ring-1 ring-jester-gold/20"><strong className="text-jester-gold">{focus}</strong>{" "}
              {step.state.positions[focus]!.value?.description ?? <em className="text-red-300">no position given</em>}
              <StatusChip status={step.state.positions[focus]!.status} /></p>
          )}
          {scene?.unplaced && (
            <ul className="mt-3 space-y-1 border-t border-white/[0.06] pt-3 text-xs text-zinc-400">
              {Object.entries(scene.unplaced).map(([r, t]) => <li key={r}><strong className="text-zinc-200">{r}</strong>: {t}</li>)}
            </ul>
          )}
          {scene?.unmeasured && <p className="mt-2 text-xs text-amber-300">Not drawn (not measured yet): {scene.unmeasured.join(", ")}.</p>}
        </div>
      )}
    </div>
  );

  return (
    <article className="space-y-5">
      <header>
        <p className="eyebrow-gold">Phase {m.phase} · <span lang="ja">{m.names.ja}</span></p>
        <h2 className="title mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">{m.names.en.value ?? m.names.ja}
          <span className={`badge ${approved ? "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25" : "bg-red-500/15 text-red-200 ring-red-400/40"}`}>{approved ? "Owner-approved" : "Not yet approved"}</span>
        </h2>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label="Diagram" className="space-y-3 xl:sticky xl:top-[4.75rem] xl:self-start">
          <div className="panel relative mx-auto max-w-[34rem] p-2 xl:max-w-none">
            <Arena scene={scene} focus={focus} phase={m.phase} title={`${m.names.en.value ?? m.names.ja}: ${step?.state.label ?? ""}`} />
            {!scene && <p className="absolute inset-x-6 bottom-6 rounded-lg bg-ink-950/90 p-2 text-center text-xs text-zinc-400 ring-1 ring-white/10">No measured diagram for this step: positions are only described in text.</p>}
            {scene && scene.owner !== "approved" && <span className="badge absolute left-3 top-3 bg-amber-400/15 text-amber-200 ring-amber-400/40">Diagram awaiting owner check</span>}
          </div>
          {parent && <p className="note mx-auto max-w-[34rem] xl:max-w-none">This happens during <a className="text-jester-gold underline underline-offset-2" href={`#${parent.id}`}>{parent.names.en.value}</a>; the diagram is that mechanic's step.</p>}
        </section>

        <section aria-label="Explanation" className="min-w-0 space-y-4 text-sm leading-relaxed">
          {stepper}
          {spec.groups.length > 0 && <div className="panel p-4"><VariationPicker spec={spec} sel={sel} onChange={setSel} /></div>}
          {scene && <Legend scene={scene} />}
          <div className="panel p-4"><h3 className="eyebrow mb-3">Mitigation · Ikuya</h3><MitigationPanel mechanicId={m.id} who={who} activeIds={step ? eventsFor(m.id, step.state.id).map((e) => e.id) : []} /></div>
          <div className="panel divide-y divide-white/[0.06]">
            <Block title="What happens"><ClaimText c={m.whatHappens} /></Block>
            <Block title="Recognize"><ul className="list-disc space-y-1 pl-5 marker:text-zinc-600">{m.recognition.map((c, k) => <li key={k}><ClaimText c={c} /></li>)}</ul></Block>
            <Block title={focus ? `Your role · ${focus}` : "Roles"}>
              <ul className="space-y-1.5">
                {ROLES.filter((r) => !focus || r === focus).map((r) => {
                  const c = m.roles[r];
                  return <li key={r} className="flex gap-2"><strong className="w-8 shrink-0 font-mono text-xs leading-6 text-zinc-500">{r}</strong><span className="min-w-0">{c.notInvolved ? <span className="text-zinc-400">Not involved{c.note?.match(/Stay out[^.]*\./)?.[0] ? ` — ${c.note.match(/Stay out[^.]*\./)![0].toLowerCase()}` : ""}<StatusChip status={c.status} /></span> : <ClaimText c={c} />}</span></li>;
                })}
              </ul>
            </Block>
            <Block title="Why it works"><ClaimText c={m.whyItWorks} /></Block>
            {m.commonMistakes.length > 0 && (
              <Block title="Common mistakes"><ul className="list-disc space-y-1.5 pl-5 marker:text-zinc-600">{m.commonMistakes.map((x, k) => <li key={k}><strong className="text-white">{x.mistake}</strong> → {x.consequence} <ClaimText c={x.claim} /></li>)}</ul></Block>
            )}
          </div>
        </section>
      </div>
    </article>
  );
}

export function Chevron({ left }: { left?: boolean }) {
  return <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={left ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"} /></svg>;
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h3 className="eyebrow mb-2">{title}</h3>
      <div className="text-zinc-300">{children}</div>
    </div>
  );
}

function Legend({ scene }: { scene: Scene }) {
  const approx = Object.values(scene.positions ?? {}).some((p) => p && (p.method === "eye" || p.method === "copy"));
  const carried = Object.entries(scene.positions ?? {}).filter(([, p]) => p?.method === "carried").map(([r]) => r);
  const loose = Object.values(scene.positions ?? {}).some((p) => p?.method === "loose");
  const derived = Object.entries(scene.positions ?? {}).filter(([, p]) => p?.method === "derived").map(([r]) => r);
  const omen = scene.shapes?.some((s) => s.kind === "telegraph" || ("telegraphed" in s && s.telegraphed));
  const push = scene.shapes?.some((s) => s.type === "knockback");
  return (
    <div className="panel-quiet space-y-1.5 p-4 text-xs leading-relaxed text-zinc-400">
      <h3 className="eyebrow mb-2">Key</h3>
      {scene.shapes?.map((s, k) => <p key={k}>• {s.label}{s.example && <span className="badge ml-1.5 bg-white/[0.04] text-zinc-300 ring-white/15">example layout</span>}</p>)}
      {omen && <p className="text-zinc-300">• Kefka can lie: <span className="text-red-300">red fill</span> = where it really hits · <span className="border-b-2 border-dashed border-rose-200 bg-[repeating-linear-gradient(45deg,rgba(255,209,217,0.35)_0_2px,transparent_2px_6px)] px-0.5">hatched, dashed outline</span> = what the game shows. Both on the same area = true; apart = a lie.</p>}
      {push && <p>• Faint arrow = rough knockback direction, from the debuff holder through the group.</p>}
      {approx && <p>• Dashed role marker: position read by eye, copied, or loose, not auto-measured.</p>}
      {scene.arrowState && <p>• Arrow chips under a player = arrow debuffs still to drop, short timer first (example deal from Yan's status-bar screenshot; who gets which pair is random). Faint tile = no arrow dropped there yet; it lights up when its arrow drops.</p>}
      {!!scene.arrowState?.hops?.length && <p>• Dark tile = an arrow used up by a confused player's teleport; dashed line = a teleport (jump length derived from Yan's tile layout).</p>}
      {loose && <p>• Loose spots: the source gives only an area (e.g. "spread in the south half"); the exact dots are illustrative.</p>}
      {carried.length > 0 && <p>• Faded: {carried.length === 8 ? "everyone" : carried.join(", ")} stay{carried.length === 1 ? "s" : ""} where the previous step left them; no source moves them here.{scene.carry ? ` ${scene.carry.note}` : ""}</p>}
      {derived.length > 0 && (scene.dodge
        ? <p className="text-violet-200">• Moved to the nearest safe spot for this variation: {derived.join(", ")} (dashed; derived from the drawn AoEs, not drawn by Yan).</p>
        : <p className="text-violet-200">• Derived spot: {derived.join(", ")} (dashed; computed, not drawn by Yan). {[...new Set(derived.map((r) => scene.positions?.[r as Role]?.note).filter(Boolean))].join(" ")}</p>)}
      {scene.dodge && <p className="text-zinc-500">{scene.dodge.note}{scene.dodge.melee && ` ${scene.dodge.melee.note}`}</p>}
      {scene.spells && <p>• Icon over a head = that player's spell: <span className="text-amber-300">four arrows</span> stack, <span className="text-orange-300">ring</span> circle AoE, <span className="text-rose-300">wedge</span> cone. Solid ring = resolves in this step; dashed ring = held for a later set. Who gets what is random: pick an example under Variations.</p>}
      {scene.signs && <p>• Badge = sign the player put on themselves after set 3: chain = Bind (holds a cone), crossed circle = Ignore (holds a circle); the number is the order of marking.</p>}
      {scene.debuff?.length ? <p>• <span className="rounded-full bg-jester-violet px-1 text-[10px] font-bold text-white">T</span> = holds the Double-Trouble Trap debuff ({scene.debuff.join(" + ")}; example assignment, random in the fight).</p> : null}
      {Object.values(scene.positions ?? {}).some((p) => p?.alt) && <p>• A role shown twice = two candidate spots; take the one that is safe.</p>}
      {scene.relative && (scene.frameLabel
        ? <p>• Set 1's towers are drawn at south; each later set is turned 45° from the last, the way chosen under Variations (random, but the same every set). Where set 1 really spawns is not in our sources, so waymarks are hidden. Left/right = as seen from the towers facing Kefka.</p>
        : <p>• Drawn with the towers as south: turn the picture to wherever the towers spawn. Waymarks are hidden because they do not line up.</p>)}
      {scene.note && <p className="text-zinc-500">{scene.note}</p>}
      <p className="text-zinc-500">Measured from: <Sources refs={scene.sources} /></p>
    </div>
  );
}

/** One radio row per variation group; any combination is valid. */
export function VariationPicker({ spec, sel, onChange, compact }: { spec: VariationSpec; sel: Selection; onChange: (s: Selection) => void; compact?: boolean }) {
  if (!spec.groups.length) return null;
  return (
    <div className="space-y-2" aria-label="Variations">
      <h3 className="eyebrow">Variations</h3>
      {spec.groups.map((g) => (
        <div key={g.id} role="radiogroup" aria-label={g.label} className="flex flex-wrap items-center gap-1.5">
          <span className={`w-full text-xs text-zinc-400 sm:shrink-0 ${compact ? "sm:w-44" : "sm:w-40"}`} title={g.note}>{g.label}{g.note && <span className="ml-1 cursor-help text-zinc-600" aria-hidden>ⓘ</span>}</span>
          {g.options.map((o) => {
            const on = sel[g.id] === o.id;
            return (
              <button key={o.id} role="radio" aria-checked={on} onClick={() => onChange({ ...sel, [g.id]: o.id })}
                className={`toggle ${compact ? "px-2.5 py-0.5" : ""}`}>{o.label}</button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
