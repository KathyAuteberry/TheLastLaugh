// Validates data/phases/*.json against schema/phase.schema.json plus project invariants,
// then writes docs/COMPLETION.md. Exit code 1 on any error.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import Ajv2020 from "ajv/dist/2020.js";

const root = new URL("..", import.meta.url).pathname;
const read = (p) => JSON.parse(readFileSync(root + p, "utf8"));

const schema = read("schema/phase.schema.json");
const registry = read("data/sources.json");
const ajv = new Ajv2020({ allErrors: true, strict: true });
ajv.addFormat("date", /^\d{4}-\d{2}-\d{2}$/);
const validate = ajv.compile(schema);

const errors = [];
const err = (file, path, msg) => errors.push(`${file} ${path}: ${msg}`);
const knownRefs = new Set([...Object.keys(registry.sources), ...Object.keys(registry.images)]);

// Registry integrity
for (const [id, s] of Object.entries(registry.sources)) {
  if (s.parent && !registry.sources[s.parent]) err("sources.json", id, `unknown parent ${s.parent}`);
}
for (const [id, img] of Object.entries(registry.images)) {
  if (!registry.sources[img.parent]) err("sources.json", id, `unknown parent ${img.parent}`);
  if (!img.shows) err("sources.json", id, "image has no 'shows' description");
}

// Walk every object that looks like a Claim: { value, status, sources }
function* claims(node, path = "") {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) yield* claims(node[i], `${path}[${i}]`);
  } else if (node && typeof node === "object") {
    if ("status" in node && "sources" in node && "value" in node) yield [path, node];
    for (const [k, v] of Object.entries(node)) yield* claims(v, `${path}.${k}`);
  }
}

const matrix = [];
const files = readdirSync(root + "data/phases").filter((f) => f.endsWith(".json")).sort();
for (const f of files) {
  const data = read("data/phases/" + f);
  if (!validate(data)) {
    for (const e of validate.errors) err(f, e.instancePath || "/", `${e.message} ${JSON.stringify(e.params)}`);
    continue;
  }
  const ids = new Set(data.mechanics.map((m) => m.id));
  if (ids.size !== data.mechanics.length) err(f, "mechanics", "duplicate mechanic id");
  const orders = data.mechanics.map((m) => m.order);
  if (new Set(orders).size !== orders.length) err(f, "mechanics", "duplicate order");

  for (const m of data.mechanics) {
    const base = `/mechanics/${m.id}`;
    if (m.phase !== data.phase) err(f, base, "phase mismatch");
    if (m.occursWithin && !ids.has(m.occursWithin)) err(f, base, `occursWithin unknown id ${m.occursWithin}`);
    const branchIds = new Set((m.branches ?? []).map((b) => b.id));
    const stateIds = new Set();
    for (const s of m.states) {
      if (stateIds.has(s.id)) err(f, `${base}/states/${s.id}`, "duplicate state id");
      stateIds.add(s.id);
      if (s.branch && !branchIds.has(s.branch)) err(f, `${base}/states/${s.id}`, `unknown branch ${s.branch}`);
      for (const img of s.images ?? []) if (!registry.images[img]) err(f, `${base}/states/${s.id}`, `unknown image ${img}`);
    }

    let total = 0, open = 0;
    const tally = { "verified": 0, "source-stated": 0, "derived": 0, "derived-from-image": 0, "unverified": 0 };
    let notInvolved = 0;
    for (const [p, c] of claims(m)) {
      total++;
      tally[c.status]++;
      if (c.status === "unverified") open++;
      if (c.notInvolved) {
        notInvolved++;
        if (c.value !== null) err(f, base + p, "notInvolved claim must have value null");
        if (c.status === "unverified") err(f, base + p, "notInvolved claim needs evidence (status other than 'unverified')");
      } else if (c.value === null && c.status !== "unverified") err(f, base + p, "null value must be 'unverified'");
      if (c.status !== "unverified" && c.sources.length === 0) err(f, base + p, `status '${c.status}' needs at least one source`);
      if (c.status === "verified" && m.ownerVerification.state !== "approved")
        err(f, base + p, "'verified' claims only allowed after owner approval");
      for (const s of c.sources) if (!knownRefs.has(s.ref)) err(f, base + p, `unknown source ref ${s.ref}`);
      if (c.value && typeof c.value === "object" && "polar" in c.value && c.status === "unverified")
        err(f, base + p, "unverified position must not carry coordinates");
    }
    if (m.ownerVerification.state === "approved" && open > 0) err(f, base, "approved mechanic still has unverified claims");
    matrix.push({ phase: m.phase, order: m.order, id: m.id, en: m.names.en.value ?? "?", ja: m.names.ja, total, open, tally, notInvolved, owner: m.ownerVerification.state });
  }
}

