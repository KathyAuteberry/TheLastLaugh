import { describe, expect, it } from "vitest";
import { myJob, setMyJob, toggleHealer, whoFrom, type Settings } from "./party";

describe("viewer settings", () => {
  it("a tank's own job is the party's job for that slot", () => {
    const s = setMyJob({ role: "OT", party: {} }, "GNB");
    expect(s.party.OT).toBe("GNB");
    expect(myJob(s)).toBe("GNB");
    expect(whoFrom(s).tankJob).toBe("GNB");
  });
  it("a healer's job joins the healer pair, replacing the earlier one when full", () => {
    let s: Settings = { role: "H2", party: { healers: ["WHM", "AST"] } };
    s = setMyJob(s, "SCH");
    expect(s.party.healers).toEqual(["AST", "SCH"]);
    s = toggleHealer(s, "SCH");
    expect(s.healerJob).toBeUndefined();
    expect(s.party.healers).toEqual(["AST"]);
  });
  it("keeps at most two healers", () => {
    let s: Settings = { party: {} };
    for (const h of ["WHM", "AST", "SGE"] as const) s = toggleHealer(s, h);
    expect(s.party.healers).toEqual(["AST", "SGE"]);
  });
});
