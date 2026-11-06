import { useEffect, useMemo, useState } from "react";
import { geometry, p1 } from "../data";
import { Arena } from "../arena/Arena";
import { Chevron, VariationPicker } from "../guide/MechanicView";
import type { Mechanic, PlacedRole, Pt, Role, Scene, Selection, Shape } from "../model/types";
import { ROLES } from "../model/types";
import { arrowsAt } from "../model/arrows";
import { defaultSelection, variationsFor } from "../model/variants";
import type { Who } from "../model/mitigation";
import { buildTimeline, castAt, formatClock, ikuyaTiming, stepAt, timeline, type TimedStep } from "../model/timeline";
import { buildMotion, cuesAt, positionsAt } from "../model/motion";

const SPEEDS = [0.5, 1, 2] as const;
const END = timeline.end.t;
const START = timeline.motion.start;
const SPAN = END - START;
const mechName = (m: Mechanic) => `${m.names.en.value ?? m.names.ja}${m.instance && m.names.en.value?.match(/Ruin|Light|Hyperdrive/) ? ` #${m.instance}` : ""}`;
const SOURCE_LABEL = { cactbot: "cactbot", bmr: "BossMod Reborn" } as const;

/** Ikuya damage events with their press (sheet) and hit (timeline) times. */
const IKUYA = Object.keys(timeline.ikuya)
  .flatMap((id) => { const t = ikuyaTiming(id); return t ? [{ id, ...t }] : []; })
  .sort((a, b) => a.hit - b.hit);

