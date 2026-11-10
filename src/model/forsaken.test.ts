import { describe, expect, it } from "vitest";
import { geometry, p2 } from "../data";
import { held, placeSet, rotate, soakers, towerGroup } from "./forsaken";
import { stepsInPull } from "./sequence";
import type { Role } from "./types";

const deals = geometry.forsaken!.deals;
const towers = (n: number, deal: string) => {
  const at = placeSet(deals[deal]!, n).at;
  return Object.fromEntries(["left-top", "left-bottom", "right-top", "right-bottom"].map((k) => [k, (Object.keys(at) as Role[]).find((r) => at[r] === k)]));
};

describe("Forsaken solver", () => {
  it("reproduces the tower spots in Yan's 8-panel run (yan-p2-01)", () => {
    // [left-top, left-bottom, right-top, right-bottom] as read from Yan's icons.
    const yan: [string, string, string, string][] = [
      ["MT", "D4", "D2", "H1"], ["MT", "H1", "D2", "D4"], ["H1", "D2", "MT", "D4"], ["D1", "H2", "D3", "OT"],
      ["H2", "D3", "D1", "OT"], ["H2", "D1", "OT", "D3"], ["H2", "OT", "D3", "D1"], ["MT", "D2", "D4", "H1"],
    ];
    yan.forEach(([lt, lb, rt, rb], i) => expect(towers(i + 1, "yan"), `set ${i + 1}`).toEqual({ "left-top": lt, "left-bottom": lb, "right-top": rt, "right-bottom": rb }));
  });

  it("reproduces Kitten's Mana pictures", () => {
    const kit: Record<number, [string, string, string, string]> = {
      1: ["H1", "D4", "D2", "MT"], 2: ["H1", "MT", "D2", "D4"], 3: ["D2", "MT", "D4", "H1"], 4: ["D1", "H2", "D3", "OT"],
      5: ["OT", "D1", "D3", "H2"], 8: ["D2", "MT", "D4", "H1"],
    };
    for (const [n, [lt, lb, rt, rb]] of Object.entries(kit)) expect(towers(+n, "kitten"), `set ${n}`).toEqual({ "left-top": lt, "left-bottom": lb, "right-top": rt, "right-bottom": rb });
  });

  it("puts the outside players on their role spots", () => {
    const at = placeSet(deals.yan!, 4).at;
    expect([at.MT, at.D2, at.H1, at.D4]).toEqual(["helper-tank", "helper-melee", "helper-healer", "helper-ranged"]);
    const odd = placeSet(deals.yan!, 5).at;
    expect([odd.MT, odd.H1, odd.D2, odd.D4]).toEqual(["helper-tank", "helper-healer", "helper-dps", "helper-dps"]);
  });

  it("has every deal fill each tower with exactly two players", () => {
    for (const [id, d] of Object.entries(deals))
      for (let n = 1; n <= 8; n++) {
        const at = Object.values(placeSet(d, n).at);
        for (const k of ["left-top", "left-bottom", "right-top", "right-bottom"]) expect(at.filter((x) => x === k).length, `${id} set ${n} ${k}`).toBe(1);
      }
  });

  it("tracks who holds what: tower group sets 1-3 and 8, helpers 4-7", () => {
    const d = deals.yan!;
    expect(towerGroup(d).sort()).toEqual(["D2", "D4", "H1", "MT"]);
    expect(soakers(d, 5).sort()).toEqual(["D1", "D3", "H2", "OT"]);
    expect(held(d, 0).OT).toBe("circle"); // helpers keep their first spell until set 4
    expect(held(d, 3).MT).toBe("cone"); // set-8 spell, held through sets 4-7
    expect(held(d, 7).OT).toBeUndefined();
    expect(held(d, 8)).toEqual({});
  });

  it("builds one step per set, bait and swap for method ①, and shows spells", () => {
    const m = p2.mechanics.find((x) => x.id === "p2-forsaken")!;
    const steps = stepsInPull(m, p2.mechanics, geometry, { variant: "method-1", deal: "c", end: "future" });
    expect(steps.map((s) => s.state.id)).toEqual(["raidwide", "spells", "set-1", "set-2", "bait-2", "set-3", "swap-1", "set-4", "bait-4", "set-5", "set-6", "bait-6", "set-7", "swap-2", "set-8", "final-bait", "final-dodge"]);
    const s1 = steps.find((s) => s.state.id === "set-1")!.scene!;
    expect(Object.keys(s1.positions!).length).toBe(8);
    expect(s1.spells?.H2).toEqual({ spell: "stack", resolving: true });
    expect(s1.spells?.MT).toEqual({ spell: "cone", resolving: false });
    const swap = steps.find((s) => s.state.id === "swap-1")!.scene!;
    expect(swap.signs?.D1).toBe("bind1");
    expect(swap.positions?.D1?.method).toBe("carried");
    const bait = steps.find((s) => s.state.id === "bait-2")!.scene!;
    // Future's End: opposite the next towers (set 3, turned 90° clockwise from set 1), so north turns to east.
    expect(bait.positions?.MT?.at).toEqual(rotate([0, 0.33], 90));
    expect(bait.positions?.MT?.at[0]).toBeGreaterThan(0.3);
    const m2 = stepsInPull(m, p2.mechanics, geometry, { variant: "method-2", deal: "yan", end: "past" });
    expect(m2.map((s) => s.state.id)).toEqual(["raidwide", "spells", "odd-towers-2", "even-towers-2", "all-things-ending", "mark-after-3"]);
  });

  it("turns each set 45° the chosen way and draws Kefka's cleave away from the towers", () => {
    const m = p2.mechanics.find((x) => x.id === "p2-forsaken")!;
    const at = (turn: string, id: string) => stepsInPull(m, p2.mechanics, geometry, { variant: "method-1", deal: "yan", end: "past", turn }).find((s) => s.state.id === id)!.scene!;
    const slots = geometry.forsaken!.slots;
    const s1 = at("cw", "set-1");
    expect(s1.positions?.MT?.at).toEqual(slots.odd["left-top"]!.at); // set 1 drawn at south, unturned
    expect(s1.frameLabel).toBe("set 1 · drawn at south");
    // Set 2, clockwise: MT (left tower, cone on top in Yan's run) turned 45° clockwise; anticlockwise the other way.
    const lt = slots.even["left-top"]!.at;
    expect(at("cw", "set-2").positions?.MT?.at).toEqual(rotate(lt, 45));
    expect(at("ccw", "set-2").positions?.MT?.at).toEqual(rotate(lt, -45));
    expect(at("ccw", "set-7").frameLabel).toBe("set 7 · 270° anticlockwise from set 1");
    // Towers of set 2 sit 45° round from set 1's; the dashed ghost shows set 1's.
    const s2 = at("cw", "set-2");
    const towers = s2.shapes!.filter((s) => s.type === "towers");
    expect(towers.map((t) => t.kind)).toEqual(["ghost", "tower"]);
    // A clockwise turn of the SW/SE pair moves SW to W (west) and SE to S.
    if (towers[1]!.type === "towers") expect(towers[1]!.centres[1]![0]).toBeCloseTo(0, 2);
    // Kefka's All Things Ending on set 3 is the half away from the towers, turned with them.
    const ate = at("cw", "set-3").shapes!.find((s) => s.type === "halfroom");
    expect(ate && ate.type === "halfroom" ? [ate.fromDeg, ate.toDeg] : null).toEqual([0, 180]);
  });
});
