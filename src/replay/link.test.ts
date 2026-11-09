import { describe, expect, it } from "vitest";
import { geometry, p1 } from "../data";
import { defaultSelection, variationsFor } from "../model/variants";
import { buildReplayLink, parseReplayLink } from "./link";

const specs = Object.fromEntries(p1.mechanics.map((m) => [m.id, variationsFor(m, geometry)] as const).filter(([, s]) => s.groups.length));
const defaults = Object.fromEntries(Object.entries(specs).map(([id, s]) => [id, defaultSelection(s)]));

describe("replay deep links", () => {
  it("round-trips the time and non-default choices", () => {
    const sel = { "p1-tele-trouncing": { ...defaults["p1-tele-trouncing"], confused: "dps", fire: "stack" } };
    const link = buildReplayLink(173.4, sel, specs, defaults);
    expect(link).toBe("#replay?t=2:53.4&p1-tele-trouncing=confused:dps,fire:stack");
    const back = parseReplayLink(link, specs);
    expect(back.t).toBeCloseTo(173.4);
    expect(back.selections).toEqual({ "p1-tele-trouncing": { confused: "dps", fire: "stack" } });
  });
  it("ignores unknown mechanics, groups and options", () => {
    const r = parseReplayLink("#replay?t=bad&nope=a:b&p1-graven-image-1=tether:xx,fire:stack,zz:1", specs);
    expect(r.t).toBeUndefined();
    expect(r.selections).toEqual({ "p1-graven-image-1": { fire: "stack" } });
  });
  it("a bare #replay has no time or choices", () => {
    expect(parseReplayLink("#replay", specs)).toEqual({ selections: {} });
  });
});
