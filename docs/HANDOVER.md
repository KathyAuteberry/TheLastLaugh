# The Last Laugh: Project Handover

## Goal
English interactive guide for Dancing Mad (Ultimate) in FFXIV.
- Execution strategy: Yan Flash (https://yan-flash.com/ultimate/yosei-ranbu)
- Mitigation: Ikuya Mitty's DMU sheet (active tabs only; latest changelog version listed: 6.3)
- Tagline: "Study hard. Clown responsibly."
- Working name history: Kefkademy -> **The Last Laugh**

## Source hierarchy
1. Yan Flash defines execution (positions, assignments, resolution order).
2. Ikuya Mitty defines mitigation.
   Timing and in-game behaviour (when things hit, jump lengths, knockbacks, where casters stand) come first from the owner's in-game logs and traces (`owner-logs-dmu`; owner, 2026-11-12), then cactbot, then BossMod Reborn, then labelled estimates. Yan still wins on execution and Ikuya on mitigation. Never store player names, actor IDs or raw log lines; only derived numbers.
3. Secondary sources (pastebin 8HN6chgM, starfallxiv/dmu, Ultimate Uncoiled, Ulti Strats, XIV Mit, consolegameswiki) are for clarification only.
   Never silently merge a conflicting secondary source. Record every disagreement in docs/STRATEGY_DECISIONS.md.
4. If a source can't be fetched or read, document the limitation. Never invent missing information.

## Ikuya sheet rules
- Use active tabs only (P1-P5, Omnitank, Changelog, notes). Archived/old tabs are historical.
- The arrow (➔) means carry-over from an earlier press. It is NOT a re-press.
- Footnote markers (superscripts) change meaning; keep them attached to their entries.
- Job-specific variants exist (e.g. GNB/DRK vs WAR/PLD party mit). Preserve them.
- Record the sheet version used. The plan changes often.
- P5 timestamps differ between plan versions and the Omnitank page; do not interpolate unverified times.

## Known state
- A one-shot Codex build exists (trycloudflare URL). Treat it as UNTRUSTED. P1 has confirmed errors.
- The owner's P1 mistake list is in docs/source/p1-mistakes.md. Use it as test cases and root-cause material
  (data extraction error vs rendering error).

## Process (staged, each stage ends with an owner review)
0. Capability check + schema proposal. Report only, no building.
1. Extract Yan Flash phase by phase into structured data. No UI. Uncertain items flagged, image references kept.
2. Normalize Ikuya active tabs. Spot-check list for the owner.
3. Diagram engine + P1 vertical slice. Verification badge per mechanic, settable only by the owner.
4. P2 to P5, one checkpoint per phase.
5. Tests, polish, docs.

## Rules
- Never fabricate geometry, positions, AoE sizes, or timings.
- Unreadable or unverified means marked "unverified", visibly, in the data and in the UI.
- Keep a completion matrix. An incomplete mechanic must never look verified.
- At each checkpoint give the owner short yes / no / unsure items, not prose to wade through.
- Keep mechanics data, presentation, and rendering separate. Data-driven, schema-validated.
- Credit sources. Fan-made project; no official Square Enix art or logos.

## Open items
- Confirm the environment can fetch Yan Flash and view its images.
- Confirm the xlsx is readable, including embedded images.
- Owner to supply the P1 error list.
