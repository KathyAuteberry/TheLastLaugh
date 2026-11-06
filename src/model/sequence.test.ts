import { describe, expect, it } from "vitest";
import { geometry, p1 } from "../data";
import type { Role } from "./types";
import { ROLES } from "./types";
import { buildPull, buildSteps, stepsInPull } from "./sequence";
import { allSelections, clearance, defaultSelection, resolveScene, variationsFor } from "./variants";
import { tileCells, tilesOf } from "./arrows";

const gi1 = p1.mechanics.find((m) => m.id === "p1-graven-image-1")!;

describe("buildSteps", () => {
  it("includes exactly one Fire/Ice state per branch, in data order", () => {
    const spec = variationsFor(gi1, geometry);
    for (const b of gi1.branches!) {
      const steps = buildSteps(gi1, geometry, { ...spec.branches[b.id]!, thunder: "true" });
      const branched = steps.filter((s) => s.state.branch);
      expect(branched.map((s) => s.state.branch)).toEqual([b.id]);
      expect(steps.map((s) => s.state.id)[0]).toBe("tether-knockback");
      expect(steps.at(-1)!.state.id).toBe("mystery-magic");
    }
  });

  it("attaches measured scenes by mechanic/state key", () => {
    const steps = buildSteps(gi1, geometry, { fire: "spread", ice: "lie", thunder: "true" });
    expect(steps.find((s) => s.state.id === "spread-ice-lie")!.scene?.image).toBe("yan-p1-01");
    expect(steps.find((s) => s.state.id === "tether-knockback")!.scene?.knockbackPrep).toBeDefined();
  });

  it("every measured scene places only roles, never unverified text positions as exact", () => {
    for (const [key, scene] of Object.entries(geometry.scenes)) {
      const [mid, sid] = key.split("/");
      const state = p1.mechanics.find((m) => m.id === mid)!.states.find((s) => s.id === sid)!;
      for (const role of Object.keys(scene.positions ?? {})) {
        const claim = state.positions[role as keyof typeof state.positions];
        if (claim) expect(claim.status, `${key} ${role}`).not.toBe("unverified");
      }
    }
  });
});

describe("variations and dodge", () => {
  const tele = p1.mechanics.find((m) => m.id === "p1-tele-trouncing")!;

  it("every combination gives a full step list with exactly one variant of each variable shape", () => {
    for (const m of [gi1, tele]) {
      const spec = variationsFor(m, geometry);
      for (const sel of allSelections(spec)) {
        const steps = buildSteps(m, geometry, sel);
        expect(steps.length).toBeGreaterThan(0);
        expect(steps.filter((s) => s.state.branch).length).toBe(1);
      }
    }
  });

  it("keeps Yan's spots where Yan's own example applies (GI1: Ice true + Thunder true)", () => {
    const raw = geometry.scenes["p1-graven-image-1/mystery-magic"]!;
    const out = resolveScene(raw, { fire: "spread", ice: "true", ice2: "true", thunder: "true" })!;
    for (const [r, p] of Object.entries(raw.positions!)) expect(out.positions![r as Role]!.at).toEqual(p!.at);
  });

  it("every drawn role is clear of where it really hits, for every combination", () => {
    for (const [key, m] of [["p1-graven-image-1/mystery-magic", gi1], ["p1-tele-trouncing/final-spread", tele], ["p1-tele-trouncing/final-stack", tele]] as const) {
      const raw = geometry.scenes[key]!;
      for (const sel of allSelections(variationsFor(m, geometry))) {
        const out = resolveScene(raw, sel)!;
        for (const [r, p] of Object.entries(out.positions ?? {})) {
          expect(clearance(out.shapes ?? [], p!.at), `${key} ${JSON.stringify(sel)} ${r}`).toBeGreaterThanOrEqual(raw.dodge!.margin - 1e-9);
          expect(p!.alt).toBeUndefined();
        }
        expect(Object.keys(out.positions ?? {}).length + Object.keys(out.unplaced ?? {}).length).toBe(8);
      }
    }
  });
});

import { abilityName, entriesFor, eventsFor } from "./mitigation";

