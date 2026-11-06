# Stage 2 / P1 mitigation: owner review

Source: Ikuya v6.3, tabs "P1 | Kefka" and "Omnitank" (P1 block).

- Generated data: `data/mitigation/p1.ikuya.json`, rebuilt with `python3 -I scripts/extract_ikuya.py 1`. Don't edit it by hand.
- Hand-authored links: `data/mitigation/p1.overlay.json`.
- Checks and matrix: `npm run validate` → `docs/COMPLETION.md` (Mitigation events table).

15 events (11 party, 4 tank) and 86 entries. Every ➔ is stored as a carry-over pointing at the event where the ability was actually pressed; chains are followed back to the original press.

Answer **yes / no / unsure**.

## Answers (2026-11-07), applied
- Items 1–4 (derived links): correct → approved.
- Item 5 (Indulgent Will): the tether hit with heavy damage + Confused; the other role gets Idyllic Will (small AoE + Sleep). Source: bibikibay.moe week-1 write-up (quoted by owner). Linked to Tele-trouncing / teleport spread → approved.
- Item 7 (Extras ✔): probably "use spare mitigation"; the guide ignores it.

- Items 6, 8–14 and the 10 name-matched links: approved.

**Status: P1 mitigation fully approved (Ikuya v6.3).**

## Event → mechanic links I derived
1. **0:38 Mystery Magic** = the Fire + Ice true/lie at the start of Graven Image I.
2. **0:43 Wave Cannon** = the statue's beams in Graven Image I. *(Ikuya: targeted mitigation doesn't work on it, which fits a hit from the statue.)*
3. **1:28 / 1:46 Gravitas II Part I / II** = Graven Image II round-1 (south) and round-2 (north) gravity stacks.
4. **3:07 Mystery Magic** = the final Thunder + Fire in Tele-trouncing.
5. **2:53 Indulgent Will:** no source says what it is. It falls inside Tele-trouncing (maybe the sleep/confusion tethers?). Currently **unverified**.

Linked by name (source-stated): Ruin III ×2, Hyperdrive ×2, Light of Judgment ×2, and Double-Trouble Trap ×3 → the trap pass in GI1, GI2 and Tele-trouncing.

## Sheet details to confirm
6. Times are stored as `h:mm` but mean `m:ss` (`0:38` = 38 s). In P1, absolute time = phase time.
7. "Extras" column: a lone ✔ on Light of Judgment #1. No legend in the sheet. Do you know what it means? (Stored as a raw flag for now.)
8. Typo "Serpah" (SCH, Gravitas II Part II) is read as **Seraph**, so the 1:58 "➔ Seraph" carry-over links back to it.
9. "Provoke During Castbar" is kept as one instruction, not split into Provoke + a timing.

## Spot-check (compare with the sheet)
10. **MT party mit by job:** GNB/DRK press at 0:38 and carry to 0:43 and 0:50; WAR/PLD press at 0:43. *(Footnote ¹: "WAR/PLD can use after Revolting Ruin III finishes".)*
11. **WHM Temperance:** pressed at 0:38, carried to 0:43 and 0:50. Pressed again at 2:45, carried to 2:53 and 3:07.
12. **SGE:**
    - 0:38: Kerachole ² + Zoe Shields.
    - 0:43: Holos pressed, Kerachole carried.
    - 0:50: Holos carried.
    - 1:03: Kerachole pressed again.
13. **Footnotes stay attached:**
    - ¹ on OT Party Mit and D3 Party Mit (0:38).
    - ² on SGE Kerachole (0:38).
    - ³ on WHM Liturgy of the Bell (1:46).
    - ⁴ on SCH Seraphism (1:28).
    - Omnitank: ¹ on both Ruin III, ² on both Hyperdrive, ³ on MT Invulnerability (2:16).
14. **Tank plan (Omnitank):**
    - Ruin III #1: MT kitchen sink; OT buddy mit + Provoke during castbar.
    - Hyperdrive #1: MT buddy mit; OT kitchen sink.
    - Ruin III #2: MT Provoke during castbar; OT invuln.
    - Hyperdrive #2: MT invuln ³.
