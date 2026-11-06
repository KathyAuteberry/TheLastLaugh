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