describe("mitigation", () => {
  it("never shows a carry-over as a press, and filters tank job variants", () => {
    const ev = eventsFor("p1-graven-image-1", "beam-line")[0]!;
    const war = entriesFor(ev.id, { role: "MT", tankJob: "WAR" });
    expect(war.map((x) => [x.action, x.ability])).toEqual([["press", "Party Mit"]]);
    const gnb = entriesFor(ev.id, { role: "MT", tankJob: "GNB" });
    expect(gnb.map((x) => [x.action, x.ability, x.carriedFromEventId])).toEqual([["carry-over", "Party Mit", "ik-p1-0038"]]);
  });

  it("hides cells the owner chose to ignore", () => {
    const ev = eventsFor("p1-light-of-judgment-1")[0]!;
    expect(entriesFor(ev.id, {}).some((x) => x.slot === "Extras")).toBe(false);
  });

  it("shows real ability names for the selected job, Ikuya's term otherwise", () => {
    const party = { slot: "MT" as const, ability: "Party Mit" };
    expect(abilityName(party, { role: "MT" })).toBe("Party Mit");
    expect(abilityName(party, { role: "MT", tankJob: "DRK" })).toBe("Dark Missionary");
    expect(abilityName(party, { role: "MT", tankJob: "PLD" })).toBe("Divine Veil + Passage of Arms");
    expect(abilityName({ slot: "OT", ability: "Kitchen Sink" }, { role: "OT", tankJob: "DRK" })).toBe("Rampart + Shadowed Vigil + The Blackest Night + Oblation + Dark Mind");
    expect(abilityName({ slot: "OT", ability: "Kitchen Sink" }, { role: "OT", tankJob: "DRK" })).not.toMatch(/Reprisal/);
    expect(abilityName({ slot: "D3", ability: "Party Mit" }, { role: "D3", dpsJob: "DNC" })).toBe("Shield Samba");
    expect(abilityName({ slot: "D3", ability: "Party Mit" }, { role: "D3" })).toBe("Party Mit");
    expect(abilityName({ slot: "SGE", ability: "Zoe Shields" }, {})).toBe("Zoe + Eukrasian Prognosis II");
    expect(abilityName({ slot: "MT", ability: "Reprisal" }, { role: "MT", tankJob: "WAR" })).toBe("Reprisal");
  });
});

describe("carried spots across the pull", () => {
  it("every diagram in the pull places all 8 roles, for every variation", () => {
    for (const m of p1.mechanics)
      for (const sel of allSelections(variationsFor(m, geometry)))
        for (const st of buildPull(p1.mechanics, geometry, { [m.id]: sel }))
          if (st.scene) expect(Object.keys(st.scene.positions ?? {}).sort(), `${st.key} ${JSON.stringify(sel)}`).toHaveLength(8);
  });

  it("a carried role stands exactly where the previous step left it", () => {
    const pull = buildPull(p1.mechanics, geometry);
    for (let i = 1; i < pull.length; i++) {
      const cur = pull[i]!.scene, prev = pull.slice(0, i).reverse().find((s) => s.scene)?.scene;
      for (const [r, p] of Object.entries(cur?.positions ?? {}))
        if (p?.method === "carried") expect(p.at, `${pull[i]!.key} ${r}`).toEqual(prev!.positions![r as Role]!.at);
    }
  });

  it("starts south, then MT north of the boss and everyone else on their approximate Graven Image I side", () => {
    const pull = buildPull(p1.mechanics, geometry);
    expect(pull[0]!.key).toBe("p1-revolting-ruin-iii-1/pull#0");
    for (const [r, p] of Object.entries(pull[0]!.scene!.positions!)) expect(p!.at[1], r).toBeLessThan(0);
    const pos = pull[1]!.scene!.positions!;
    expect(pos.MT!.at[1]).toBeGreaterThan(0);
    for (const r of ["OT", "H1", "H2"] as Role[]) expect(pos[r]!.at[0], r).toBeLessThan(0);
    for (const r of ["D1", "D2", "D3", "D4"] as Role[]) expect(pos[r]!.at[0], r).toBeGreaterThan(0);
    // The Ruin III cone (north, 90°) misses everyone but MT.
    expect(pull[2]!.key).toBe("p1-revolting-ruin-iii-1/cast");
    for (const [r, p] of Object.entries(pull[2]!.scene!.positions!)) if (r !== "MT") expect(p!.at[1] < Math.abs(p!.at[0]), r).toBe(true);
  });

  it("the guide shows the same carried spots as the pull", () => {
    const loj = p1.mechanics.find((m) => m.id === "p1-light-of-judgment-1")!;
    const inGuide = stepsInPull(loj, p1.mechanics, geometry, {})[0]!.scene!.positions;
    const inPull = buildPull(p1.mechanics, geometry).find((s) => s.key === "p1-light-of-judgment-1/raidwide")!.scene!.positions;
    expect(inGuide).toEqual(inPull);
  });
});

