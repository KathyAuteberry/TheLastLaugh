# Stage 3 checkpoint: diagram engine (Ruin III #1 + Graven Image I)

Run it: `npm run dev` → http://localhost:5173 (or `npm run build` for a static `dist/`).

## What's built
- Vite + React + TypeScript + Tailwind app. Reads `data/` directly; `npm run build` refuses to build if `npm run validate` fails.
- SVG arena drawn from **measured** geometry (`data/geometry/p1.json`). Kept separate from the approved text, so measuring never edits approved content.
- Each mechanic plays as one continuous sequence. Markers glide between steps (one element per role, so no "break and restart" like the Codex build). Controls: play/pause, step buttons, ←/→ keys, variation picker, "My role" highlight (remembered in the browser). Reduced-motion users get instant moves.
- Honesty rules visible in the UI: dashed marker = position read by eye or copied, not auto-measured; "example layout" tag on random elements (beam targets, towers, trap holders, which quadrants have Ice); "Diagram awaiting owner check" until you approve a scene; roles with no fixed spot are listed under the diagram, not drawn.

## How positions were measured
Yan's 2000 px diagrams share one arena: centre (1000, 1000), playable radius 975 px.

- **Waymarks:** measured in three images; they agree within 0.006.
- **Role icons:** found automatically by colour (`scripts/measure_yan.py`).
- **Overlapping or faded icons:** read by eye and marked as such.
- **Check:** each scene was rendered on top of its Yan image (see the check sheets).

## Owner answers (2026-11-07)
All 9 approved. Follow-up applied: Ice encoding made explicit. **Red fill = where it hits; dashed light outline = the omen the game shows.** Ice true = red fill + dashed outline (shown and hits). Ice lie = red fill on the real, unshown quadrants, plus a hatched dashed outline on the shown (fake) ones. Presentation only; no measured positions changed.

## Checked items
1. **Ruin III #1:** MT north of the boss inside a 90° cone. MT's spot is copied from Yan's Ruin III #2 diagram (no #1 diagram exists). OT and the rest are listed, not drawn.
2. **GI1 Fire spread, Ice true:** solid icon spots + Fire spread circles (circle size measured from Yan).
3. **GI1 Fire spread, Ice lie:** faded icon spots (by eye). Danger drawn on NW+SE, shown ice NE+SW hatched as fake.
4. **GI1 stacks (Ice true / lie):** group spots only. Yan shows no stack size, so none is drawn (just inward arrows).
5. **GI1 beam line + beams:** line order and spots auto-measured; beam width measured; targets are Yan's example.
6. **GI1 towers:** tower centres = Yan's example beam spots; tower size measured.
7. **GI1 trap pass:** example holders H2 / D2, explosion circles measured (≈0.30 of the arena radius).
8. **GI1 Mystery Magic:** shaded halves only (tanks/healers east, DPS west after the knockback); Thunder lines **not drawn** (not measured).
9. Look and feel: dark violet/crimson/gold, role shapes (tank = square, healer = circle, DPS = diamond) plus text labels for colour-blind readers. Keep going in this direction?

## Not built yet (next)
- Mitigation panel per step (Ikuya data with carry-overs as "still active").
- Job ability names (official Job Guide), remaining P1 diagrams, deep links per step, Playwright checks.
- Replay timeline: separate feature, see below.

## Replay timeline (owner idea, 2026-11-07)
Planned as a second view on the same data and renderer: a fight clock, a seek bar, mitigation lanes per role.

- **Problem:** exact times are only known for Ikuya's 15 damage events. Steps between them (tethers, spreads, movement) have no sourced timestamps.
- **Option A:** pin steps to the nearest damage event and visibly mark the rest as "approximate".
- **Option B:** source cast timings from an encounter timeline (e.g. a log-based timeline), recorded as a secondary source.
- **Not doing:** interpolating times and presenting them as exact.

## Round 2 (2026-11-07): remaining P1 diagrams + mitigation panel