export function ReplayView({ who }: { who: Who }) {
  const [now, setNow] = useState(START);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const tl = useMemo(() => buildTimeline(p1.mechanics, geometry, selections), [selections]);
  const cur = stepAt(tl, now);
  const segments = useMemo(() => mechanicSegments(tl), [tl]);
  const motion = useMemo(() => buildMotion(tl, p1.mechanics, geometry, selections), [tl, selections]);

  // Clock: advance with real time × speed while playing; stop at the end of the phase.
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let raf = requestAnimationFrame(function tick(t) {
      const dt = ((t - last) / 1000) * speed;
      last = t;
      setNow((x) => {
        const n = Math.min(END, x + dt);
        if (n >= END) setPlaying(false);
        return n;
      });
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [playing, speed]);

  const jump = (dir: 1 | -1) => {
    const i = tl.indexOf(cur);
    // Back: to the start of this step, or the previous one if already there. Forward: the next step's start.
    const target = dir === 1 ? tl[Math.min(tl.length - 1, i + 1)]!.from : now - cur.from > 0.6 || i === 0 ? cur.from : tl[i - 1]!.from;
    setNow(Math.min(END, target + 0.01));
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest("input,textarea,select,button")) return;
      if (e.key === " ") { e.preventDefault(); setPlaying((p) => !p); }
      if (e.key === "ArrowRight") jump(1);
      if (e.key === "ArrowLeft") jump(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const m = cur.mechanic;
  const spec = useMemo(() => variationsFor(m, geometry), [m]);
  const sel = selections[m.id] ?? defaultSelection(spec);
  // Spots come from the step; where each marker is right now comes from the motion model (walking between spots).
  const live = positionsAt(motion, now);
  const scene: Scene | undefined = cur.step.scene && {
    ...cur.step.scene,
    positions: Object.fromEntries(Object.entries(live).map(([r, at]) => [r, { ...(cur.step.scene!.positions?.[r as Role] ?? { method: "derived" }), at, alt: undefined } as PlacedRole])),
    arrowState: arrowsAt(tl, cur, now),
    shapes: cur.step.scene.shapes?.map((sh) => followPlayers(sh, cur.step.scene!, live)),
  };
  const early = cuesAt(tl, now);
  const casting = castAt(now);
  const label = cur.step.frame ?? cur.step.state.label;
  const until = cur.at - now;
  const upcoming = tl.slice(tl.indexOf(cur) + 1, tl.indexOf(cur) + 4);
  const hitsHere = IKUYA.filter((x) => x.hit > cur.from && x.hit <= cur.at);

  return (
    <article className="space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="eyebrow-gold">Replay · Phase 1</p>
          <h2 className="title mt-1">{mechName(m)}</h2>
          <p className="mt-0.5 text-sm text-zinc-400">{label}</p>
        </div>
        <p className="font-mono text-3xl tabular-nums text-white sm:text-4xl" aria-live="off">
          {formatClock(now)}<span className="text-base text-zinc-600"> / {formatClock(END)}</span>
        </p>
      </header>

      <div className="panel space-y-3 p-3">
        <SeekBar now={now} onSeek={(t) => setNow(t)} segments={segments} tl={tl} />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-icon" onClick={() => jump(-1)} aria-label="Previous step"><Chevron left /></button>
          <button className="btn btn-primary w-20" onClick={() => { if (now >= END) setNow(START); setPlaying(!playing); }}>{playing ? "Pause" : now >= END ? "Replay" : "Play"}</button>
          <button className="btn btn-icon" onClick={() => jump(1)} aria-label="Next step"><Chevron /></button>
          <div role="radiogroup" aria-label="Speed" className="seg ml-1">
            {SPEEDS.map((sp) => (
              <button key={sp} role="radio" aria-checked={speed === sp} onClick={() => setSpeed(sp)} className="seg-item px-2.5 text-xs tabular-nums">{sp}×</button>
            ))}
          </div>
          <span className="ml-auto hidden items-center gap-1 text-xs text-zinc-500 md:flex"><span className="kbd">Space</span> play/pause <span className="kbd ml-2">←</span><span className="kbd">→</span> step</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
        <section aria-label="Diagram" className="space-y-3 lg:sticky lg:top-[4.75rem] lg:self-start">
          <div className="panel relative mx-auto max-w-[34rem] p-2 lg:max-w-none">
            <Arena scene={scene} focus={who.role} title={`${mechName(m)}: ${label}`} still cast={casting && { ability: casting.cast.ability, progress: casting.progress, left: casting.left }} />
            {!scene && <p className="absolute inset-x-6 bottom-6 rounded-lg bg-ink-950/90 p-2 text-center text-xs text-zinc-400 ring-1 ring-white/10">No measured diagram for this step: positions are only described in the guide text.</p>}
          </div>
          {scene && <MarkerKey scene={scene} />}
        </section>

        <section aria-label="Current step" className="space-y-4 text-sm">
          {/* Fixed height (fits the largest set, six groups) so the boxes below stay put as mechanics change. */}
          <div className="panel flex flex-col p-4 lg:h-[19rem] xl:h-[16.5rem]">
            {spec.groups.length > 0
              ? <>
                  <div className="min-h-0 flex-1 overflow-y-auto"><VariationPicker compact spec={spec} sel={sel} onChange={(s) => setSelections((x) => ({ ...x, [m.id]: s }))} /></div>
                  <p className="mt-2 text-xs text-zinc-500">Each mechanic keeps its own choice for the whole pull.</p>
                </>
              : <>
                  <h3 className="eyebrow">Variations</h3>
                  <p className="mt-2 text-sm text-zinc-500">Nothing to choose for {mechName(m)}.</p>
                </>}
          </div>
          {early.length > 0 && (
            <div className="rounded-xl bg-jester-gold/[0.07] p-3 text-xs text-amber-100 ring-1 ring-jester-gold/30">
              <p className="eyebrow-gold mb-0.5">Moving early</p>
              {early.map((x) => <p key={x}>{x}</p>)}
            </div>
          )}
          <div className="panel p-4">
            <p className="text-base text-zinc-300">
              {now <= cur.at
                ? <>Resolves {cur.approx ? "at about" : "at"} <strong className="font-mono text-white">{cur.approx ? "≈" : ""}{formatClock(cur.at)}</strong>{until > 0.05 && <span className="text-zinc-500"> (in {until.toFixed(1)} s)</span>}</>
                : <>Resolved at <strong className="font-mono text-white">{formatClock(cur.at)}</strong></>}
              {cur.timing.until !== undefined && <span className="text-zinc-500">; last hit {formatClock(cur.timing.until)}</span>}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {cur.timing.source === "estimate"
                ? `${cur.timing.ability} · timing: estimate (no source times this moment; see the note)`
                : cur.approx
                ? "Neither cactbot nor BossMod Reborn times this moment; shown between its neighbours."
                : <>{cur.timing.ability} · timing: {SOURCE_LABEL[cur.timing.source as "cactbot" | "bmr"]}{cur.timing.bmr !== null && cur.timing.source === "cactbot" && ` (BossMod Reborn ${cur.timing.bmr})`}</>}
            </p>
            {cur.timing.note && <p className="mt-1 text-xs text-zinc-500">{cur.timing.note}</p>}
            {who.role && cur.step.state.positions[who.role]?.value && (
              <p className="mt-3 rounded-lg bg-jester-gold/[0.07] px-3 py-2 text-zinc-200 ring-1 ring-jester-gold/20"><strong className="text-jester-gold">{who.role}</strong> {cur.step.state.positions[who.role]!.value!.description}</p>
            )}
          </div>

          {hitsHere.length > 0 && (
            <div className="panel-quiet p-4 text-xs text-zinc-400">
              <h3 className="eyebrow mb-1.5">Ikuya damage events</h3>
              {hitsHere.map((x) => (
                <p key={x.id}>◆ Press at <span className="font-mono text-jester-gold">{formatClock(x.press)}</span> (Ikuya) · hits at <span className="font-mono text-zinc-200">{formatClock(x.hit)}</span>{x.gap && <span className="block text-zinc-500">{x.gap}</span>}</p>
              ))}
              <p className="mt-1.5 text-zinc-500">Who presses what comes in the mitigation lanes (next milestone); the guide view already lists it.</p>
            </div>
          )}

          {upcoming.length > 0 && (
            <div>
              <h3 className="eyebrow mb-1.5 px-2">Up next</h3>
              <ol className="space-y-1">
                {upcoming.map((s) => (
                  <li key={s.step.key}>
                    <button className="flex w-full gap-3 rounded-lg px-2 py-1.5 text-left text-zinc-400 transition-colors hover:bg-white/[0.04] hover:text-zinc-100" onClick={() => setNow(s.from + 0.01)}>
                      <span className="w-14 shrink-0 font-mono text-xs leading-5 text-zinc-500">{s.approx ? "≈" : ""}{formatClock(s.at)}</span>
                      <span>{s.mechanic !== m && <span className="text-zinc-500">{mechName(s.mechanic)}: </span>}{s.step.frame ?? s.step.state.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {now >= END - 0.05 && <p className="panel p-4 text-zinc-300">{timeline.end.label}. <span className="text-zinc-500">{timeline.end.note}</span></p>}
        </section>
      </div>

      <p className="note border-t border-white/[0.06] pt-4 text-zinc-500">
        Timing from <a className="underline decoration-white/20 underline-offset-2 hover:text-zinc-300" href="https://github.com/OverlayPlugin/cactbot">cactbot</a> (Apache-2.0) and <a className="underline decoration-white/20 underline-offset-2 hover:text-zinc-300" href="https://github.com/FFXIV-CombatReborn/BossmodReborn">BossMod Reborn</a> (BSD-3-Clause), seconds from the pull. They only set the clock: positions are Yan Flash's, mitigation is Ikuya Mitty's. Ikuya's times are when to press, which can be a little before the hit.
      </p>
    </article>
  );
}

interface Segment { mechanic: Mechanic; from: number; to: number }
function mechanicSegments(tl: TimedStep[]): Segment[] {
  const out: Segment[] = [];
  for (const s of tl) {
    const last = out.at(-1);
    if (last && last.mechanic === s.mechanic) last.to = s.at;
    else out.push({ mechanic: s.mechanic, from: s.from, to: s.at });
  }
  return out;
}

function SeekBar({ now, onSeek, segments, tl }: { now: number; onSeek: (t: number) => void; segments: Segment[]; tl: TimedStep[] }) {
  const pct = (t: number) => `${((t - START) / SPAN) * 100}%`;
  const w = (d: number) => `${(d / SPAN) * 100}%`;
  return (
    <div>
      <div className="relative h-11 overflow-hidden rounded-lg bg-ink-950 ring-1 ring-white/[0.07]">
        {segments.map((s, i) => (
          <div key={s.mechanic.id} title={mechName(s.mechanic)} className={`absolute inset-y-0 overflow-hidden border-r border-ink-950 ${i % 2 ? "bg-white/[0.035]" : "bg-white/[0.07]"}`} style={{ left: pct(s.from), width: w(s.to - s.from) }}>
            <span className="hidden whitespace-nowrap px-1.5 pt-1.5 text-[10px] font-medium text-zinc-400 sm:block">{(s.to - s.from) / SPAN > 0.07 ? mechName(s.mechanic) : ""}</span>
          </div>
        ))}
        {timeline.casts.map((c) => <div key={c.start} className="absolute top-0 h-1 bg-jester-gold/80" style={{ left: pct(c.start), width: w(Math.min(END, c.end) - c.start) }} title={`Kefka casts ${c.ability}: ${formatClock(c.start)}–${formatClock(c.end)}`} />)}
        {tl.map((s) => <div key={s.step.key} className={`absolute bottom-0 h-2.5 w-px ${s.approx ? "bg-zinc-600" : "bg-zinc-400"}`} style={{ left: pct(s.at) }} />)}
        {IKUYA.map((x) => <div key={x.id} className="absolute bottom-3 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-jester-gold" style={{ left: pct(x.hit) }} title={`Ikuya event: press ${formatClock(x.press)}, hit ${formatClock(x.hit)}`} />)}
        <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-jester-crimson shadow-[0_0_8px_rgba(224,49,79,0.7)]" style={{ left: pct(now) }} />
        <input type="range" min={START} max={END} step={0.1} value={now} onChange={(e) => onSeek(Number(e.target.value))}
          aria-label="Fight time" aria-valuetext={formatClock(now)} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
      </div>
      <div className="mt-1.5 flex justify-between gap-3 text-[10px] text-zinc-500"><span className="font-mono">{formatClock(START)}</span><span className="hidden items-center gap-3 sm:flex"><span className="flex items-center gap-1"><span className="h-1 w-3 bg-jester-gold/80" />Kefka casting</span><span className="flex items-center gap-1"><span className="h-2.5 w-px bg-zinc-400" />step resolves</span><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rotate-45 bg-jester-gold" />Ikuya damage event</span></span><span className="font-mono">{formatClock(END)}</span></div>
    </div>
  );
}

/** Short marker key for the replay (the guide has the full legend). */
function MarkerKey({ scene }: { scene: Scene }) {
  const ps = Object.values(scene.positions ?? {});
  const has = (m: string) => ps.some((p) => p?.method === m);
  const lines = [
    has("carried") && `Faded = stays where the previous step left them (no source moves them here).${scene.carry ? ` ${scene.carry.note}` : ""}`,
    has("loose") && "Loose spots: only an area is given; the exact dots are illustrative.",
    has("derived") && "Violet dashed = derived spot (computed from Yan's spots and the mechanic, not drawn by Yan; the step note says how).",
    ps.some((p) => p && ["eye", "copy"].includes(p.method)) && "Dashed = read by eye or copied, not auto-measured.",
    scene.arrowState && "Arrow chips under a player = arrow debuffs still to drop, short timer first (example deal from Yan's status-bar screenshot; who gets which pair is random). Faint tile = no arrow dropped there yet; it lights up when its arrow drops.",
    scene.arrowState?.hops?.length && "Dark tile = an arrow used up by a confused player's teleport; dashed line = a teleport (jump length derived from Yan's tile layout).",
  ].filter(Boolean) as string[];
  lines.push(`Markers walk between spots: ${timeline.motion.reaction} s reaction after each cue, 6 y/s. Derived from the timeline, not from a source.`);
  return <ul className="note space-y-1 px-1 text-zinc-500">{lines.map((l) => <li key={l}>• {l}</li>)}</ul>;
}

/**
 * Circles that sit on a player (stack markers such as the trap explosion) move with that player while they walk.
 * The circle is matched to the role standing on its centre in the step (debuff holders first); ground AoEs
 * (towers, puddles) stay where they are.
 */
function followPlayers(sh: Shape, step: Scene, live: Partial<Record<Role, Pt>>): Shape {
  if (sh.type !== "circles" || sh.kind !== "stack") return sh;
  const roles = [...(step.debuff ?? []), ...ROLES];
  return { ...sh, centres: sh.centres.map((c) => {
    const r = roles.find((x) => { const p = step.positions?.[x]?.at; return p && Math.hypot(p[0] - c[0], p[1] - c[1]) < 0.03; });
    const p = r && step.positions![r]!.at, l = r && live[r];
    return p && l ? [c[0] + l[0] - p[0], c[1] + l[1] - p[1]] as Pt : c;
  }) };
}
