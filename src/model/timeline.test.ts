import { describe, expect, it } from "vitest";
import { geometry, p1 } from "../data";
import { allSelections, variationsFor } from "./variants";
import { buildTimeline, formatClock, ikuyaTiming, parseClock, stepAt, timeline } from "./timeline";
import { buildMotion, positionsAt } from "./motion";
import { knockLanding, preKnockSpot } from "./sequence";
import { arrowsAt } from "./arrows";

const tl = buildTimeline(p1.mechanics, geometry);

describe("buildTimeline", () => {
  it("covers every variation combination with times that never go backwards", () => {
    for (const m of p1.mechanics)
      for (const sel of allSelections(variationsFor(m, geometry))) {
        const t = buildTimeline(p1.mechanics, geometry, { [m.id]: sel });
        for (let i = 1; i < t.length; i++) expect(t[i]!.at, t[i]!.step.key).toBeGreaterThanOrEqual(t[i - 1]!.at);
        expect(t[0]!.from).toBe(timeline.motion.start);
      }
  });

  it("marks untimed steps as approximate and places them between their neighbours", () => {
    const i = tl.findIndex((s) => s.step.key === "p1-graven-image-2/into-puddles#0");
    const s = tl[i]!;
    expect(s.approx).toBe(true);
    expect(s.at).toBeGreaterThan(tl[i - 1]!.at);
    expect(s.at).toBeLessThan(tl[i + 1]!.at);
    expect(tl.filter((x) => x.approx && x.timing.t === null).map((x) => x.step.key)).toEqual(["p1-graven-image-2/into-puddles#0"]);
  });

  it("follows the chosen variation", () => {
    const gi2 = p1.mechanics.find((m) => m.id === "p1-graven-image-2")!;
    const spec = variationsFor(gi2, geometry);
    const t = buildTimeline(p1.mechanics, geometry, { [gi2.id]: spec.branches["dps-spread-first"]! });
    expect(stepAt(t, 90).step.key).toBe("p1-graven-image-2/spread-1-dps");
  });
});

describe("stepAt", () => {
  it("shows the step that resolves next", () => {
    expect(stepAt(tl, -1).step.key).toBe("p1-revolting-ruin-iii-1/pull#0");
    expect(stepAt(tl, 0.1).step.key).toBe("p1-revolting-ruin-iii-1/pull");
    expect(stepAt(tl, 10.6).step.key).toBe("p1-revolting-ruin-iii-1/pull");
    expect(stepAt(tl, 10.7).step.key).toBe("p1-revolting-ruin-iii-1/cast");
    expect(stepAt(tl, 30).step.key).toBe("p1-graven-image-1/tether-knockback");
    expect(stepAt(tl, 35.1).step.key).toBe("p1-graven-image-1/tether-knockback");
    expect(stepAt(tl, 35.2).step.state.branch).toBeDefined();
    expect(stepAt(tl, 88).step.key).toMatch(/spread-1/);
    expect(stepAt(tl, 168).step.key).toBe("p1-tele-trouncing/trap-pass");
  });
  it("holds the last step after the end", () => {
    expect(stepAt(tl, timeline.end.t + 10)).toBe(tl.at(-1));
  });
});

describe("Ikuya timing", () => {
  it("keeps Ikuya's time as the press and the sources' time as the hit", () => {
    expect(ikuyaTiming("ik-p1-0245")).toMatchObject({ press: 165, hit: 168.2 });
    expect(ikuyaTiming("ik-p1-0245")!.gap).toMatch(/benefit of the doubt/);
    expect(ikuyaTiming("ik-p1-0128")).toEqual({ press: 88, hit: 87.2, gap: undefined });
    expect(ikuyaTiming("ik-ot-p1-0138")!.hit).toBe(97.1);
  });
});

describe("clock", () => {
  it("formats and parses", () => {
    expect(formatClock(88)).toBe("1:28.0");
    expect(formatClock(5.25)).toBe("0:05.3");
    expect(parseClock("1:28")).toBe(88);
    expect(parseClock("1:28.5")).toBe(88.5);
    expect(parseClock("88")).toBe(88);
    expect(parseClock("1:75")).toBeUndefined();
    expect(parseClock("abc")).toBeUndefined();
  });
});