New scenes (all "awaiting owner check" until approved). Check sheets: `.cache/check-gi2-a.png`, `.cache/check-b.png`, `.cache/check-c.png`, `.cache/check-d.png` (ours drawn on top of Yan's).

**Please check (yes / no / unsure):**

10. **GI2 round 1:**
    - Stack south: whole party, plus the Ice quadrants (shown and hit).
    - Spread: TH spread slots, DPS stacked in the middle, south puddle.
11. **GI2 round 2:**
    - Stack north.
    - Spread: DPS slots, TH in the middle, both puddles.
12. **GI2 reversed order (not drawn by Yan):** DPS spread first / TH spread second, using the confirmed pairs MT↔D1, OT↔D2, H1↔D3, H2↔D4.
13. **GI2 Ruin III #2 + half-room:**
    - OT in the cone (swapped from Yan's MT per D-P1-01).
    - Everyone else just SW of the boss.
    - Half-room drawn east as an example.
14. **GI2 trap pass + into the puddles:** groups and example holders as Yan draws them (Yan draws no explosion circle here, so none is drawn).
15. **Tele-trouncing arrow tiles:** frames and arrows measured exactly (red = same arrows, blue = different).
16. **Tele-trouncing trap pass and fixed teleport spread:** MT/OT/D3/D4 spots read by eye, the rest auto.
17. **Tele-trouncing final spread:** each ranged role is drawn twice, equally, as two candidate spots. Thunder lines and the Fire spread size are **not drawn** (not measured).
18. **Tele-trouncing final stack:** TH at 3, DPS at 1.
19. **No Yan image, drawn from conventions:**
    - Light of Judgment: raidwide ring only.
    - Hyperdrive #1: OT tanks north (C-01).
    - Hyperdrive #2: MT tanks north.
    - The "×3" ring marks the target, not a size.

**Mitigation panel:** every mechanic page lists its linked Ikuya events.

- Steps show the events tied to that step.
- "My role" + "Job" filter to your column. Tanks choose WAR/PLD/DRK/GNB, which settles the "(GNB/DRK only)" variants; healers choose WHM/AST/SCH/SGE.
- ● Press X = fresh press. ➔ X "still active (pressed at 0:38 …), don't press again" = carry-over.
- Footnotes are shown under the event (also as hover on the superscript).
- The ignored Extras ✔ is hidden.

20. Does the mitigation panel read clearly? (Ability names are still Ikuya's terms; job-specific names come next.)

## Round 3 (2026-11-07): owner feedback applied

- **Sources** are now a small book icon with a count; click (or hover) to see the list.
- **Mitigation** is one block, right under the step box. The event that lands during the current step gets a gold outline and a "this step" tag.
- **Trap debuff:** holders are marked with a purple **T** badge in every scene where someone has it. The example chain is the same throughout P1:
  - Graven Image I: MT + D1 → passes to H1 + D3.
  - Graven Image II: H1 + D3 (as in Yan 14) → passes to H2 + D4 (as in Yan 15).
  - Tele-trouncing: H2 + D4 → gone after this last pass.
- **Holder movement:** new intermediate steps show it.
  - GI1 Mystery Magic: example dodge spots from Yan 08 (holders stay on their side). An intermediate "knocked across" frame was briefly added, then removed: its landing spots had no source.
  - GI2: "Knockback lands: groups in the puddles, holders still outside", then the holders follow into their own group's puddle.
- Approval reset (content changed): GI1 trap pass and GI1 Mystery Magic.

21. **Conflict with your description of GI2 step 7.** You described each holder taking one puddle while the knocked-back players land in the opposite one (the AzuriteTV/NA version). Yan:
    - Text: 「ノックバックでグラビガを踏みにいき、デバフ持ちは追って沼に入ります」, "use the knockback to reach Graviga; the debuff holder follows into the puddle".
    - Image 15: all tanks+healers (incl. the holder) in the north puddle, all DPS in the south.
    - Per "Yan wins", I drew Yan's version. Confirm, or tell me if I'm misreading Yan.

**Answer to 21 (2026-11-07):** owner agrees: Yan's version (each group knocked into its own puddle, holder follows).

**Knockback arrows (added 2026-11-07):** drawn on top of the diagram at every trap pass.

- GI2: solid arrows ending at Yan's measured landing spots (image 14 → 15). The tanks+healers go north-northeast into the north puddle, the DPS south-southwest into the south puddle; nobody is near the edge.
- GI1 and Tele-trouncing: dashed, direction-only arrows (away from each holder, across the boss). No source gives the distance. Opposing arrows are drawn in separate lanes so they don't overlap.

22. Do the knockback arrows read clearly?

## Owner verdicts on round 2/3 (2026-11-07)

- 10–16, 19, 20: yes (14: "actually amazing"; 20: mitigation panel much clearer). Scenes approved.
- 17 (Tele final spread): correct. Owner suggestion: show each Fire/Thunder true/lie variant, with each player shuffling slightly to the exact safe spot. Also: Thunder AoE wasn't drawn anywhere yet.
- 18 (Tele final stack): correct; the owner notes it's "just the fake Fire variant" (see below).
- 22: arrows visible, but they should start at the source (the debuff holder), point in the rough direction (likely past the far end of the puddle), and be less bold or semi-transparent rather than dashed.
- Ice true vs lie: hatching must be on both or neither. Owner wants both: hatching + dashed outline = the omen, on truth/lie mechanics only.

## Round 4 (2026-11-07): changes after the verdicts

- **Omen encoding (truth/lie mechanics only):** the omen the game shows is now always hatching + dashed outline; red fill is where it really hits. Ice true = red fill and hatching on the same quadrants; Ice lie = red fill on one pair, hatching on the other. Plain AoEs (cones, puddles, towers, beams…) are unchanged.
- **Thunder drawn (17.1).** Measured from Yan's images by sampling redness across the diagonal: two parallel line AoEs at 45°, each 0.5 of the arena radius wide, with boundaries at 0 and ±0.5 from the centre. The same grid appears in all three images; only the orientation and which stripes are lit change.
  - GI1 Mystery Magic (yan-p1-08): NW-SE lines. Drawn as true (red + omen), because Yan's players stand between the lines and out of the Ice, which only fits both being true.
  - Tele final spread (yan-p1-21, NW-SE) and final stack (yan-p1-22, NE-SW): drawn as the shown omen only. Yan doesn't say whether those examples are true or lies, so where they really hit isn't drawn.
  - Yan also draws a faint second set at the other diagonal in 21 and 22. Not drawn: its meaning isn't stated.
- **Knockback arrows (22):** solid, semi-transparent, starting at the holder. GI2 arrows pass through Yan's landing spot to the far edge of the puddle (exact distance not stated). GI1 and Tele: direction only, through the group and across the boss.
- **Item 18 text fix:** Tele-trouncing branches are now "Fire resolves as spread / as stack". Only Fire decides spread vs stack; the stack is either a true stack marker or a fake Fire spread. Thunder is dodged separately in both. This rewrote approved text, so **Tele-trouncing's approval is reset**.

**Please check:**

23. Hatching on both Ice variants (GI1 steps 2–5, GI2 stack south): clearer now?
24. Thunder bands in GI1 Mystery Magic, Tele final spread and Tele final stack.
25. Knockback arrows (GI1, GI2 and Tele trap passes).
26. Re-approve Tele-trouncing (text) with the new branch wording.
27. Re-approve GI1 trap pass and GI1 Mystery Magic (reset in round 3).

**Proposal for 17 (not built):** a variant picker for Fire spread/stack × Thunder true/lie × Thunder orientation. Each player would step from Yan's spot to the nearest safe side of the measured lines.

- **What Yan gives:** Yan's spots all sit on stripe boundaries (waymarks at 0 / ±0.5), so the shuffle is short.
- **What would be mine:** Yan draws only one example per resolution. The shuffled spots, and which ranged candidate to take, would be **derived by me** (dashed markers, "derived" label). They would not be read from Yan.
- **Still missing:** the Fire spread size for this cast is unmeasured, so spread distances can't be checked yet.

## Owner verdicts on round 4 (2026-11-07)

- 23 (hatching = the shown omen): yes. 25 (arrows): yes. 26 (Tele-trouncing text): re-approved. 27 (GI1 trap pass, Mystery Magic): yes.
- 24: good start. Needs Thunder true/lie, and Mystery Magic must follow Ice true/lie. Rework the variation picker into groups, one choice per group (radio), any combination valid. GI1 groups: spread/stack, Ice true/lie, Thunder true/lie.
- 26: Tele-trouncing needs the four Thunder layouts as two choices: direction (NW-SE / NE-SW) and top or bottom pair. Spread spots should adjust, and only spots that are safe should be shown (no D3 standing where they'd die).

## Round 5 (2026-11-07): variation groups

- **Picker:** one radio row per group; diagrams follow the full combination. GI1: Fire, Ice, Thunder (2nd Mystery Magic). Tele-trouncing: Fire, Thunder direction, Thunder lines. GI2 keeps its single "spread order" row.
- **GI1 Mystery Magic:** Ice and Thunder each drawn true or lie with the round-4 encoding (red = real hit; hatching + dashed outline = shown). The Ice choice drives both Ice casts (step 2 and step 6), as asked.
- **Tele-trouncing:** Thunder choices mean where it **really hits** after reading Kefka's ring, so only red fill is drawn. "Top pair" = one line runs over A; "bottom pair" = one over C. Yan's 21 and 22 are both bottom pairs.
- **Shuffles (derived, marked as such):** each player moves to the nearest spot clear of the real hits by a margin. Moved markers are dashed with a violet outline, and the legend names them.
  - A ranged role with two candidates takes the one needing the smaller move; only that one is shown.
  - Tele moves are 0.01–0.14 of the arena radius.
  - GI1: each group stays on its side (tanks+healers east, DPS west). Ice true + Thunder true keeps Yan's spots exactly (tested).
- Tests check every combination: every drawn role is clear of the real hits, and nobody is drawn twice.

**Please check:**

28. Variation picker (GI1, Tele-trouncing).
29. GI1 Mystery Magic, all four Ice/Thunder combinations.
30. Tele final spread and final stack, all four Thunder layouts.
31. Should the second Ice (Mystery Magic) be its own choice? It is a separate cast; I don't know whether it can differ from the first Ice.

## Owner verdicts on round 5 (2026-11-07)

- 28: very good. 29: good, but melee (tanks + melee DPS) should shuffle east and keep uptime rather than run far for Ice lie + Thunder true (owner knows Yan can't confirm this). 30: approved; add Thunder true/lie there too. 31: make the second Ice its own choice.

## Round 6 (2026-11-07)

- **GI1:** four groups: Fire (1st), Ice (1st), Ice (2nd Mystery Magic), Thunder. The second Ice is now separate.
- **Melee uptime (29):** in Mystery Magic, MT/OT/D1/D2 now look for the nearest safe spot inside the boss's target ring first (radius 0.30, measured from yan-p1-21), and may cross sides to do it. Only if no such spot exists do they use the general rule.
  - Ice lie + Thunder true: all melee shuffle just north-east of the boss.
  - Ice lie + Thunder lie: all melee just south-west of the boss.
  - This rule is your suggestion, labelled as such; Yan doesn't show it.
- **Tele-trouncing Thunder true/lie (30):** groups are now Fire, Thunder direction, Thunder lines **shown**, and Thunder true/lie.
  - True: the shown pair hits (red + omen).
  - Lie: the other pair hits, and the shown lines are drawn as the safe omen.
  - Spots depend only on where it really hits, so "top + true" and "bottom + lie" give the same layout.

**Please check:**

32. Melee uptime spots in GI1 Mystery Magic (all four Ice 2nd × Thunder).
33. Tele final spread/stack with Thunder true/lie.

**Owner verdict (2026-11-07):** 32 and 33 approved. All P1 diagrams are now owner-approved.
