# Stage 5 review: replay and filled-in diagrams (rounds 7–10)

Built 2026-11-07 from your replay feedback. These changed what you had approved, so their approval is reset:
- **Mechanics:** Revolting Ruin III #1 (new pull step) and Time's Up (new step).
- **Scenes:** 9 scenes (34–40 below).

Open the guide or the Replay tab to check them.

## New rule: carried spots

When a step has no position from any source and nobody needs to move (raidwides, a tankbuster on someone else), the roles stay **where the previous step left them**.
- They are drawn faded and dashed.
- The legend says "stays where the previous step left them".
- They are computed when the page draws; no coordinates are stored. The arena chains them through the whole pull, in the guide too.
- Tests check that every diagram in the pull now places all 8 roles, for every variation, and that each carried role sits exactly on its previous spot.

## Items

34. **Pull: neutral positions** (new first step of Ruin III #1, 0:00 → 0:10.6).
    - MT is north of the boss, on the Ruin III tank spot.
    - Everyone else is loosely spread in the south half: a new "loose" marker type, because only an area is given and the exact dots are illustrative.
    - Source: your instruction.
35. **Ruin III #1 cast:** the cone appears only from the castbar (0:10.6, cactbot). Everyone except MT carries over from the pull, which keeps them out of the cone.
36. **Light of Judgment ×2 and Hyperdrive ×2:** carried spots.
    - After Graven Image I, everyone is still in the two Mystery Magic dodge stacks during Light of Judgment and Hyperdrive.
    - Is that right, or does the party move somewhere for the raidwide or the buster? Yan doesn't say.
37. **Graven Image I: tether + knockback** (was text-only).
    - Statue tethers on the group chosen in the new "Statue tether" variation.
    - One knockback arrow points away from the statue.
    - Superseded by item 43: spots are the computed pre-knockback spots, not carried from the pull.
38. **Tele-trouncing arrows:** previously nobody was drawn. Players now carry over from Hyperdrive #2, meaning "where you stand when the debuffs go out", with the tile frames as before.
    - **Owner (2026-11-07):** keep carried spots. Confusion should walk players into the correct tile, and they survive it through what is essentially a series of four knockbacks ("maybe; the best answer I have right now"). Revisit if a source shows the tile assignment.
    - **Superseded in round 9 (item 49):** players now walk to their tiles and drop their arrows there.
39. **Ruin III #2 (guide):** it has no steps of its own, so the guide now shows Graven Image II's "Ruin III #2 + half-room" step, with a link back.
40. **Time's Up (new step):**
    - Kefka goes untargetable at 3:17.9 (BossMod Reborn).
    - Below 14.9% HP the fight goes to P2 (Yan). Above it, Light of Judgment (enrage) wipes the party at about 3:22 (cactbot, which marks this line as unconfirmed).
    - Shown as a raidwide labelled "only if above 14.9%", with spots carried from the final spread/stack.

## Replay (R2)

The replay view is described in `docs/plans/replay-timeline.md`. It now:
- starts on the neutral pull;
- shows the marker key under the arena;
- ends on the Time's Up step.

## Round 8: moving early in the replay (built 2026-11-07)

Your feedback: start south, MT runs in just before the pull, groups head to their side right after the pull, and the tethered group moves north about 0.5 s after the tether. You asked me to work out the same "get ready early" logic for the rest of P1.

**How movement works now (replay only):** every role starts walking **0.5 s after the moment that tells them where to go** (your reaction time) and runs at 6 y/s (FFXIV's base run speed: my assumption, not from a source; no Sprint). By default that moment is when the previous step resolves. Where the answer isn't known yet, a role heads **halfway between its possible spots** (a "hedge"). Knockbacks push a role in 0.3 s. This is all derived and labelled that way: the spots are still Yan's (or derived/carried as marked), and only the timing of the walk is added.

**Numbers from BossMod Reborn** (game mechanics, not strategy):
- arena radius 20 y;
- Pulse Wave knocks back **only the tethered players**, 13 y from the statue, 5.1 s after the tether, so the tether appears at about 0:30.0;
- Fire and Ice are shown when the Mystery Magic castbar starts (0:32.4);
- the Double-Trouble Trap knocks the stack 14 y away from the holder;
- sleep and confusion after Tele-trouncing end at about 3:00.5; the final Mystery Magic castbar starts at 3:01.8.

41. **Pre-pull (−3.0 s to 0:00):** everyone loosely south. MT starts running north 0.5 s before the pull.
42. **Pull → Graven Image I:** at 0:00.5 everyone heads to an approximate Graven Image I spot, the middle of their four possible Fire/Ice spots: tanks and healers west, DPS east. The test checks that this keeps everyone out of the Ruin III cone.
43. **Statue tether (new variation: tanks+healers or DPS):**
    - At 0:30.5 the tethered group moves north, halfway between its possible pre-knockback spots.
    - At 0:32.9, once Fire and Ice are shown, everyone goes to their exact spot. A tethered player stands where the 13 y push lands them on their Yan spot; everyone else walks straight to their spot.
    - **Note:** some north Yan spots (MT's NW spread spot, for example) are closer to the statue than 13 y, so they can't be reached by the push. Those players hug the statue, get pushed past their spot, and walk back. It takes under a second and they arrive before Ice resolves.
44. **Trap knockbacks (GI1, GI2, Tele-trouncing):** the stack is pushed 14 y away from the nearest holder, then everyone walks to the next spot.
45. **Tele-trouncing finale:** players are frozen while asleep or confused. At 3:01.0 they head halfway between their possible final spots; at 3:02.3, once Thunder and Fire are shown, they go to the exact spot.
46. **Everything else:** players start moving 0.5 s after the previous step resolves. No step needed a special early move: each next spot is either known from the previous step, or only reachable after a knockback.

**Feasibility check** (a test runs it for every variation): nobody arrives more than 0.5 s after their step resolves. Close calls:
- In some variations MT reaches the GI1 pre-knockback spot 0.4 s after the knockback is due, coming from the tank spot.
- At the GI2 puddles, H1 and D3 (the example holders who walk in after the knockback) arrive 0.3–0.4 s after BossMod Reborn's puddle time.
- The GI2 "knockback lands" frame has no real time (≈), so it isn't checked.

## Owner verdicts on rounds 7–8 (2026-11-07)

- **Approved:** 34, 35, 36, 37, 39, 40, 41, 42, 44, 46.
- **37:** approved. The GI1 Fire variation now reads True / Lie instead of Spread / Stack (item 50).
- **38:** replaced by the arrow drops in round 9 (items 48–49).
- **43:** approved. **Open:** is the Pulse Wave push straight away from the statue (as built) or straight south? The owner remembers south but isn't sure; it doesn't matter for now and can be adjusted later.
- **45:** keep the simplified version (frozen while asleep or confused, then hedge and commit).

## Round 9 (built 2026-11-07)

47. **Markers move with the players.** In the replay, the role markers had kept the guide's 0.7 s slide animation, so during playback players lagged behind markers drawn on them, such as Hyperdrive's ×3 and the stack markers. The replay now draws markers exactly where the motion model puts them. The trap-explosion circles, which are stored as points, now follow their holder while the holder walks. Ground AoEs (towers, puddles) stay put.
48. **Arrow debuffs on players** (new variation "Arrow debuffs"):
    - One role gets two different arrows and the other two of the same (Azurite video, 8:10).
    - **Example deal** from Yan's status-bar screenshot (yan-p1-16): the four different-arrow rows are read as MT, OT, H1, H2, and the four same-arrow rows as DPS. This assumes the game's party-list order with your own row first.
    - In the same screenshot, the 10 s debuff (the trap) sits on one support row and one DPS row. That fits the example holders H2 and D4.
    - The other option swaps the roles. Who gets which pair within a role is random each pull.
    - Drawn as small arrow chips under each player, short timer first. They appear when the Tele-trouncing cast ends (2:31.5, cactbot); that the debuffs go out then is derived from the timers.
49. **Dropping the arrows:**
    - When the debuffs go out, everyone walks to their frame. They drop the short-timer arrow on the cell showing that arrow (2:39.4), then step to the other cell and drop the long-timer arrow (2:42.4). Both times are from cactbot, and BossMod Reborn agrees within 0.4 s.
    - **Tiles:** all 16 start faint. Each lights up, with a gold ring, when its arrow drops, and they stay lit through the trap pass and the teleport spread.
    - **Cell spots:** halves of Yan's measured frames. Yan's image lists each frame's arrows top-to-bottom or left-to-right, which says which cell holds which arrow.
    - **Same arrow twice:** either cell can come first (Azurite video); the listed order is used.
    - Everyone reaches their cells in time, in both variations (test).
50. **GI1 Fire variation** relabelled True / Lie (True = spread, Lie = stack). This assumes Kefka shows individual spread markers in GI1; with a stack marker they would swap. Tele-trouncing's Fire row still says Spread / Stack, because the video says that Fire can be either.

## Owner verdicts on round 9 (2026-11-07)

- **Approved:** 47 (fixed), 48, 50.
- **49:** changed in round 10 (item 52).

## Round 10 (built 2026-11-07)

51. **Hyperdrive #2:** MT stays on the tank spot and everyone else waits in the south half (owner). The south spots are the same illustrative "loose" dots as the pre-pull.
    - Everyone starts heading there when the Graven Image II puddles resolve (2:01.5), since only the Light of Judgment raidwide comes before Hyperdrive. Starting after Light of Judgment would leave H1 0.6 s late.
    - Scene approval reset.
52. **Tele-trouncing arrows in three steps** (owner):
    1. **Arrow debuffs go out** (2:31.5, when the cast ends): nobody moves yet. Everyone stands where Hyperdrive #2 left them, with their arrow chips showing and all tiles faint.
    2. **First arrows drop** (2:39.4): everyone walks to their frame and drops the short-timer arrow.
    3. **Second arrows drop** (2:42.4).
    - The separate "cast ends" tick on the seek bar is gone; the new step replaces it.

## Owner verdicts on round 10 (2026-11-07)

- **Confirmed again:** 47 (fixed), 48, 49 (read as covering the three-step rework, item 52), 50.
- **51 (Hyperdrive #2):** not mentioned yet.
- **Owner note:** obvious fixes like 47 can be pre-confirmed (marked fixed once checked in the browser) instead of waiting for review.

## Round 11 (built 2026-11-07)

53. **Confusion: teleported along the arrows** (new step after the teleport spread, in the guide and the replay):
    1. **Stepped in:** each confused player walks at the other player in their quadrant and steps into the arrow between them. That's the first arrow of their quadrant's blue frame, and Yan's spread puts it right on that line.
    2. **Teleports 1–3:** each arrow sends them onto the next arrow of the quadrant. The four arrows chain (NW ↑ ← ↓ ↓, NE → ↑ ← ←, SE ↓ → ↑ ↑, SW ← ↓ → →).
    3. **Teleport 4:** the last arrow sends them off the tiles.
    - All 16 arrows are used up, 4 per confused player. A used arrow goes dark and each jump is a dashed line. The sleepers stay on their teleport-spread spots.
    - **Pairing by quadrant:** by raw distance in Yan's picture, OT, D1 and D2 are as close to another inner player as to their quadrant partner, so "nearest player" alone would not give this. Recorded in D-P1-05.
    - **Jump length:** the next cell (about 7 y), read from Yan's layout. The fourth jump uses the average. No source states it.
54. **New variation "Confused":** tanks + healers, or DPS. Either way there is one confused player per quadrant, because Yan's spread puts one support and one DPS in each.
55. **Teleport times are estimates** (marked ≈ in the replay, with a note):
    - The confusion starts at 2:53.4.
    - The longest walk-in takes 1.2 s.
    - The four teleports are spread evenly until the confusion wears off at 3:00.5 (BossMod Reborn).
    - Thunder still resolves at 3:06.3. A teleport is an instant jump, not a walk.
- **Also fixed:** the guide legend called every violet derived spot "moved to the nearest safe spot". It now says that only for dodge steps, and otherwise shows the step's own note.
- **Text change:** the new state resets the Tele-trouncing mechanic's approval.

## Owner verdicts on round 11 (2026-11-07)

- **Approved:** 53, 54, 55 ("at the very least good enough for the purpose of the guide").

## Round 12 (built 2026-11-07)

56. **Kefka's castbar** (replay), drawn under the boss: ability name, seconds left and a filling gold bar, shown only while Kefka is casting. Gold strips on the seek bar mark every cast.
    - **Data** (`casts` in data/timeline/p1.json): the end of each cast is the cactbot line for its own ability; the length is BossMod Reborn's cast time. Where cactbot has a cast-start line (Revolting Ruin III #1, the enrage), that start is used. BossMod Reborn's own start times agree within 0.5 s where it gives one.
    - **13 casts:** Revolting Ruin III ×2, Graven Image ×3, Mystery Magic ×3, Double-trouble Trap ×1, Light of Judgment ×2, Tele-trouncing, and the enrage Light of Judgment (only above 14.9%; the replay ends while it is still casting).
    - Hyperdrive has no cast. There is only one Double-trouble Trap cast in P1; later traps are the same debuff being passed on.
    - **Left out:** an unnamed 3 s Kefka cast ending at 2:48.7. cactbot hides it and BossMod Reborn calls it "Unknown", so its name isn't known.
    - **Timing change:** the "Thunder and Fire are shown" cue before Tele-trouncing's final spread moved from 3:01.8 (BossMod Reborn) to 3:01.3. cactbot names that cast, so its time is used, as for every other step.
57. **Boss token:** the triangle is now an original jester-cap token in the site's colours (not game art), with a red notch showing where the boss faces (north).

## Owner verdicts on round 12 (2026-11-08)

- **Approved:** 56, 57 ("Castbar and boss token looks good").

## Round 13 (built 2026-11-08)

58. **Variations panel moved** (replay): from under the diagram to the top of the right column, at a fixed height that fits the largest set (Tele-trouncing's six groups) from 1024 px wide up, so the "Resolves at" box and the rest no longer move between mechanics. Mechanics with nothing to choose show a short note in the same space. The guide view is unchanged.
    - Still moves: the "Moving early" box appears above "Resolves at" for a few steps and pushes it down.
59. **Design pass** (guide and replay, styling only: no data, positions, timings or text changed, so no approvals reset).
    - **Look:** near-neutral dark background, gold as the one accent (Play, current step, current mechanic), two panel styles instead of many outlined boxes, larger and lighter secondary text (no 11 px grey prose), JetBrains Mono for times.
    - **Header:** one compact sticky bar: wordmark, Guide/Replay switch, Role and Job dropdowns. The credits and "Study hard. Clown responsibly." moved to a footer shown on every page.
    - **Guide:** numbered mechanic list (sticky sidebar on wide screens, swipeable pills on phones). The mechanic title spans the page; on wide screens (1280 px+) the arena stays on screen while the step controls, step text, variations, key, mitigation and the explanation scroll beside it. Below that, the arena is capped in size and everything stacks.
    - **Replay:** clock, seek bar and transport in one panel; speed as a segmented control; the seek bar legend uses the same marks as the bar. Arena column capped at 32rem on wide screens and kept on screen while scrolling.
    - **Arena:** soft shadows under role markers, thin light outline instead of a black one, focus glow on your role, tinted waymarks, a slightly deeper rim. Dashed/violet outlines keep their meaning.
    - Checked at 375, 1024, 1280 and 1440 px: no sideways scroll; the replay's variations panel never needs scrolling, so the boxes below stay put.
- **Bookkeeping (2026-11-08, owner's go-ahead):** the scenes `p1-tele-trouncing/arrows` (items 49, 52) and `p1-tele-trouncing/confusion` (items 53–55) now carry `owner: approved`, so they no longer show "Diagram awaiting owner check". `p1-hyperdrive-2/hits` (item 51) is still awaiting review.

## Owner verdict on item 51 (2026-11-08)

- **Approved:** 51 (Hyperdrive #2: MT alone, others loose south). The `p1-hyperdrive-2/hits` scene now carries `owner: approved`; every P1 scene is owner-approved again. The timeline file as a whole is still unreviewed.