// ---------- Mitigation (Ikuya): generated data + hand-authored overlay ----------
const mechStates = new Map(); // mechanic id -> Set(state ids)
for (const f of files) for (const m of read("data/phases/" + f).mechanics ?? []) mechStates.set(m.id, new Set(m.states.map((s) => s.id)));
const mechBranches = new Map(); // mechanic id -> Set(branch ids)
for (const f of files) for (const m of read("data/phases/" + f).mechanics ?? []) mechBranches.set(m.id, new Set((m.branches ?? []).map((b) => b.id)));
const mitRows = [];
const sec = (t) => { const [m, s] = t.split(":").map(Number); return m * 60 + s; };
const STATUSES = new Set(["verified", "source-stated", "derived", "derived-from-image", "unverified"]);
const mitFiles = readdirSync(root + "data/mitigation").filter((f) => f.endsWith(".ikuya.json")).sort();
// Real ability names: every term must resolve, and every Ikuya ability must be either a mapped term or a verified real name.
const abil = read("data/mitigation/abilities.json");
const JOBS_BY_SLOT = { MT: ["WAR", "PLD", "DRK", "GNB"], OT: ["WAR", "PLD", "DRK", "GNB"], D3: ["BRD", "MCH", "DNC"] };
if (abil.owner === "approved" && !abil.ownerDate) err("abilities.json", "owner", "approved needs ownerDate");
for (const [k, t] of Object.entries(abil.terms)) {
  if (!t.slots?.length || !(t.allJobs || t.byJob)) err("abilities.json", k, "needs slots and allJobs or byJob");
  for (const s of t.byJob ? t.slots : []) for (const j of JOBS_BY_SLOT[s] ?? []) if (!t.byJob[j]?.length) err("abilities.json", k, `no abilities for ${j}`);
  for (const list of [t.allJobs ?? [], ...Object.values(t.byJob ?? {})]) for (const a of list) if (!a.ability || !(a.level > 0)) err("abilities.json", k, "ability needs name and level");
}
const realNames = new Set(abil.alreadyRealNames.verified);
// Durations (Job Guide) for the replay's mitigation lanes: every real ability needs one, chosen from what the page lists.
const durs = abil.durations?.byAbility ?? {};
const realAbilityNames = new Set([...abil.alreadyRealNames.verified, ...Object.values(abil.terms).flatMap((t) => [t.allJobs ?? [], ...Object.values(t.byJob ?? {})].flat().map((a) => a.ability))]);
for (const n of realAbilityNames) if (!durs[n]) err("abilities.json", n, "no Job Guide duration");
for (const [n, d] of Object.entries(durs)) {
  if (!["source-stated", "derived"].includes(d.status)) err("abilities.json", n, "duration status must be source-stated or derived");
  if (d.sec !== null && !d.jobGuideDurations?.includes(d.sec)) err("abilities.json", n, `duration ${d.sec}s is not one the Job Guide lists`);
  if (d.status === "derived" && !d.note) err("abilities.json", n, "a chosen duration (several listed) needs a note");
  if (d.sec === null && !d.note) err("abilities.json", n, "no duration needs a note");
}
for (const f of mitFiles) for (const e of read("data/mitigation/" + f).entries) {
  if (e.action === "flag") continue;
  const mapped = Object.entries(abil.terms).some(([k, t]) => (t.ikuyaTerm ?? k) === e.ability && t.slots.includes(e.slot));
  if (!mapped && !realNames.has(e.ability)) err("abilities.json", e.cell, `Ikuya ability "${e.ability}" (${e.slot}) has no real-name mapping`);
}
for (const f of mitFiles) {
  const gen = read("data/mitigation/" + f);
  const ovName = f.replace(".ikuya.json", ".overlay.json");
  const ov = read("data/mitigation/" + ovName);
  const events = new Map(gen.events.map((e) => [e.id, e]));
  if (events.size !== gen.events.length) err(f, "events", "duplicate event id");
  for (const e of gen.events) {
    if (!/^\d+:\d{2}$/.test(e.time.absolute)) err(f, e.id, `bad time ${e.time.absolute}`);
    for (const mk of e.footnotes) if (!gen.sheets[e.sheet].footnotes[mk]) err(f, e.id, `footnote ${mk} undefined`);
    const link = ov.links[e.id];
    if (!link) { err(ovName, e.id, "event has no mechanic link (sheet changed?)"); continue; }
    if (!mechStates.has(link.mechanic)) err(ovName, e.id, `unknown mechanic ${link.mechanic}`);
    else if (link.state && !mechStates.get(link.mechanic).has(link.state)) err(ovName, e.id, `unknown state ${link.state}`);
    if (!STATUSES.has(link.status)) err(ovName, e.id, `bad status ${link.status}`);
    if (link.status === "verified") err(ovName, e.id, "links are confirmed via ownerVerification, not 'verified'");
    if (link.status !== "unverified" && !(link.sources ?? []).length) err(ovName, e.id, "link needs a source");
    for (const s of link.sources ?? []) if (!knownRefs.has(s.ref)) err(ovName, e.id, `unknown source ref ${s.ref}`);
    if (link.owner && !["approved", "rejected", "unsure"].includes(link.owner)) err(ovName, e.id, `bad owner state ${link.owner}`);
    if (link.owner === "approved" && link.status === "unverified") err(ovName, e.id, "approved link cannot be unverified");
    if (link.owner && !/^\d{4}-\d{2}-\d{2}$/.test(link.ownerDate ?? "")) err(ovName, e.id, "owner decision needs ownerDate");
    mitRows.push({ event: e, link });
  }
  for (const id of Object.keys(ov.links)) if (!events.has(id)) err(ovName, id, "link for an event that no longer exists (sheet changed?)");
  for (const x of gen.entries) {
    const ev = events.get(x.eventId);
    if (!ev) { err(f, x.cell, `unknown event ${x.eventId}`); continue; }
    for (const mk of x.footnotes) if (!gen.sheets[ev.sheet].footnotes[mk]) err(f, x.cell, `footnote ${mk} undefined`);
    if (x.action === "flag") {
      const cellRef = x.cell;
      if (!Object.values(ov.decisions ?? {}).some((d) => d.cell === cellRef)) err(f, x.cell, "unexplained flag: add a decision in the overlay");
      continue;
    }
    if (x.action === "carry-over") {
      const from = events.get(x.carriedFromEventId);
      if (!from) err(f, x.cell, "carry-over without origin");
      else {
        if (from.sheet !== ev.sheet) err(f, x.cell, "carry-over origin on another sheet");
        if (sec(from.time.absolute) >= sec(ev.time.absolute)) err(f, x.cell, "carry-over origin is not earlier");
        const pressed = gen.entries.some((y) => y.eventId === from.id && y.slot === x.slot && y.ability === x.ability && y.action === "press"
          && (JSON.stringify(y.jobVariant) === JSON.stringify(x.jobVariant) || y.jobVariant === null)); // a job-limited carry-over may follow a press for all jobs
        if (!pressed) err(f, x.cell, `origin ${from.id} has no press of ${x.ability} in ${x.slot}`);
      }
    } else if ("carriedFromEventId" in x) err(f, x.cell, `${x.action} must not have carriedFromEventId`);
  }
}

