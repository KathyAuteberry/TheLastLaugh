# Stage 1–2 / P2: owner review

Data: `data/phases/p2.json` (Yan, Stage 1) · `data/mitigation/p2.ikuya.json` + `p2.overlay.json` (Ikuya, Stage 2) · Images: `data/sources.json` (yan-p2-01 … 09) · Decisions: D-P2-01 … 03 · Validate: `npm run validate`

Sources read: Kitten ERP's DMU guide (Mana tab = Yan; added 2026-11-09, see the Kitten round at the end), Yan's P2 section (page unchanged since 2026-07-28; 9 images), ぴれん's two tweets embedded there, AzuriteTV's P2 guide and marii_yaa's NAUR visual guide (subtitles; mechanics only, never positions), cactbot and BossMod Reborn (names, order).

Nothing here is on the site yet: no UI, no diagrams. Answer yes / no / unsure per item.

## P2 at a glance

1. Ultimate Embrace (終末の双腕): tankbuster on both tanks.
2. Forsaken (ミッシング): raidwide, then 8 tower sets with stack/circle/cone markers; Past's/Future's End baits on every even set; the All Things Ending cleaves follow and resolve on sets 3, 5 and 7, plus after set 8 (Ikuya's rows say the same: "Towers III (All Things Ending)"). **Two methods, as a variant (D-P2-01).**
3. Light of Judgment (裁きの光): raidwide; anyone with a Forsaken debuff stack left dies.
4. Trine (トライン): triangles in 3 sets plus Wings of Destruction (half-room, then near + far hits).
5. Ultimate Embrace #2.
6. Time's up (時間切れ): 6:20 from the pull, else enrage.

## Names

1. **English names** from cactbot and both videos: Ultimate Embrace, Forsaken, Past's End / Future's End, All Things Ending, Light of Judgment, Trine, Wings of Destruction. The debuff is "Spells' Trouble" in both videos (spoken, spelling unconfirmed); the guide just calls it "the Forsaken debuff". OK?

## Forsaken: rules both methods share (Yan)

2. **Pairs** MT+H1, OT+H2, D1+D3, D2+D4. Split west tanks+healers / east DPS before Forsaken (Yan's tip, for reading each other's markers). OK?
3. **Turns:** pairs with a stack after Forsaken soak towers 1, 2, 3 and 8; the other pairs 4, 5, 6 and 7. OK?
4. **Odd towers:** cone bottom-left, circle bottom-right, stacks at the top spots. Pairs not in towers keep fixed spots: left tanks+healers, right DPS. OK?
5. **After tower 3, mark yourself:** circle → stop1, cone → bind1 (Yan's macros). I read the purpose as "so the other pairs can see who has what for towers 4-8". Correct?
6. **Tower 8** by head-marker number: left 1, right 2. OK?
7. **Clone baits (even towers):** Yan: "the two cone holders and the two melee (近接2人)". Yan's even-tower diagram shows the 4 baiters on the boss's NW/NE edge and on the towers' north edges. Who are "the two melee": the melee player of each outside pair (MT/OT/D1/D2)? Unsure.
8. **Past's End:** wait between the towers until All Things Ending starts casting. **Future's End:** wait opposite the towers, run to the tower side when the cast appears. **4th time (after tower 8):** gather at A and dodge by the cast. Stated only under method ①; I apply it to both. OK?
9. **Tips kept as a common mistake** (Yan + ぴれん's tweet): on odd sets the right-tower stack can get clipped by All Things Ending. Stand on the right side of the tower overlap; when baiting the legs, shift slightly counterclockwise or have the stack step in a little (not so far the left outside tank gets caught); bait from max melee. OK?

## Forsaken: the two methods

10. **Method ① priority:** stack spots on odd towers by priority healer > tank > melee > ranged; even towers "from the left" by the same priority. Does higher priority also mean **left** on odd towers? Yan only says "by priority" there. And is "melee" = D1/D2, "ranged" = D3/D4?
11. **Method ② south adjusts:** odd stacks start left = tanks+healers, right = DPS on tower 1; later, if markers clashed on the previous tower, the south player moves. Even towers: if markers clashed on the previous tower, the south player moves to adjust; otherwise take your marker in the same tower (tower 4: left = healer + melee, right = tank + ranged). OK?

## Mechanic behaviour from the videos (not in Yan)

12. 4 debuff stacks per player, one removed per tower soak; towers need 2 players each and explode (damage down) if missed; pairs spawn 90° apart and turn 45° the same way every set; cone hits the nearest player, not the holder; stack needs 3 players; Past's End → cleaves behind Kefka and clones, Future's End → in front. OK to state these as mechanics?
13. **Clone count** disagreement (D-P2-02: Azurite "five random players", marii "three clones"). Fine to leave unnumbered for now?
14. If the P1 puzzles weren't done, the fight ends after P2 (marii). OK as a phase note?

## Trine (Yan)

15. Note which triangles land first (the 3rd set always includes the middle one). Dodge the first Wings of Destruction (half-room), then hide in a first-set triangle: **healers+DPS search south, then east; tanks north, then west.** MT close to the boss (near hit) while avoiding the middle triangle; OT at the very edge (far hit); healers+DPS out but not on the edge. OK?

## Ultimate Embrace and time's up

16. Both Ultimate Embraces: tanks only, others "not involved"; how to take it comes from Ikuya (both tanks kitchen sink, D-P2-03). OK?
17. Time's up: 6:20 from the pull (Yan). cactbot's P2 length fits that. If Kefka isn't at 0% after the second Ultimate Embrace, wipe; otherwise P3. OK?

## Ikuya P2 (Stage 2)

18. **16 event links** (13 on the P2 tab, 3 Omnitank), listed in docs/COMPLETION.md: Ultimate Embrace ×2, Forsaken, Towers I–VIII → odd/even tower steps (Ikuya's numbering = cactbot's 8 sets), Light of Judgment, Wings of Destruction → Trine's near/far step. OK?
19. **Sheet details:** typos "Ultimate Embrance" and "Fey Illumuniation" read as the real names; Omnitank "(Close)" / "(Far)" kept as a note on the ability (MT close, OT far: matches Yan); "➔ Party Mit (GNB/DRK)" at Towers IV read as "on GNB/DRK, the Party Mit from Towers III still covers this". OK?
20. **Extras ✔** on Forsaken: ignored, as in P1. OK?
21. **New shorthand → real abilities** (shown with * until confirmed):
    - "40%": Damnation / Guardian / Shadowed Vigil / Great Nebula.
    - "90s": Thrill of Battle / Bulwark / Dark Mind / Camouflage (the same picks as the approved Kitchen Sink list).
    - "Short Mit": Bloodwhetting / Holy Sheltron / The Blackest Night (Oblation optional) / Heart of Corundum.
    - "Assist Tanks" (WHM): Aquaveil + Divine Benison. Ikuya says "single target mitigation and GCD shield", but Benison is an oGCD, so a healer should confirm.
    OK?
22. **Durations:** every P2 carry-over fits its Job Guide duration (no repeat of P1's Temperance gap). Aquaveil 8 s and Divine Benison 15 s added from the Job Guide. FYI.

## "Why it works" drafts (yes / no / edit)

23. **Forsaken:** Pairs never change and each pair always works the same half (tanks+healers left, DPS right), so a glance at your partner's marker tells you your spot. Stack pairs and the others swap after tower 3, giving everyone exactly 4 soaks before Light of Judgment. Fixed outside spots put the right players nearest Kefka for the Past/Future End baits, and waiting between or opposite the towers aims the clone cleaves away from the next towers.
24. **Trine:** Tanks and the party search for safe triangles in opposite directions (north/west vs south/east), so they rarely share one, and MT near / OT far / party in between keeps the near and far Wings of Destruction hits on the tanks.

## Kitten ERP round (2026-11-09)

The owner pointed to Kitten ERP's DMU guide (kitten-erp-guides.moe/ultimates/dmu), whose Mana tab follows Yan. The owner asked for its answers to be applied ("Both"). Already in the data:

- **Item 5, answered:** the marks are for the players who just soaked tower 3. They don't soak again until tower 8; the mark keeps their marker in view, and its number places them there (left 1, right 2; in Mana the marks override the priority). My earlier reading ("so the other pairs can see") was wrong.
- **Item 7, answered:** "the two melee" are the melee of each pair outside the towers: the tank of the tanks+healers pair (boss's NW) and the melee DPS of the DPS pair (boss's NE). With the two cone holders on the towers' north edges, that's the four baiters in yan-p2-03.
- **Item 10, answered:** yes, higher priority takes the left spot on odd towers too, and melee = D1/D2. Kitten's Mana rule (support left, DPS right, the pair's melee moves when both have the same marker) always gives the same spots. Method ① is now the default variant; ② stays selectable.
- **Item 1, corrected:** All Things Ending resolves on sets 3, 5, 7 and after 8, not "on" the even sets.
- **Item 12, confirmed and extended:** each group always gets one stack plus all cones or all circles; the cone is about 70° wide and its holder takes no damage.
- **Item 13:** Kitten gives no clone count either; it stays unnumbered.
- **Items 3, 4, 6, 8, 14, 15:** Kitten matches Yan (final bait always at true north = A; Trine: tanks north, others south, MT near, OT far).

New notes, not yet in the data (yes / no):

25. **Phase end:** when Kefka dies, Aero III Assault knocks everyone back from the centre, so stay near the middle. Add to "Time's up"?
26. **WAR alternative:** Kitten says a WAR may Holmgang the first Ultimate Embrace. Ikuya's own P1 note ³ already gives that option. Show it as a side note under D-P2-03 (Ikuya's plan stays the main one)?

### Owner verdicts on the Kitten round (2026-11-09)

- **25: yes.** Added to "Time's up" as a hazard: Aero III Assault knocks everyone back from the centre when Kefka reaches 0%; stay near the middle.
- **26: not needed.** No WAR side note; Ikuya's plan stands alone.

## Owner verdicts, round 1 (2026-11-09)

The owner hasn't played P2 yet and wants to check the first draft of the site against Yan and Kitten before final approval. So these are provisional; the mechanics stay "unreviewed" until that check.

- **3, 4, 6, 8, 14, 15:** OK, provisionally (Yan and Kitten agree; can be adjusted later).
- **1** (English names), **2** (pairs, west/east split), **9** (common mistake), **11** (method ② adjustments), **16**, **17:** OK.
- **18–22:** OK. Applied: all 16 P2 links owner-approved; the Extras ✔ stays ignored; "40%", "90s", "Short Mit" and WHM "Assist Tanks" confirmed (no more *).
- **23–24** ("why it works"): probably OK.

### First draft on the site (for the owner's check)

P2 now shows in the guide (nav "Phase 2 · first draft"), with Ikuya's P2 mitigation per step. Diagrams in `data/geometry/p2.json`, all awaiting the owner's check:

- **Forsaken raidwide:** tanks+healers west, DPS east (zones only; Yan draws no spots).
- **Odd towers** (yan-p2-02) and **even towers** (yan-p2-03): the 8 player dots measured by colour (`scripts/measure_dots.py`); tower, stack, circle and bait sizes read by eye from the drawn circles. Drawn with the towers as south, so waymarks are hidden. Roles are an example deal (tower 1: H1 and D3 stacks, MT cone, D1 circle; tower 2: H1/D1 cones, MT/D3 circles). Yan draws one dot for the two outside DPS on odd towers; both are placed on it.
- **Cone width:** drawn at about 70° (Kitten's text); Yan's odd-tower picture draws it wider (about 100°). Which is right?
- **Trine near/far hits** (yan-p2-07, example 1 of 3): tanks auto-measured; the six party icons are stacked in Yan's picture, so they share one spot (read by eye). The triangles are not drawn yet.
- Not drawn: Ultimate Embrace, Light of Judgment, All Things Ending, the first Wings of Destruction, Time's up (text only).
