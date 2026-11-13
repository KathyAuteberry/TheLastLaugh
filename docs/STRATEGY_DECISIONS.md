# Strategy decisions and source disagreements

Rule: Yan Flash wins on execution, Ikuya on mitigation. Every disagreement is recorded here and is never merged silently.

## Guide mode (owner decision, 2026-11-06)

The guide is **Yan Flash + Ikuya**. Ikuya dictates everything about mitigation, including tank assignments that exist because of the mitigation plan (who Provokes, who invulns, which tank takes a buster). Where Yan's diagram shows a different tank, the Ikuya assignment wins and the Yan reading stays recorded here.

Possible future: a toggle between "pure Yan Flash" and "Yan Flash + Ikuya". Not planned yet; keep both readings in the data where they differ so the toggle stays possible.

## Conventions

- **C-01 (owner, 2026-11-07):** unless a mechanic says otherwise, whoever holds aggro tanks the boss at the centre facing north. Yan's P1 Ruin III diagram (`yan-p1-11`) matches this.

## D-P1-01: Who takes Revolting Ruin III #2 (status: DECIDED 2026-11-06, OT per Ikuya)

- **Yan Flash** (神々の像（2回目）, image `yan-p1-11`): the diagram shows **MT** (icon "1") in the north cone during Ruin III. The text names no tank.
- **Ikuya Omnitank** (rows B12/B14): Ruin III #2 has MT on "Provoke During Castbar" and OT on "Invulnerability". Hyperdrive #2 has MT on "Invulnerability". Under the targeting rule in footnote ¹, this means **OT** takes both Ruin hits and MT takes Hyperdrive #2.
- **Why it matters:** this decides which tank takes Ruin #2 and which takes Hyperdrive #2 (D-P1-01 is linked from both).
- **Possible reading:** Yan's tank icons may just mean "the tank currently holding aggro", not the assignment. That is a guess.
- **Decision (owner):** follow Ikuya. OT takes both Ruin III #2 hits under invulnerability; MT Provokes during the castbar and takes neither, then takes Hyperdrive #2 with invulnerability.
- **Data state:** tank roles on `p1-revolting-ruin-iii-2` and `p1-hyperdrive-2` are `derived` from Ikuya. In the GI2 `ruin-half-room` state the tank icons from `yan-p1-11` are swapped (OT in the cone, MT with the party). The Yan-only reading is kept in claim notes.

## D-P1-02: Does Hyperdrive #1 have a castbar? (status: CLOSED 2026-11-06, no conflict)

- **Ikuya Omnitank** footnote ²: "Hyperdrive does not have a castbar and occurs immediately after Light of Judgement."
- **Yan Flash** only says 「裁きの光後、タンク強攻撃3回」 for #1 and puts （無詠唱） in the heading of #2. Yan never states #1 has a cast; the "conflict" was an over-reading of that heading.
- **Owner:** Hyperdrive never has a castbar.
- **Data state:** Hyperdrive #1 recognition is `source-stated` (no castbar).

## Replay timing (owner decision 2026-11-07, logs first since 2026-11-12)

