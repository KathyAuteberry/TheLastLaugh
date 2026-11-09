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

## Replay timing (owner decision, 2026-11-07)

The replay's clock comes from **cactbot** (`cactbot-dmu`) and **BossMod Reborn** (`bmr-dmu`). Ikuya stays the only source for mitigation. Neither timing source is ever used for positions or assignments.

- **Rule:** use cactbot's time when its line names the ability and BossMod Reborn agrees within 1 s. Otherwise use BossMod Reborn. If neither times a moment, it is shown as approximate ("≈"). The validator enforces this (`data/timeline/p1.json`).
- **Agreement:** the two sources agree within 0.6 s on every P1 step they both time.
- **Ikuya's times are read as when to press** (owner: "give Ikuya the benefit of the doubt"). A gap to the hit is not treated as an error. 14 of Ikuya's 15 events are within 1 s of the hit.

## D-P1-03: Tele-trouncing trap knockback time (status: DECIDED 2026-11-07)

- **Ikuya** (row 24): Double-Trouble Trap at **2:45** (165 s).
- **BossMod Reborn:** the two knockback casts are done at **168.2 s**.
- **cactbot:** has only an un-synced "--knockback--" note at **170.6 s**, with no ability on the line, so it counts as an estimate.
- **Decision:** the replay shows the hit at 168.2 (BossMod Reborn). Ikuya's 2:45 is kept as the press time, 3.2 s before the hit. Milestone R3 adds ability durations, and then the validator checks that every press still lasts until the hit.

## D-P1-04: Tele-trouncing arrow deal (2026-11-07)

- **Yan** gives the tile layout (yan-p1-17: red frame = same arrows, blue = different) and one real deal in a status-bar screenshot (yan-p1-16).
- **Azurite video (8:10):** one role gets two different arrows, the other two of the same. The arrows drop as teleporters when their timers run out. The video's placement ("bigger box strat") differs from Yan's; Yan wins, and only the mechanic description is used.
- **BossMod Reborn:** confirms short- and long-timer arrows (second debuff over 8 s), with the drops about 3 s apart.
- **Decision:** the guide and the replay use Yan's screenshot as an example deal, and a variation flips which role gets the matching pairs. Who gets which pair is random and is labelled as an example. Supersedes the "carried spots" answer for Tele-trouncing arrows (review item 38) at the owner's request.

## D-P1-05: Tele-trouncing confusion and teleports (2026-11-07)

- **Owner:** the confused player walks into the arrow while trying to hit the nearby player, is teleported four times while confused, and Thunder resolves soon after.
- **Azurite video (8:40, 10:41):** the statue tethers one role to confusion (chases and KOs the closest player) and the other to sleep (small AoE). All arrows must be taken (a P3 prerequisite). Confused players sometimes ran through arrows without teleporting, and the video's group changed its movement to fix that. That is the video's strat, so it is not used.
- **Yan:** no confusion diagram. The fixed teleport spread (yan-p1-19) puts one support and one DPS in each quadrant. The line between them crosses the first arrow of that quadrant's blue frame. The four arrows of each quadrant (yan-p1-17) chain: each one points at the next cell (NW ↑ ← ↓ ↓, NE → ↑ ← ←, SE ↓ → ↑ ↑, SW ← ↓ → →).
- **Disagreement in the measurements:** by raw distance in Yan's picture, OT is closer to MT and D2 than to D4, and D1 is about as close to D2 as to H1. "Nearest player" would send OT, D1 and D2 at the wrong person. The guide pairs by quadrant, as the owner describes.
- **Not from a source:** the jump length (the next cell, about 7 y; off the tiles on the fourth jump, by the average jump) and the teleport times (spread evenly over the confusion, labelled as estimates).
- **Decision:** new "Confused" variation (tanks + healers or DPS). The confused players walk into their quadrant's first arrow and take all four arrows; the sleepers stay put.

## D-P1-06: Mitigation durations and one carry-over that runs out (2026-11-09)

- **Ikuya:** shows who presses what and when (the sheet's time = press time, owner decision), and marks with ➔ when an earlier press is meant to still cover a later hit.
- **Job Guide (official, checked 2026-11-09):** how long each effect lasts. The replay's lane bars use these (`durations` in data/mitigation/abilities.json). Where the page lists several durations (e.g. Holos: 30 s barrier, 20 s damage reduction), the bar uses the mitigating effect and the choice is written next to the number.
- **Disagreement:** WHM Temperance pressed at 2:45 (Double-Trouble Trap) is carried to the 3:07 Mystery Magic hit (3:07.1). Temperance lasts 20 s, so it ends at 3:05.0, 2.1 s before that hit. Every other carry-over in P1 fits within its duration.
- **Decision (owner-approved 2026-11-09):** keep Ikuya's plan as written and show the gap: the bar ends before the ➔ marker, which is drawn in red. A later press (2:47.1 or after) would cover both hits; that is not stated by any source, so the guide does not suggest it.