// ---------- Geometry (measured from Yan diagrams) ----------
const ROLESET = new Set(["MT", "OT", "H1", "H2", "D1", "D2", "D3", "D4"]);
const inRange = (p) => Array.isArray(p) && p.length === 2 && p.every((v) => typeof v === "number" && Math.abs(v) <= 1.3);
for (const f of readdirSync(root + "data/geometry").filter((x) => x.endsWith(".json"))) {
  const g = read("data/geometry/" + f);
  for (const [k, p] of Object.entries(g.waymarks.points)) if (!inRange(p)) err(f, `waymark ${k}`, "out of range");
  // Variation groups: every text branch maps to a valid selection.
  const groupsOf = (mid) => g.variations?.[mid]?.groups ?? (mechBranches.get(mid)?.size ? [{ id: "variant", options: [...mechBranches.get(mid)].map((id) => ({ id })) }] : []);
  const checkSel = (where, mid, sel) => {
    const gs = groupsOf(mid);
    for (const [k, val] of Object.entries(sel ?? {})) {
      const grp = gs.find((x) => x.id === k);
      if (!grp) err(f, where, `unknown variation group ${k}`);
      else if (!grp.options.some((o) => o.id === val)) err(f, where, `unknown option ${k}=${val}`);
    }
  };
  for (const [mid, spec] of Object.entries(g.variations ?? {})) {
    if (!mechStates.has(mid)) err(f, `variations/${mid}`, "unknown mechanic");
    for (const b of mechBranches.get(mid) ?? []) if (!spec.branches?.[b]) err(f, `variations/${mid}`, `text branch ${b} has no selection`);
    for (const [b, sel] of Object.entries(spec.branches ?? {})) {
      if (!mechBranches.get(mid)?.has(b)) err(f, `variations/${mid}`, `unknown branch ${b}`);
      checkSel(`variations/${mid}/${b}`, mid, sel);
    }
  }
  if (g.forsaken) {
    // Forsaken deals must follow the rules the solver (src/model/forsaken.ts) assumes.
    const fz = g.forsaken;
    const PAIR = { MT: "H1", H1: "MT", OT: "H2", H2: "OT", D1: "D3", D3: "D1", D2: "D4", D4: "D2" };
    const sup = (r) => r[0] !== "D";
    for (const [lay, slots] of Object.entries(fz.slots ?? {}))
      for (const [k, p] of Object.entries(slots)) {
        if (!inRange(p.at)) err(f, `forsaken/slots/${lay}/${k}`, "out of range");
        if (!["auto", "eye", "copy", "loose"].includes(p.method)) err(f, `forsaken/slots/${lay}/${k}`, "bad method");
      }
    const dealGroup = g.variations?.["p2-forsaken"]?.groups.find((x) => x.id === "deal");
    for (const o of dealGroup?.options ?? []) if (!fz.deals?.[o.id]) err(f, "forsaken", `deal option ${o.id} has no deal`);
    for (const [id, dl] of Object.entries(fz.deals ?? {})) {
      const w = `forsaken/deals/${id}`;
      if (!dealGroup?.options.some((o) => o.id === id)) err(f, w, "not offered in the deal variation group");
      if (!dl.label || !dl.note || !dl.sources?.length) err(f, w, "needs label, note, sources");
      for (const s of dl.sources ?? []) if (!knownRefs.has(s.ref)) err(f, w, `unknown source ${s.ref}`);
      if (dl.sets?.length !== 8) { err(f, w, "needs 8 sets"); continue; }
      const stacks0 = Object.keys(dl.sets[0]).filter((r) => dl.sets[0][r] === "stack");
      if (stacks0.length !== 2 || sup(stacks0[0]) === sup(stacks0[1])) err(f, w, "set 1: one support and one DPS stack");
      const tg = [...ROLESET].filter((r) => stacks0.includes(r) || stacks0.includes(PAIR[r]));
      dl.sets.forEach((set, i) => {
        const n = i + 1, who = Object.keys(set);
        const want = [1, 2, 3, 8].includes(n) ? tg : [...ROLESET].filter((r) => !tg.includes(r));
        if (who.length !== 4 || !want.every((r) => who.includes(r))) err(f, w, `set ${n}: soakers must be ${want.join(",")}`);
        const count = (s) => who.filter((r) => set[r] === s).length;
        if (n % 2 && !(count("stack") === 2 && count("cone") === 1 && count("circle") === 1)) err(f, w, `set ${n}: odd sets are 2 stacks, 1 cone, 1 circle`);
        if (!(n % 2) && !(count("cone") === 2 && count("circle") === 2)) err(f, w, `set ${n}: even sets are 2 cones, 2 circles`);
      });
      // Right after the cast: per role group one stack and three of the same kind; the two groups get opposite kinds.
      const initial = { ...dl.sets[3], ...dl.sets[0] };
      const kinds = [true, false].map((s) => [...ROLESET].filter((r) => sup(r) === s).map((r) => initial[r]).filter((x) => x !== "stack"));
      if (kinds.some((k) => k.length !== 3 || new Set(k).size !== 1) || kinds[0][0] === kinds[1][0]) err(f, w, "initial deal: each role group one stack + three of one kind, opposite kinds");
      const signs = dl.signs ?? {};
      if (Object.keys(signs).sort().join() !== [...tg].sort().join()) err(f, w, "signs: exactly the tower group");
      if (Object.values(signs).sort().join() !== "bind1,bind2,ignore1,ignore2") err(f, w, "signs: bind1, bind2, ignore1, ignore2 once each");
      for (const [r, s] of Object.entries(signs)) if ((s.startsWith("bind") ? "cone" : "circle") !== dl.sets[7][r]) err(f, w, `signs: ${r} ${s} does not match its set-8 spell`);
    }
  }
  for (const [mid, keys] of Object.entries(g.seeAlso ?? {})) {
    if (!mechStates.has(mid)) err(f, `seeAlso/${mid}`, "unknown mechanic");
    for (const k of keys) if (!g.scenes[k]) err(f, `seeAlso/${mid}`, `unknown scene ${k}`);
  }
  for (const [key, sc] of Object.entries(g.scenes)) {
    const [mid, sid] = key.split("/");
    if (!mechStates.has(mid)) err(f, key, "unknown mechanic");
    else if (!mechStates.get(mid).has(sid)) err(f, key, "unknown state");
    if (!sc.sources?.length) err(f, key, "scene needs sources");
    for (const s of sc.sources ?? []) if (!knownRefs.has(s.ref)) err(f, key, `unknown source ref ${s.ref}`);
    if (sc.image && !registry.images[sc.image]) err(f, key, `unknown image ${sc.image}`);
    for (const [r, p] of Object.entries(sc.positions ?? {})) {
      if (!ROLESET.has(r)) err(f, key, `bad role ${r}`);
      if (!inRange(p.at)) err(f, key, `${r} position out of range`);
      if (p.alt && !inRange(p.alt)) err(f, key, `${r} alt out of range`);
      if (!["auto", "eye", "copy", "loose"].includes(p.method)) err(f, key, `${r} bad method (derived and carried spots are computed, never stored)`);
      if (sc.unplaced?.[r]) err(f, key, `${r} both placed and unplaced`);
    }
    for (const r of sc.debuff ?? []) if (!ROLESET.has(r)) err(f, key, `debuff: bad role ${r}`);
    for (const fr of sc.frames ?? []) {
      for (const [r, p] of Object.entries(fr.positions ?? {})) { if (!ROLESET.has(r)) err(f, key, `frame: bad role ${r}`); if (!inRange(p.at)) err(f, key, `frame: ${r} out of range`); }
      for (const r of fr.debuff ?? []) if (!ROLESET.has(r)) err(f, key, `frame debuff: bad role ${r}`);
    }
    if (sc.carry && !sc.carry.note) err(f, key, "carry needs a note");
    const checkRoleSel = (where, rs) => {
      if (!Array.isArray(rs)) return err(f, key, `${where}: roles must be a list`);
      for (const x of rs) {
        if (typeof x === "string") { if (!ROLESET.has(x)) err(f, key, `${where}: bad role ${x}`); }
        else { checkSel(key, mid, x.when); for (const r of x.roles ?? []) if (!ROLESET.has(r)) err(f, key, `${where}: bad role ${r}`); }
      }
    };
    if (sc.knockbackPrep) {
      const k = sc.knockbackPrep;
      if (!((Array.isArray(k.from) && k.from.length === 2 && k.from.every((v) => Math.abs(v) <= 3)) && k.distance > 0 && k.minGap >= 0 && k.note)) err(f, key, "knockbackPrep needs from, distance, minGap, note");
      checkRoleSel("knockbackPrep", k.roles);
    }
    if (sc.hedge) {
      if (!sc.hedge.note || !sc.hedge.target?.length) err(f, key, "hedge needs target and note");
      for (const t of sc.hedge.target ?? []) if (!g.scenes[t]) err(f, key, `hedge: unknown target scene ${t}`);
      const tm = sc.hedge.target?.[0]?.split("/")[0];
      for (const gid of sc.hedge.groups ?? []) if (!groupsOf(tm).some((x) => x.id === gid)) err(f, key, `hedge: unknown group ${gid} on ${tm}`);
    }
    if (sc.arrowDrops) {
      // Every option of the "arrows" group deals each role a pair; each pair fits exactly one tile frame, each frame used once.
      const ad = sc.arrowDrops;
      const tiles = (sc.shapes ?? []).find((s) => s.type === "tiles");
      if (!tiles) err(f, key, "arrowDrops needs a tiles shape");
      if ((sc.frames ?? []).length !== 2) err(f, key, "arrowDrops needs exactly two frames (debuffs go out, short-timer drops)");
      if (!sc.carry) err(f, key, "arrowDrops needs carry (nobody moves when the debuffs go out)");
      if (!ad.note || !ad.sources?.length) err(f, key, "arrowDrops needs note and sources");
      for (const s of ad.sources ?? []) if (!knownRefs.has(s.ref)) err(f, key, `arrowDrops: unknown source ${s.ref}`);
      const DIRS = new Set(["up", "down", "left", "right"]);
      const grp = groupsOf(mid).find((x) => x.id === "arrows");
      if (!grp) err(f, key, "arrowDrops needs an \"arrows\" variation group");
      for (const o of grp?.options ?? []) if (!(ad.assign ?? []).some((a) => a.when?.arrows === o.id)) err(f, key, `arrowDrops: no deal for arrows=${o.id}`);
      for (const a of ad.assign ?? []) {
        checkSel(key, mid, a.when);
        const used = new Set();
        for (const r of ROLESET) {
          const pair = a.pairs?.[r];
          if (!(Array.isArray(pair) && pair.length === 2 && pair.every((d) => DIRS.has(d)))) { err(f, key, `arrowDrops: ${r} needs two arrows`); continue; }
          const fi = (tiles?.frames ?? []).findIndex((fr) => [...fr.arrows].sort().join() === [...pair].sort().join());
          if (fi < 0) err(f, key, `arrowDrops: no tile frame for ${r} ${pair}`);
          else if (used.has(fi)) err(f, key, `arrowDrops: tile frame ${fi} dealt twice`);
          used.add(fi);
        }
      }
    }
    if (sc.teleports) {
      // Confused roles per option of the "confused" group; frames = one per teleport before the last; carry for the rest.
      const tp = sc.teleports;
      if (!(sc.shapes ?? []).some((s) => s.type === "tiles")) err(f, key, "teleports needs a tiles shape");
      if (!(Number.isInteger(tp.hops) && tp.hops > 0) || (sc.frames ?? []).length !== tp.hops) err(f, key, "teleports: frames must number hops (stepped in, then teleports 1..hops-1)");
      if (!sc.carry) err(f, key, "teleports needs carry (the others stay put)");
      if (!tp.note || !tp.sources?.length) err(f, key, "teleports needs note and sources");
      for (const s of tp.sources ?? []) if (!knownRefs.has(s.ref)) err(f, key, `teleports: unknown source ${s.ref}`);
      const fromSc = g.scenes[tp.from];
      if (!fromSc) err(f, key, `teleports: unknown scene ${tp.from}`);
      else if (![...ROLESET].every((r) => fromSc.positions?.[r])) err(f, key, "teleports: the from scene must place all 8 roles");
      const grp = groupsOf(mid).find((x) => x.id === "confused");
      if (!grp) err(f, key, "teleports needs a \"confused\" variation group");
      for (const o of grp?.options ?? []) if (!tp.confused?.some((c) => c.when?.confused === o.id)) err(f, key, `teleports: no confused roles for confused=${o.id}`);
      for (const c of tp.confused ?? []) { checkSel(key, mid, c.when); for (const r of c.roles ?? []) if (!ROLESET.has(r)) err(f, key, `teleports: bad role ${r}`); }
    }
    for (const vp of sc.variantPositions ?? []) {
      checkSel(key, mid, vp.when);
      for (const [r, p] of Object.entries(vp.positions ?? {})) {
        if (!ROLESET.has(r)) err(f, key, `variantPositions: bad role ${r}`);
        if (!inRange(p.at)) err(f, key, `variantPositions: ${r} out of range`);
        if (!["auto", "eye", "copy", "loose"].includes(p.method)) err(f, key, `variantPositions: ${r} bad method`);
      }
    }
    if (sc.forsaken) {
      const fz = sc.forsaken;
      if (!g.forsaken) err(f, key, "forsaken scene without a forsaken spec");
      if (fz.at === "set") { if (!(fz.set >= 1 && fz.set <= 8)) err(f, key, "forsaken: set must be 1-8"); if (sc.positions) err(f, key, "forsaken set scenes are placed by the solver; store no positions"); }
      else if (fz.at === "held") { if (!(fz.after >= 0 && fz.after <= 8)) err(f, key, "forsaken: after must be 0-8"); }
      else err(f, key, "forsaken: at must be set or held");
    }
    for (const k of ["spells", "signs", "roleText", "frameLabel"]) if (sc[k]) err(f, key, `${k} is computed, never stored`);
    for (const s of sc.shapes ?? []) if (s.kind === "ghost") err(f, key, "ghost towers are computed, never stored");
    if (sc.dodge && !(sc.dodge.margin > 0 && sc.dodge.maxShift > 0 && sc.dodge.note)) err(f, key, "dodge needs margin, maxShift and note");
    if (sc.dodge?.melee && !(sc.dodge.melee.roles?.every((r) => ROLESET.has(r)) && sc.dodge.melee.maxRadius > 0 && sc.dodge.melee.note)) err(f, key, "dodge.melee needs roles, maxRadius and note");
    for (const s of sc.shapes ?? []) {
      if (s.when) checkSel(key, mid, s.when);
      for (const c of s.centres ?? []) if (!inRange(c)) err(f, key, `${s.type} centre out of range`);
      for (const c of [s.from, s.through, s.to, s.end].filter((x) => Array.isArray(x))) if (!inRange(c)) err(f, key, `${s.type} point out of range`);
      if (s.type === "bands") {
        if (!["nwse", "nesw"].includes(s.axis)) err(f, key, "bands: bad axis");
        for (const r of s.ranges ?? []) if (!(Array.isArray(r) && r.length === 2 && r[0] < r[1] && r.every((u) => Math.abs(u) <= 1.2))) err(f, key, "bands: bad range");
      }
      for (const r of s.targets ?? []) if (!sc.positions?.[r] && !sc.carry && !sc.knockbackPrep && !sc.hedge) err(f, key, `${s.type} target ${r} has no position`);
      for (const r of s.targets ?? []) if (!ROLESET.has(r)) err(f, key, `${s.type}: bad role ${r}`);
    }
  }
}

