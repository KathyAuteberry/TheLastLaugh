# Plan: P1 replay timeline (Tomestone-style)

Status: **R1 built, awaiting owner review** (2026-11-07). Timing decision made (below). Decisions 2–4 are needed before R3.

## Goal
A second view next to the guide. It shows one P1 pull as a playable timeline:
- a fight clock with play/pause, speed (0.5×, 1×, 2×) and a seek bar;
- the top-down arena for the current moment;
- mitigation lanes showing who presses what, and how long it stays active.

## What it reuses (no new rendering engine)
- `buildSteps(mechanic, geometry, selection)`: the same ordered steps as the guide, already chained across mechanics.
- `Arena`: markers already glide between steps.
- The variation radio rows, so a pull is one combination (e.g. GI1 spread / Ice lie / Ice 2 true / Thunder lie).
- Mitigation data and the real ability names for the selected jobs.

## The one hard problem: timing
Ikuya gives exact times for 15 damage events only. Every other step (tethers, beam line-up, towers, teleports) has no time.

**Found a second source:** cactbot's Dancing Mad timeline (`ui/raidboss/data/07-dt/ultimate/dancing_mad.txt`, OverlayPlugin/cactbot, Apache-2.0). It is a community-maintained, log-derived list of ability timestamps covering all of P1:
- Graven Image casts and the trap knockbacks;
- Mystery Magic 1 and 2;
- Gravitas ×2 and Vitrophyre;
- Tele-trouncing and Indulgent Will;
- the >15% enrage branch.

It agrees with Ikuya within about 1 s on 14 of 15 events, for example:

| Event | Ikuya | cactbot |
|---|---|---|
| Revolting Ruin III | 0:16 | 15.6 |
| Mystery Magic | 0:38 | 37.4 |
| Wave Cannon | 0:43 | 42.5 |
| Light of Judgment | 1:03 | 62.7 |
| Gravitas (Part II) | 1:46 | 105.8 |
| Mystery Magic (Tele) | 3:07 | 186.3 |

The exception is the Tele-trouncing trap: Ikuya says 2:45, while cactbot puts the knockback at 2:50.6. That would be recorded as a disagreement.

### Decision (owner, 2026-11-07)
**cactbot + BossMod Reborn for the replay clock; Ikuya for mitigation.** Ikuya's times are read as *when to press*, so being a few seconds before the hit is fine ("benefit of the doubt").

- **Rule** (enforced by the validator): use cactbot's time when its line names the ability and BossMod Reborn agrees within 1 s. Otherwise use BossMod Reborn. If neither times a moment, it is shown as "≈" and placed between its neighbours, never presented as exact.
- **Result:**
  - The two sources agree within 0.6 s on every P1 step they both time.
  - BossMod Reborn is the source for only 2 steps: the Tele trap knockback (cactbot has only an un-synced note) and the Graviga puddles.
  - Only 1 step is "≈": the GI2 knockback-landing frame.
- **The Tele trap:** the hit is at 168.2 s (BossMod Reborn) and Ikuya's 2:45 is the press time, 3.2 s before. Recorded as D-P1-03 in STRATEGY_DECISIONS.md.
- **Not doing:** interpolating times and presenting them as exact.

## Mitigation lanes
- One lane per role, all 8, with your role highlighted (owner, 2026-11-07).
- **Press:** a dot at the event time.
- **Active window:** a bar using the **duration from the official Job Guide** (e.g. Dark Missionary 15 s, Temperance 20 s), added to `abilities.json`.
- **Carry-over (➔):** shown as the earlier bar reaching the later event, not as a new press.
- **Bonus check:** the validator can flag any Ikuya carry-over that would outlast the ability's real duration.

## Data and code changes
1. **`data/timeline/p1.json` (new):** per step key, `{ t, source: "cactbot" | "ikuya", abilityId?, note }`; plus the phase-end / enrage marker.
2. **`abilities.json`:** add `durationSec` per ability (Job Guide).
3. **`src/model/timeline.ts`:**
   - `stepAt(t)` returns the current step;
   - `activeMits(t, who)` returns active presses and carry-overs.
   Pure functions with unit tests.
4. **`src/replay/ReplayView.tsx`:**
   - clock, seek bar (mechanic segments + event ticks), arena, lanes;
   - deep link `#replay?t=1:28&v=<selection>`;
   - a "Guide / Replay" switch in the header.
5. **Validator:** steps in time order, every Ikuya event within 1 s of its step (or listed as a disagreement), carry-overs within durations.
6. **Playwright smoke test:** load the replay, seek to 1:28, check the step and active mitigation.

## Milestones (owner review after each)
- **R1 ✅ (built 2026-11-07, awaiting review):** `data/timeline/p1.json`, sources `cactbot-dmu` / `bmr-dmu`, `src/model/timeline.ts` (`buildTimeline`, `stepAt`, `ikuyaTiming`, clock helpers) + 7 tests, validator rules, a timing table in COMPLETION.md, and D-P1-03.
- **R2 ✅ (built 2026-11-07, awaiting review):** `src/replay/ReplayView.tsx` with the clock, play/pause, 0.5–2× speed, a seek bar (mechanic segments, step ticks, Ikuya ◆), the arena, per-mechanic variation choices, "up next", and a Guide/Replay switch (`#replay`).
- **R3:** mitigation lanes with durations.
- **R4:** deep links, mobile layout, Playwright.

## Decisions needed
1. ~~Timing~~: decided, cactbot + BossMod Reborn.
2. ~~Lanes~~: decided (owner, 2026-11-07): all 8 roles, yours highlighted.
3. Durations from the Job Guide for the active bars: OK?
4. Replay ends at the P1 transition (or the >15% enrage branch, shown as a note)?