describe("replay motion", () => {
  const tlm = buildTimeline(p1.mechanics, geometry);
  const mo = buildMotion(tlm, p1.mechanics, geometry);

  it("starts south before the pull, MT running in 0.5 s early", () => {
    const pre = positionsAt(mo, timeline.motion.start);
    for (const p of Object.values(pre)) expect(p![1]).toBeLessThan(0);
    expect(positionsAt(mo, -0.6).MT).toEqual(pre.MT);
    expect(positionsAt(mo, -0.2).MT![1]).toBeGreaterThan(pre.MT![1]);
    expect(positionsAt(mo, 0.4).OT).toEqual(pre.OT); // reaction time after the pull
  });

  it("everyone stands on the step's spot when it resolves (no more than 0.5 s late), in every variation", () => {
    for (const m of p1.mechanics)
      for (const sel of allSelections(variationsFor(m, geometry))) {
        const t = buildTimeline(p1.mechanics, geometry, { [m.id]: sel });
        for (const l of buildMotion(t, p1.mechanics, geometry, { [m.id]: sel }).late)
          expect(l.arrives - l.due, `${l.key} ${l.role} ${JSON.stringify(sel)}`).toBeLessThanOrEqual(0.5);
      }
  });

  it("only the tethered group moves north after the tether, and the push lands them on their Yan spot", () => {
    const at = (t: number) => positionsAt(mo, t);
    expect(at(30.4).OT).toEqual(at(29).OT);
    expect(at(32.8).OT![1]).toBeGreaterThan(at(29).OT![1]); // tanks+healers tethered by default
    expect(at(32.8).D1).toEqual(at(29).D1);
    const yan = tlm.find((s) => s.step.key === "p1-graven-image-1/spread-ice-true")!.step.scene!.positions!.OT!.at;
    expect(at(35.5).OT![0]).toBeCloseTo(yan[0], 2);
    expect(at(35.5).OT![1]).toBeCloseTo(yan[1], 2);
  });

  it("knockback landing and pre-knockback spot agree", () => {
    const S: [number, number] = [0, 0.995];
    const T: [number, number] = [-0.36, 0.08];
    expect(knockLanding(preKnockSpot(T, S, 0.65, 0.06), S, 0.65)[1]).toBeCloseTo(T[1], 2);
  });
});

describe("Tele-trouncing arrows in the replay", () => {
  const tl2 = buildTimeline(p1.mechanics, geometry);
  const at = (t: number) => arrowsAt(tl2, stepAt(tl2, t), t);
  it("deals the debuffs when the cast ends and drops each arrow when its timer runs out", () => {
    expect(at(150)!.pairs).toEqual({}); // before the debuffs go out: no chips
    expect(at(150)!.drops).toHaveLength(0);
    expect(Object.keys(at(151.6)!.pairs)).toHaveLength(8);
    expect(Object.keys(at(152)!.pairs)).toHaveLength(8);
    expect(at(159.3)!.drops).toHaveLength(0);
    expect(at(159.5)!.drops).toHaveLength(8);
    expect(at(162.5)!.drops).toHaveLength(16);
    expect(at(170)!.drops).toHaveLength(16); // still on the ground during the trap pass
    expect(at(140)!.pairs).toEqual({}); // first Tele step on screen, debuffs not out yet
    expect(at(130)).toBeUndefined(); // no arrows before Tele-trouncing
  });
});

describe("Kefka castbars", () => {
  it("shows a cast only while it is being cast, and fills as it goes", async () => {
    const { castAt, timeline } = await import("./timeline");
    expect(castAt(10.5)).toBeUndefined();
    const rr = castAt(13.1)!;
    expect(rr.cast.ability).toBe("Revolting Ruin III");
    expect(rr.progress).toBeCloseTo(0.5, 5);
    expect(rr.left).toBeCloseTo(2.5, 5);
    expect(castAt(15.6)).toBeUndefined();
    expect(castAt(67)).toBeUndefined(); // Hyperdrive has no cast
    // The Tele-trouncing cast ends when the arrow debuffs go out.
    const tele = timeline.casts.find((c) => c.ability === "Tele-trouncing")!;
    expect(tele.end).toBe(timeline.steps["p1-tele-trouncing/arrows#0"]!.t);
  });
});