const geoRows = [];
for (const f of readdirSync(root + "data/geometry").filter((x) => x.endsWith(".json")))
  for (const [key, sc] of Object.entries(read("data/geometry/" + f).scenes)) {
    const methods = Object.values(sc.positions ?? {}).map((p) => p.method);
    geoRows.push(`| ${key} | ${sc.image ?? "—"} | ${methods.filter((m) => m === "auto").length} auto / ${methods.filter((m) => m !== "auto").length} eye-or-copy | ${sc.owner ?? "unreviewed"} |`);
  }

// ---------- Replay timeline (owner logs, then cactbot + BossMod Reborn) ----------
const tlRows = [];
for (const f of readdirSync(root + "data/timeline").filter((x) => x.endsWith(".json"))) {
  const tl = read("data/timeline/" + f);
  const geo = read(`data/geometry/p${tl.phase}.json`);
  const phase = read(`data/phases/p${tl.phase}.json`);
  for (const r of tl.sources ?? []) if (!registry.sources[r]) err(f, "sources", `unknown source ref ${r}`);
  if (!tl.end || typeof tl.end.t !== "number") err(f, "end", "needs t");
  else if (tl.end.source === "log" ? tl.end.log?.t !== tl.end.t : tl.end.source === "bmr" ? tl.end.bmr !== tl.end.t : tl.end.cactbot?.t !== tl.end.t || tl.end.cactbot?.line === "annotation") err(f, "end", "end time does not follow the source rule");
  else if (tl.end.log && tl.end.source !== "log") err(f, "end", "the logs time the end, so they are the source");
  // Every step the app can show, in order (frames before their state), must have exactly one entry.
  const expected = [];
  for (const m of [...phase.mechanics].sort((a, b) => a.order - b.order))
    for (const s of m.states) {
      const key = `${m.id}/${s.id}`;
      (geo.scenes[key]?.frames ?? []).forEach((_, i) => expected.push(`${key}#${i}`));
      expected.push(key);
    }
  for (const k of expected) if (!tl.steps[k]) err(f, k, "step has no timeline entry");
  for (const k of Object.keys(tl.steps)) if (!expected.includes(k)) err(f, k, "unknown step");
  // Source rule: the owner's logs whenever they time the moment; otherwise cactbot only with a line naming the
  // ability and BMR within 1 s; otherwise BMR; null = untimed.
  const okLog = (where, l) => {
    if (!(typeof l?.t === "number" && l.min <= l.t && l.t <= l.max && Number.isInteger(l.n) && l.n >= 1)) err(f, where, "log needs t, min ≤ t ≤ max and a pull count n");
  };
  const checkTiming = (where, e) => {
    if (e.log && e.source !== "log") err(f, where, "the logs time this moment, so they are the source");
    if (e.t === null) { if (e.source !== null) err(f, where, "untimed entry must have source null"); return; }
    if (typeof e.t !== "number" || e.t < Math.min(0, tl.motion?.start ?? 0) || e.t > tl.end.t) err(f, where, "t out of range");
    if (e.until !== undefined && !(e.until >= e.t)) err(f, where, "until before t");
    if (e.source === "log") {
      okLog(where, e.log);
      if (e.log?.t !== e.t) err(f, where, "source log but log.t differs");
      if (e.log?.until) { okLog(where + " until", e.log.until); if (e.log.until.t !== e.until) err(f, where, "until differs from log.until.t"); }
    } else if (e.source === "cactbot") {
      if (!e.cactbot || e.cactbot.t !== e.t) err(f, where, "source cactbot but cactbot.t differs");
      else if (e.cactbot.line === "annotation") err(f, where, "a cactbot annotation (no ability) cannot be the source");
      if (typeof e.bmr === "number" && Math.abs(e.bmr - e.t) > 1) err(f, where, `cactbot and BMR differ by ${Math.abs(e.bmr - e.t).toFixed(1)} s`);
    } else if (e.source === "bmr") {
      if (e.bmr !== e.t) err(f, where, "source bmr but bmr differs");
    } else if (e.source === "estimate") {
      if (!e.note) err(f, where, "an estimate needs a note saying how it was placed");
    } else err(f, where, `bad source ${e.source}`);
    if (e.cactbot && !["sync", "no-sync", "annotation"].includes(e.cactbot.line)) err(f, where, "bad cactbot line kind");
  };
  // Kefka castbars: length matches end − start (unless taken from a StartsUsing line), in order, never overlapping.
  let castEnd = -Infinity;
  for (const [i, c] of (tl.casts ?? []).entries()) {
    const where = `casts[${i}] ${c.ability}`;
    if (!c.ability || !c.ids?.length || !(c.length > 0)) err(f, where, "cast needs ability, ids and length");
    if (!["log", "starts-using", "end-minus-length"].includes(c.how)) err(f, where, "bad how");
    if (c.how === "log") {
      okLog(where + " start", c.log?.start); okLog(where + " end", c.log?.end);
      if (c.log?.start?.t !== c.start || c.log?.end?.t !== c.end) err(f, where, "start/end must be the log medians");
      if (Math.abs(c.end - c.start - c.length) > 0.15) err(f, where, "logged castbar and cast length disagree");
    }
    if (c.how === "end-minus-length" && Math.abs(c.end - c.start - c.length) > 0.05) err(f, where, "start is not end − length");
    if (c.how === "starts-using" && Math.abs(c.end - c.start - c.length) > 0.15) err(f, where, "StartsUsing start and cast length disagree");
    if (c.how !== "log" && c.cactbot?.t !== c.end) err(f, where, "end must be the cactbot ability time");
    if (typeof c.bmrStart === "number" && Math.abs(c.bmrStart - c.start) > 1) err(f, where, "BossMod Reborn start differs by over 1 s");
    if (c.start < castEnd) err(f, where, "overlaps the previous cast");
    if (c.start > tl.end.t && !(c.afterEnd && c.note)) err(f, where, "starts after the end of the phase (set afterEnd with a note)");
    castEnd = c.end;
  }
  let last = -1;
  for (const k of expected) {
    const e = tl.steps[k];
    if (!e) continue;
    checkTiming(k, e);
    if (typeof e.t === "number") { if (e.t < last) err(f, k, `out of order (${e.t} after ${last})`); last = e.t; }
    tlRows.push(`| ${k} | ${e.t ?? "≈"} | ${e.source ?? "—"} | ${e.log ? `${e.log.min}–${e.log.max} (${e.log.n})` : "—"} | ${e.cactbot ? `${e.cactbot.t} (${e.cactbot.line})` : "—"} | ${e.bmr ?? "—"} |`);
  }
  const mo = tl.motion;
  if (!(mo && mo.start < 0 && mo.reaction >= 0 && mo.runSpeed > 0 && mo.knockbackDelay >= 0 && mo.knockbackSeconds > 0 && mo.note)) err(f, "motion", "needs start < 0, reaction, runSpeed, knockbackDelay, knockbackSeconds, note");
  const mechOf = (k) => k.split("/")[0];
  const vgroups = (mid) => geo.variations?.[mid]?.groups ?? [];
  const okRoles = (where, rs, mid) => {
    if (rs === undefined || rs === "all-but-holders") return;
    if (!Array.isArray(rs)) return err(f, where, "roles must be a list");
    for (const x of rs) {
      if (typeof x === "string") { if (!ROLESET.has(x)) err(f, where, `bad role ${x}`); continue; }
      for (const [g2, o] of Object.entries(x.when ?? {})) if (!vgroups(mid).some((v) => v.id === g2 && v.options.some((op) => op.id === o))) err(f, where, `unknown option ${g2}=${o}`);
    }
  };
  for (const [k, e] of Object.entries(tl.steps)) {
    const mid = mechOf(k);
    for (const c of [e.cue, ...(e.hedges ?? [])].filter(Boolean)) {
      if (typeof c.t !== "number" || c.t < mo.start || (e.t !== null && c.t > e.t)) err(f, k, `cue/hedge time ${c.t} outside [start, step time]`);
      if (!c.what || !c.source) err(f, k, "cue/hedge needs what and source");
      okRoles(`${k} cue/hedge`, c.roles, mid);
    }
    for (const h of e.hedges ?? []) {
      for (const g2 of h.groups ?? []) if (!vgroups(mid).some((v) => v.id === g2)) err(f, k, `hedge: unknown group ${g2}`);
      for (const t of h.target ?? []) if (!tl.steps[t]) err(f, k, `hedge: unknown target ${t}`);
    }
    if (e.knockback) {
      const kb = e.knockback;
      if (!(kb.distance > 0 && kb.what && kb.source && (kb.from === "nearest-holder" || (Array.isArray(kb.from) && kb.from.length === 2 && kb.from.every((v) => Math.abs(v) <= 3))))) err(f, k, "knockback needs from, distance, what, source");
      okRoles(`${k} knockback`, kb.roles, mid);
    }
  }
  const ticks = new Map((tl.ticks ?? []).map((x) => [x.id, x]));
  for (const x of tl.ticks ?? []) checkTiming(`tick ${x.id}`, x);
  // Every Ikuya damage event is matched to a step or tick; more than 1.5 s apart needs a recorded reason.
  const ik = read(`data/mitigation/p${tl.phase}.ikuya.json`);
  for (const ev of ik.events) {
    const m = tl.ikuya?.[ev.id];
    if (!m) { err(f, `ikuya/${ev.id}`, "Ikuya event not matched to the timeline"); continue; }
    const target = tl.steps[m.at] ?? ticks.get(m.at);
    if (!target || typeof target.t !== "number") { err(f, `ikuya/${ev.id}`, `unknown or untimed target ${m.at}`); continue; }
    const gap = Math.abs(sec(ev.time.absolute) - target.t);
    if (gap > 1.5 && !m.gap) err(f, `ikuya/${ev.id}`, `Ikuya ${ev.time.absolute} vs ${target.t} (${gap.toFixed(1)} s): needs a 'gap' note`);
    if (gap <= 1.5 && m.gap) err(f, `ikuya/${ev.id}`, "gap note but times agree; remove it");
  }
  for (const id of Object.keys(tl.ikuya ?? {})) if (!ik.events.some((e) => e.id === id)) err(f, `ikuya/${id}`, "unknown Ikuya event");
  tlRows.unshift(`Owner review: **${tl.owner}**\n\n| Step | t (s) | source | logs: range (pulls) | cactbot | BossMod Reborn |\n|---|---|---|---|---|---|`);
}

