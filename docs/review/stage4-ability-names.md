# Stage 4 draft: Ikuya's terms → real ability names

Draft data: `data/mitigation/abilities.draft.json`. The app doesn't use it yet.

**Source:** the official FFXIV Job Guide (na.finalfantasyxiv.com/jobguide), checked 2026-11-07. Every name below exists there with this exact spelling. The pages describe level-100 actions and point to the Patch 7.5 notes; they show no last-update date. No Square Enix icons are used.

## Generic terms in the P1 sheet

| Ikuya term | Slot | WAR | PLD | DRK | GNB |
|---|---|---|---|---|---|
| Party Mit | MT/OT | Shake It Off | Divine Veil ❓ | Dark Missionary | Heart of Light |
| Buddy Mit | MT/OT | Nascent Flash | Intervention | The Blackest Night ❓ | Heart of Corundum |
| Kitchen Sink ❓ | MT/OT | Rampart, Damnation, Bloodwhetting (+ Thrill of Battle) | Rampart, Guardian, Holy Sheltron (+ Bulwark) | Rampart, Shadowed Vigil, The Blackest Night, Oblation (+ Dark Mind) | Rampart, Great Nebula, Heart of Corundum (+ Camouflage) |
| Invulnerability | MT/OT | Holmgang | Hallowed Ground | Living Dead | Superbolide |
| Provoke During Castbar | MT/OT | Provoke (during the castbar), all tanks | | | |

| Ikuya term | Slot | Becomes |
|---|---|---|
| Party Mit | D3 | BRD Troubadour · MCH Tactician · DNC Shield Samba |
| Spreadlo | SCH | Adloquium → Deployment Tactics |
| Seraph | SCH | Summon Seraph → Consolation |
| Zoe Shields | SGE | Zoe → Eukrasian Prognosis II |

Already real names, verified and unchanged: Reprisal, Feint, Addle, Temperance, Divine Caress, Plenary Indulgence, Liturgy of the Bell, Neutral Sect, Sun Sign, Collective Unconscious, Macrocosmos, Expedient, Sacred Soil, Seraphism, Fey Illumination, Kerachole, Holos, Philosophia, Panhaima.

## Please confirm

1. **Kitchen Sink:** Ikuya never says what goes in it. My draft is Rampart + the 40% cooldown + the short cooldown, with the optional extra in brackets. Reprisal is left out because Ikuya lists it separately. Correct, or a different set?
2. **PLD Party Mit:** Divine Veil (barrier, 90s, same timing as the others), or Passage of Arms?
3. **DRK Buddy Mit:** The Blackest Night, or Oblation?
4. **D3 Party Mit:** this needs a DPS job choice (BRD/MCH/DNC) in the header, like the tank and healer Job selectors. Add it? D3 = physical ranged, which matches Ikuya giving D3 the party mit and D4 Addle.
5. **Spreadlo / Seraph / Zoe Shields:** are the expansions right? Should Spreadlo mention Recitation for a guaranteed critical Adloquium?
6. **Display:** show the real names with Ikuya's term underneath (e.g. "Press Shake It Off · Ikuya: Party Mit")? Then the sheet still matches what the guide shows.

## Owner answers (2026-11-07), applied

- **DRK Buddy Mit:** The Blackest Night + Oblation (both).
- **DRK Kitchen Sink:** Dark Mind is now a normal part of it, not optional.
- **PLD Party Mit:** Divine Veil + Passage of Arms (both).
- **Kitchen Sink** never includes Reprisal.
- **D3:** a Job selector (BRD/MCH/DNC) appears when My role = D3.
- **Healer shorthands:** you said "probably" (you don't play healer). They are shown with a `*` ("expansion not yet confirmed"), and Spreadlo now lists Recitation as optional. A healer should confirm them.
- **Display:** the real name for the selected job, with no Ikuya term shown (hover shows it). With no job selected, Ikuya's term is shown, e.g. "Dark Missionary" with DRK selected, "Party Mit" without.
- Data: `data/mitigation/abilities.json` (owner-approved). The validator checks that every ability in Ikuya's P1 sheet is either mapped or a verified real name.