The replay's clock comes from **the owner's in-game recordings** (`owner-logs-dmu`: the static's IINACT log and RaidTrace trace of 33 P1 pulls on 2026-11-11). **cactbot** (`cactbot-dmu`) and **BossMod Reborn** (`bmr-dmu`) are the fallback and stay in the data as a cross-check. Ikuya stays the only source for mitigation. No timing source is ever used for positions or assignments.

- **Rule (owner, 2026-11-12):** in-game logs rank above cactbot and BossMod Reborn. Use the median over the pulls that reached the moment (seconds from the log's InCombat line); the data keeps the pull count and the min–max range. Where the logs don't time a moment, use cactbot when its line names the ability and BossMod Reborn agrees within 1 s, otherwise BossMod Reborn. If nothing times it, it is shown as approximate ("≈"). The validator enforces this (`data/timeline/p1.json`).
- **What the logs are:** ACT line timestamps equal the packet header times in the trace to the millisecond (checked on 780 casts and 2954 actions); they are not the server's internal snapshot of a mechanic. Spreads between pulls are about ±0.3 s. Only derived numbers are stored here; no player names, IDs or raw lines.
- **How far the pulls got:** 33 reach Ruin III, 25 Graven Image 2, 7 the Gravity III puddles, 6 Tele-trouncing, 4 the end of P1. Later steps rest on fewer pulls; the count is shown with each one.
- **Agreement with the old sources:** most steps move by under 0.5 s, either way (Ruin III cast 10.6 → 10.14, GI2 Gravitas 87.2 → 87.42). The largest is Gravity III, 121.5 (BossMod Reborn) → 120.82. Only the steps no source timed before moved by more (D-P1-08).
- **Ikuya's times are read as when to press** (owner: "give Ikuya the benefit of the doubt"). A gap to the hit is not treated as an error.

## D-P1-03: Tele-trouncing trap knockback time (status: DECIDED 2026-11-07)

- **Ikuya** (row 24): Double-Trouble Trap at **2:45** (165 s).
- **BossMod Reborn:** the two knockback casts are done at **168.2 s**.
- **cactbot:** has only an un-synced "--knockback--" note at **170.6 s**, with no ability on the line, so it counts as an estimate.
- **Update (2026-11-12):** the logs put the hit at 167.81 (167.64–167.91, 6 pulls); the replay now uses that (logs-first rule). Ikuya's 2:45 is then 2.8 s before the hit.
- **Decision (2026-11-07):** the replay shows the hit at 168.2 (BossMod Reborn). Ikuya's 2:45 is kept as the press time, 3.2 s before the hit. Milestone R3 adds ability durations, and then the validator checks that every press still lasts until the hit.

## D-P1-04: Tele-trouncing arrow deal (2026-11-07)

- **Yan** gives the tile layout (yan-p1-17: red frame = same arrows, blue = different) and one real deal in a status-bar screenshot (yan-p1-16).
- **Azurite video (8:10):** one role gets two different arrows, the other two of the same. The arrows drop as teleporters when their timers run out. The video's placement ("bigger box strat") differs from Yan's; Yan wins, and only the mechanic description is used.
- **BossMod Reborn:** confirms short- and long-timer arrows (second debuff over 8 s), with the drops about 3 s apart.
- **Decision:** the guide and the replay use Yan's screenshot as an example deal, and a variation flips which role gets the matching pairs. Who gets which pair is random and is labelled as an example. Supersedes the "carried spots" answer for Tele-trouncing arrows (review item 38) at the owner's request.

## D-P1-05: Tele-trouncing confusion and teleports (2026-11-07)

- **Owner:** the confused player walks into the arrow while trying to hit the nearby player, is teleported four times while confused, and Thunder resolves soon after.
- **Azurite video (8:40, 10:41):** the statue tethers one role to confusion (chases and KOs the closest player) and the other to sleep (small AoE). All arrows must be taken (a P3 prerequisite). Confused players sometimes ran through arrows without teleporting, and the video's group changed its movement to fix that. That is the video's strat, so it is not used.
- **Yan:** no confusion diagram. The fixed teleport spread (yan-p1-19) puts one support and one DPS in each quadrant. The line between them crosses the first arrow of that quadrant's blue frame. The four arrows of each quadrant (yan-p1-17) chain: each one points at the next cell (NW ↑ ← ↓ ↓, NE → ↑ ← ←, SE ↓ → ↑ ↑, SW ← ↓ → →).
- **Disagreement in the measurements:** by raw distance in Yan's picture, OT is closer to MT and D2 than to D4, and D1 is about as close to D2 as to H1. "Nearest player" would send OT, D1 and D2 at the wrong person. The guide pairs by quadrant, as the owner describes. Resolved by D-P1-07 (outer players moved in).
- **Not from a source:** the jump length (the next cell, about 7 y; off the tiles on the fourth jump, by the average jump) and the teleport times (spread evenly over the confusion, labelled as estimates).
- **Decision:** new "Confused" variation (tanks + healers or DPS). The confused players walk into their quadrant's first arrow and take all four arrows; the sleepers stay put.

## D-P1-06: Mitigation durations and one carry-over that runs out (2026-11-09)

- **Ikuya:** shows who presses what and when (the sheet's time = press time, owner decision), and marks with ➔ when an earlier press is meant to still cover a later hit.
- **Job Guide (official, checked 2026-11-09):** how long each effect lasts. The replay's lane bars use these (`durations` in data/mitigation/abilities.json). Where the page lists several durations (e.g. Holos: 30 s barrier, 20 s damage reduction), the bar uses the mitigating effect and the choice is written next to the number.
- **Disagreement:** WHM Temperance pressed at 2:45 (Double-Trouble Trap) is carried to the 3:07 Mystery Magic hit (3:07.1). Temperance lasts 20 s, so it ends at 3:05.0, 2.1 s before that hit. Every other carry-over in P1 fits within its duration.
- **Decision (owner-approved 2026-11-09):** keep Ikuya's plan as written and show the gap: the bar ends before the ➔ marker, which is drawn in red. A later press (2:47.1 or after) would cover both hits; that is not stated by any source, so the guide does not suggest it.

## D-P1-07: Tele-trouncing teleport spread, outer players (2026-11-09)

- **Yan** (yan-p1-19): the four outer players (D3, D4, H1, H2) are drawn in the gap between the red and blue frames, at about the intercardinal waymarks. Read that way, "nearest player" does not always point at the quadrant partner (D-P1-05: OT was 0.40 from MT and 0.50 from D4, because D4 had also been read 0.13 too far north).
- **Kitten ERP** (Mana tab, which follows Yan): "edge close to the teleporter circle without touching it", with the quadrant's two players directly across the teleporter from each other; the diagram pulls the outer player in diagonally toward the first arrow.
- **Owner:** the outer players hug the arrow diagonally, so each quadrant's pair are each other's nearest player.
- **Decision (owner, 2026-11-09):** each outer player is the mirror of their inner partner across the quadrant's first arrow (NW ↑, NE →, SE ↓, SW ←): D3 (−0.398, 0.395), D4 (0.391, 0.430), H1 (−0.382, −0.429), H2 (0.420, −0.391). The partner is now nearest in every quadrant (0.24–0.31, against 0.39–0.40 to anyone else). The inner four are unchanged. This closes the disagreement noted in D-P1-05.

## D-P1-08: Tele-trouncing teleports, measured (2026-11-12)

- **Before:** the jump length came from Yan's tile layout (the next cell, about 7.2 y) and the four teleports were spread evenly over the confusion (D-P1-05; estimates, ending at 180.5).
- **Owner (2026-11-12):** the confused healer's movement in the RaidTrace of pull 32 (south, east, north, north) is the teleports, not player movement.
- **RaidTrace (31 warps, 6 pulls):** an arrow warps the player with a server position set (ActorControl 241), not a walk. The landing spot is always **6 y from the arrow's centre in the arrow's direction** (5.97–6.03 y, sideways error at most 0.03 y), wherever the player entered the arrow. Pull 32's south–east–north–north chain is exactly the south-east quadrant's arrows.
- **Chaining:** each warp also puts **Bind** (status 2518) on the player for about 1 s. When the landing spot is on another arrow, that arrow warps them as the Bind ends: rides follow each other every **1.02 s** (0.98–1.04, 12 gaps). A landing spot off the arrows ends the ride.
- **Trigger:** one warp fired with the player 1.96 y from the arrow's centre, which fits the 2 y circle BossMod Reborn draws (arrows.ts `ARROW_RADIUS`). The warp comes at least 0.3 s after the player is first seen inside; the position updates (every ~0.3 s) don't allow a closer figure.
- **Timing (confused players):** Indulgent Will (BAB5) hits at 173.45; the Confused status line follows about 0.6 s later, at **174.08** (173.90–174.22, 6 pulls), and it is lost at about **180.04** (179.90–180.21) after its 6 s. Teleport 1 at **174.75** (174.40–175.02, 9 players), 2 at **175.76** (175.51–175.99, 5), 3 at **176.85** (176.53–177.01, 4), 4 at **177.94** (177.81–178.03, 3 full rides). All four fit inside the confusion; the old estimate (teleports to 180.5) put teleport 4 after it had worn off.
- **Anyone can ride:** 7 of the 31 warps were players who were not confused (164–169 s, mostly around the trap knockback, and one after the confusion).
- **Decision:** the replay jumps 0.3 (6 y) from each arrow's centre and rides on only when the landing is inside an unused arrow. Teleports 1–4 use the log times; reaching the first arrow is shown at 174.4, 0.35 s before teleport 1 (estimate, labelled; the trace shows the first warps 0.31–0.36 s after walking in). Supersedes the jump length and teleport times in D-P1-05.
- **Arrow spacing (owner, 2026-11-12):** keep the rectangular 90° rides. Yan's tile cells (about 7 y apart) are pulled in about each quadrant's centre so neighbouring arrow centres are exactly 6 y (0.3) apart, keeping Yan's arrangement and cell size. Every warp then lands on the next arrow's centre and a full ride goes round the quadrant's square (e.g. up → left → down → down). Yan's picture is a schematic, so it doesn't settle the spacing; the trace's south–east–north–north chain needs this spacing.

## D-P1-09: Knockbacks, measured (2026-11-12)

- **Distances:** the hit packets name the Knockback sheet rows: Pulse Wave row 72 (13 y), Double-trouble Trap row 240 (14 y), as BossMod Reborn says. In the RaidTrace the trap's stacked (standing) players travel 13.9–14.05 y. Pulse Wave travels 10–14 y (median 12.2 y): those players were still walking when it hit, so the net move is shorter. Both distances are kept.
- **Pulse Wave's origin:** the caster stands at world (100, 56), 44 y north of the centre (2.2 arena radii), not on the rim where the statue is drawn. The knockback now pushes away from that point; the statue icon stays on the rim.
- **When:** the push starts about 0.8 s after the hit packet (0.62–1.03 s, 199 knockbacks) and is finished about 1.5 s after it (47 clean trap knockbacks). The replay used to push at once and in 0.3 s; it now waits 0.8 s and pushes over 0.7 s (motion `knockbackDelay`, `knockbackSeconds`). The GI2 "knockback lands" step, untimed before, is 119.70 (119.65–119.90, 6 pulls).

## D-P1-10: Log retiming, disagreements and knock-on effects (2026-11-12)

- **Brief vs log, confusion:** the hand-over said Confused is applied at 173.45 and ends at 179.45. 173.45 is the BAB5 ability time; the status itself lands about 0.6 s later (174.08) and is lost at about 180.04. The replay uses the status times (cue 174.08, final-spread hedge 180.04).
- **Two measurements of the warp times:** the FluffySim session's first pass had 174.79 / 175.79 / 176.89 / 178.00; the recount here (per pull from the log's InCombat, chained rides only for teleports 2–4) gives 174.75 / 175.76 / 176.85 / 177.94. The data uses the recount; the gap is under 0.06 s.
- **cactbot / BossMod Reborn vs the logs** (kept as cross-checks in `data/timeline/p1.json`): cactbot runs 0.1–0.5 s late on most steps (Ruin III cast 10.6 vs 10.14, hit 15.6 vs 15.21), BossMod Reborn up to 0.7 s late (Gravity III 121.5 vs 120.82, untargetable 197.9 vs 197.53). The GI2 Gravitas set 1 is the one cactbot has early (87.2 vs 87.42). The GI2 knockback (119.70) and the Tele-trouncing teleports had no source before.
- **Enrage cast:** the logs start it 0.14 s after Kefka turns untargetable (197.67 vs 197.53), so it now starts after the replay ends and is not drawn (kept in the data with `afterEnd`).
- **Knock-on, Pulse Wave:** the pre-knockback spots now aim from the caster at (0, 2.2) instead of the rim statue, so the tethered group stands a little differently before the push; the landing is still Yan's spot.
- **Knock-on, GI2 trap → puddles:** with the measured 0.8 s push delay and Gravity III at 120.82, the replay's players reach the puddles about 0.7 s after they go off. In game they make it, so the replay's stack or puddle spots (or the push direction) are off. Left as a known gap in the motion test; needs an owner look. H1 also reaches the GI1 spread 0.55 s late.
- **Not used:** statue and indicator positions (the GI3 statues stand 60–75 y north, outside the arena; the guide draws no statues there) and Kefka's centre teleports (24.52, 75.74, 179.86): the replay always shows Kefka at the centre, so they change nothing.

## D-P2-01: Two Forsaken methods (2026-11-09)

- **Yan:** two sections for Forsaken (ミッシング), both credited to ぴれん: ① priority (優先順) and ② south adjusts (南調整). They share the pairs, the tower turns (stack pairs 1-2-3-8, others 4-7), the odd-tower layout and the macros. They differ in how stack spots (odd towers) and even towers are chosen. The Past/Future End and detailed-position paragraphs appear only under ①.
- **Decision (owner, 2026-11-09):** offer both as a reader-selectable variant (`method-1` / `method-2` branches in data/phases/p2.json).
- **Superseded (owner, 2026-11-14):** method ② dropped. Yan's Forsaken is priority by self-marking (method ①, also what Mana uses per Kitten), so the guide shows only that: the Method picker, the four method ② steps and their two diagrams are removed, and the steps no longer carry a branch.
- **Kitten ERP (Mana tab, read 2026-11-09):** describes only one method: support left, DPS right, the melee of a pair moves when both have the same marker. That always gives the same spots as Yan's ① read left to right, so ① is the default variant and "by priority" on odd towers means higher priority on the left. Kitten also names the clone baiters: the two cone holders plus the melee of each outside pair (tank NW, melee DPS NE of the boss), and says the post-tower-3 marks are for the players who sit out until tower 8 (owner applied, 2026-11-09).

## D-P2-02: How many clones in All Things Ending (2026-11-09)

- **AzuriteTV (2:45):** "Kefka and his clones will face five random players".
- **marii_yaa (20:32):** Past's/Future's End "will spawn three clones of Kefka".
- **Kitten ERP:** Past's/Future's End targets "the four closest players" and "spawns a clone"; no clone count stated.
- **Yan:** does not say. The diagrams show four red bait circles on even sets (the Past/Future End baits), which fits four bait targets.
- **cactbot (ability list, timing source):** Past's End / Future's End damage "(On 1 player)" and "(On 3 players)".
- **BossMod Reborn (P2Forsaken.cs, read 2026-11-11):** one Past's/Future's End AoE is cast by Kefka, the others by helper actors (the clones); it tracks Kefka plus the clones (4 in all) and waits for 4 All Things Ending casts. Each turns to its own nearest player.
- **Owner (2026-11-11):** thought there were two clones; no source says two.
- **Decision (updated 2026-11-11):** Kefka plus three clones (BossMod, cactbot's 1 + 3 split, marii). AzuriteTV's "five" is the odd one out. Where the clones stand is in no source, so they are not drawn; only Kefka's own cleave is.

## D-P2-03: Ultimate Embrace, how the tanks take it (2026-11-09)

- **Yan:** "heavy tank attack" only.
- **Videos:** either one tank's invulnerability or both tanks stacked with all defensives; AzuriteTV prefers the shared option and saving invulnerabilities for P3.
- **Ikuya (Omnitank, P2):** both tanks Kitchen Sink on the first Ultimate Embrace; Rampart + 40% + 90s on Wings of Destruction carried into the second, plus short mitigation. P1 Omnitank note ³ adds a WAR alternative (kitchen sink Hyperdrive #2, Holmgang the first Ultimate Embrace).
- **Decision:** mitigation is Ikuya's call (source hierarchy): shared, both tanks kitchen sink. The videos are only background.

## D-P2-04: Forsaken step by step: example deals and the line-up (2026-11-10)

- **Owner (2026-11-10):** Forsaken needs the line-up, the spells over each head with a few viable example deals, one step per tower set, the clone baits and both group swaps.
- **Yan:** one full example run of method ① (yan-p2-01, 8 panels, roles readable from the icons) and the detailed odd/even spot pictures (yan-p2-02/03). No line-up spots: only "tanks+healers west, DPS east before Forsaken".
- **Kitten ERP (Mana):** a second full run (8 pictures; its sets 6 and 7 reuse the pictures of 4 and 5) and a line-up picture south of the boss (pairs in two columns per side), which keeps Yan's west/east split.
- **Decision:** spots stay Yan's (measured slots); who stands where is computed per deal from the method ① rules (src/model/forsaken.ts). Deals: Yan's run, Kitten's run (both copied from the pictures; unit tests check the rules reproduce every tower spot in both), and two deals we built from the same rules (C, D; labelled as ours) to cover the cases the source runs miss. The validator checks every deal against the rules. The line-up spots come from Kitten's picture (Yan has none). Method ② keeps its two generic steps: Yan's ② text is too short to place players set by set.
- **Not drawn:** the clones' cleaves (D-P2-02; clones and Kefka's own cleave are drawn since D-P2-05); bait spots are loose (Yan gives only "between / opposite the towers", "gather at A").

## D-P2-05: Forsaken tower turn, clones and Kefka's cleave (2026-11-11)

- **Owner's friend (2026-11-11):** the towers do not turn on our site; they turn 45°, clockwise or anticlockwise, and once picked the direction stays for the whole mechanic.
- **Yan:** 塔は毎回、時計or反時計に45度ずれる (the towers shift 45° clockwise or anticlockwise each time). Past's End: wait between the towers until All Things Ending is cast; Future's End: wait opposite the towers and run to the tower side once it is cast.
- **Kitten ERP:** two towers 90° apart; soaking turns them 45°, same direction throughout. Past's/Future's End hits the four players nearest Kefka with an AoE that "spawns a clone"; All Things Ending is a halfroom cleave in front of (Future's End) or behind (Past's End) Kefka, who faces the bait group.
- **Decision:**
  - "Tower turn" is a variation (cw / ccw).
  - Towers-as-south pictures are turned (set n − 1) × 45° from set 1 when drawn, never stored. Set 1 stays at south, as no source fixes its true spot, so waymarks stay hidden.
  - Bait steps are drawn against the next (already turned) towers. Swap steps stay on the set just soaked.
  - Kefka's own All Things Ending is drawn on the half away from the towers: both rules give that half once the bait is right.
  - The clones are not drawn: three of them (D-P2-02), but no source says where they stand. (A first try drew them where the AoEs landed; removed the same day as a guess.)
  - Bait steps: everyone stacks on one line through Kefka, so Kefka and all three clones turn to the same point (owner's friend; Kitten, marii, AzuriteTV; BossMod's nearest-player rule). Distance (owner, 2026-11-14): tanks and melee about 10 y from the centre, touching the inner side of the waymark; ranged a little further out to show their yellow spell. Drawn at 10 y (0.5) and 12 y (0.6); the 12 y is our guess, pending the owner. Supersedes the earlier "max melee or a bit further" (drawn at 6.6 y).


## D-P1-11: Revolting Ruin III cone width, measured (2026-11-14)

- **Yan:** "タンク強攻撃（90度扇範囲）", a 90° cone. The guide drew and described it as 90°.
- **Owner's RaidTrace (2026-11-13):** with players standing still, one 58° off the cone's centre line was hit, and players 78–79° off were missed in three pulls. So the cone is roughly **116–146°** wide. RaidTrace draws about 130°; FluffySim now uses 120°.
- **Decision:** the measurement wins over Yan's text on how wide the cone is (game behaviour, not strategy). Both Ruin III diagrams draw **130°**, RaidTrace's own width and inside the measured window. The text says "about 130°" and keeps Yan's quote. Positions are unchanged: only tanks are in it either way.
