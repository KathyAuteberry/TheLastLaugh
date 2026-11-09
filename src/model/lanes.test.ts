import { describe, expect, it } from "vitest";
import { activeAt, buildLanes, overruns } from "./lanes";
import { allEntries, durationOf } from "./mitigation";

describe("mitigation lanes", () => {
  it("every real ability behind a P1 entry has a Job Guide duration", () => {
    const lanes = buildLanes({});
    for (const b of lanes.flatMap((l) => l.bars)) for (const o of b.options) for (const p of o.parts) expect(durationOf(p.ability), p.ability).toBeDefined();
  });
  it("draws one bar per press and attaches every carry-over to its press", () => {
    const lanes = buildLanes({});
    const presses = allEntries(1).filter((x) => x.action === "press").length;
    expect(lanes.flatMap((l) => l.bars).length).toBe(presses);
    const carries = allEntries(1).filter((x) => x.action === "carry-over").length;
    expect(lanes.flatMap((l) => l.bars.flatMap((b) => b.carries)).length).toBe(carries);
  });
  it("narrows a tank's party mit to the chosen job", () => {
    const any = buildLanes({}).find((l) => l.slot === "MT")!.bars.find((b) => b.entry.ability === "Party Mit" && !b.entry.jobVariant)!;
    expect(any.min).toBeLessThan(any.max!);
    const drk = buildLanes({ role: "MT", tankJob: "DRK" }).find((l) => l.slot === "MT")!.bars.find((b) => b.eventId === any.eventId && b.entry.ability === "Party Mit")!;
    expect([drk.min, drk.max]).toEqual([15, 15]);
  });
  it("marks the viewer's lane and reports active effects", () => {
    const lanes = buildLanes({ role: "H1", healerJob: "WHM" });
    expect(lanes.filter((l) => l.mine).map((l) => l.slot)).toEqual(["WHM"]);
    const whm = lanes.find((l) => l.slot === "WHM")!;
    const t = whm.bars.find((b) => b.entry.ability === "Temperance")!;
    expect(activeAt(whm, t.press + 1)[0]?.sure).toBe(true);
    expect(activeAt(whm, t.press + 21).find((a) => a.bar === t)).toBeUndefined();
  });
  it("finds the one carry-over that outlasts its Job Guide duration (D-P1-06)", () => {
    const o = overruns(buildLanes({}));
    expect(o.map((x) => `${x.bar.slot} ${x.bar.entry.ability} ${x.bar.press}→${x.carry.at}`)).toEqual(["WHM Temperance 165→187.1"]);
    expect(o[0]!.late).toBeCloseTo(2.1, 1);
  });
});

describe("lanes with a party", () => {
  it("shows only the party's healers and narrows tank bars to their jobs", () => {
    const lanes = buildLanes({ party: { MT: "WAR", OT: "DRK", healers: ["AST", "SCH"] } });
    expect(lanes.map((l) => l.slot)).toEqual(["MT", "OT", "AST", "SCH", "D1", "D2", "D3", "D4"]);
    for (const l of lanes.filter((x) => x.slot === "MT" || x.slot === "OT")) for (const b of l.bars) {
      expect(b.min).toBe(b.max);
      if (b.entry.jobVariant) expect(b.entry.jobVariant).toContain(l.slot === "MT" ? "WAR" : "DRK");
    }
  });
});