// Completion matrix
const mitTable = mitRows
  .sort((a, b) => sec(a.event.time.absolute) - sec(b.event.time.absolute))
  .map(({ event: e, link: l }) => `| ${e.time.absolute} | ${e.name.replace(/\s*\n\s*/g, " ")} | ${e.sheet} | ${l.mechanic}${l.state ? " / " + l.state : ""} | ${l.status} | ${l.owner ?? "unreviewed"} |`);
const rows = matrix.map((r) => {
  const complete = r.open === 0 && r.owner === "approved";
  return `| P${r.phase} | ${r.order} | ${r.en} / ${r.ja} | ${r.tally["source-stated"]} | ${r.tally["derived"]} | ${r.tally["derived-from-image"]} | ${r.tally["unverified"]} | ${r.notInvolved} | ${r.owner} | ${complete ? "✅" : "❌"} |`;
});
writeFileSync(
  root + "docs/COMPLETION.md",
  `# Completion matrix\n\nGenerated by \`npm run validate\`. Do not edit by hand.\n\n` +
    `A mechanic is complete only when it has no unverified claims **and** the owner approved it. \"Not involved\" roles count as resolved but are still covered by the owner's approval.\n\n` +
    `| Phase | # | Mechanic | source-stated | derived | from-image | unverified | not involved | owner | complete |\n|---|---|---|---|---|---|---|---|---|---|\n` +
    rows.join("\n") + "\n" +
    `\n## Mitigation events (Ikuya)\n\nEach damage event from the sheet and the mechanic it is linked to. A link counts only when the owner approved it.\n\n` +
    `| Time | Event | Sheet | Mechanic / state | link status | owner |\n|---|---|---|---|---|---|\n` +
    mitTable.join("\n") + "\n" +
    `\n## Diagrams (measured scenes)\n\nEach drawn scene and how its positions were measured. A diagram counts only when the owner approved it.\n\n` +
    `| Scene | Yan image | positions | owner |\n|---|---|---|---|\n` + geoRows.join("\n") + "\n" +
    `\n## Replay timing (owner logs, then cactbot + BossMod Reborn)\n\nWhen each step resolves, in seconds from combat start: the median over the owner's logged pulls, with their range and count. ≈ = no source times it.\n\n` + tlRows.join("\n") + "\n"
);

if (errors.length) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} error(s)`);
  process.exit(1);
}
console.log(`OK: ${files.length} phase file(s), ${matrix.length} mechanic(s), ${mitRows.length} mitigation event(s). Wrote docs/COMPLETION.md`);