describe("Tele-trouncing arrows", () => {
  const tele = p1.mechanics.find((m) => m.id === "p1-tele-trouncing")!;
  for (const arrows of ["th-different", "th-same"]) {
    it(`each role drops its two arrows on its own tile frame, short timer first (${arrows})`, () => {
      const steps = buildPull(p1.mechanics, geometry, { [tele.id]: { ...defaultSelection(variationsFor(tele, geometry)), arrows } });
      const dealt = steps.find((s) => s.key === "p1-tele-trouncing/arrows#0")!.scene!;
      const before = steps[steps.findIndex((s) => s.key === "p1-tele-trouncing/arrows#0") - 1]!.scene!;
      for (const r of ROLES) expect(dealt.positions![r]!.at).toEqual(before.positions![r]!.at); // nobody moves yet
      expect(dealt.arrowState!.drops).toHaveLength(0);
      expect(Object.keys(dealt.arrowState!.pairs)).toHaveLength(8);
      const first = steps.find((s) => s.key === "p1-tele-trouncing/arrows#1")!.scene!;
      const second = steps.find((s) => s.key === "p1-tele-trouncing/arrows")!.scene!;
      const tiles = tilesOf(second)!;
      const frames = new Set<number>();
      for (const r of ROLES) {
        const pair = second.arrowState!.pairs[r]!;
        const mine = second.arrowState!.drops.filter((d) => d.role === r).sort((a, b) => a.index - b.index);
        expect(mine.map((d) => d.frame)[0]).toBe(mine[1]!.frame);
        frames.add(mine[0]!.frame);
        const f = tiles.frames[mine[0]!.frame]!;
        expect(f.arrows[mine[0]!.cell]).toBe(pair[0]);
        expect(f.arrows[mine[1]!.cell]).toBe(pair[1]);
        expect(mine[0]!.cell).not.toBe(mine[1]!.cell);
        expect(first.positions![r]!.at).toEqual(tileCells(f)[mine[0]!.cell]!.map((v) => Math.round(v * 1000) / 1000));
        expect(second.positions![r]!.at).toEqual(tileCells(f)[mine[1]!.cell]!.map((v) => Math.round(v * 1000) / 1000));
        // Same arrows → red frame, different → blue.
        expect(f.colour).toBe(pair[0] === pair[1] ? "red" : "blue");
        const support = ["MT", "OT", "H1", "H2"].includes(r);
        expect(pair[0] === pair[1]).toBe(arrows === "th-same" ? support : !support);
      }
      expect(frames.size).toBe(8);
      expect(first.arrowState!.drops).toHaveLength(8);
      // Later steps that draw the tiles keep all 16 arrows on the ground.
      expect(steps.find((s) => s.key === "p1-tele-trouncing/tele-spread")!.scene!.arrowState!.drops).toHaveLength(16);
    });
  }
});

describe("Hyperdrive #2", () => {
  it("leaves MT on the tank spot and puts everyone else in the south half", () => {
    const hd = buildPull(p1.mechanics, geometry).find((s) => s.key === "p1-hyperdrive-2/hits")!.scene!;
    expect(hd.positions!.MT!.at[1]).toBeGreaterThan(0);
    for (const r of ROLES.filter((x) => x !== "MT")) expect(hd.positions![r]!.at[1], r).toBeLessThan(0);
  });
});

describe("Tele-trouncing confusion", () => {
  const tele = p1.mechanics.find((m) => m.id === "p1-tele-trouncing")!;
  const TH: Role[] = ["MT", "OT", "H1", "H2"];
  for (const confused of ["th", "dps"]) {
    it(`each confused player takes their quadrant's four arrows, the rest stay put (${confused})`, () => {
      const steps = buildPull(p1.mechanics, geometry, { [tele.id]: { ...defaultSelection(variationsFor(tele, geometry)), confused } });
      const spread = steps.find((s) => s.key === "p1-tele-trouncing/tele-spread")!.scene!;
      const keys = [0, 1, 2, 3].map((k) => `p1-tele-trouncing/confusion#${k}`).concat("p1-tele-trouncing/confusion");
      const scenes = keys.map((k) => steps.find((s) => s.key === k)!.scene!);
      const who = ROLES.filter((r) => TH.includes(r) === (confused === "th"));
      const tiles = tilesOf(scenes[0])!;
      // Stepped in: on a cell, between them and their nearest party member.
      for (const r of who) {
        const p = spread.positions![r]!.at;
        const q = scenes[0]!.positions![r]!.at;
        expect(tiles.frames.some((f) => tileCells(f).some((c) => Math.hypot(c[0] - q[0], c[1] - q[1]) < 1e-3)), r).toBe(true);
        expect(Math.hypot(q[0] - p[0], q[1] - p[1])).toBeLessThan(0.4); // at most about 7 y
      }
      for (const r of ROLES.filter((x) => !who.includes(x)))
        for (const sc of scenes) expect(sc.positions![r]!.at, r).toEqual(spread.positions![r]!.at);
      const last = scenes.at(-1)!.arrowState!;
      expect(last.taken).toHaveLength(16);
      expect(new Set(last.taken!.map((t) => `${t.frame}/${t.cell}`)).size).toBe(16);
      expect(last.drops).toHaveLength(16);
      for (const r of who) expect(last.hops!.filter((h) => h.role === r)).toHaveLength(4);
    });
  }
});
