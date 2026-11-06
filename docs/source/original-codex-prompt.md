Project: Kefkademy — The Dancing Mad Ultimate Field Guide
Build an extraordinary, production-quality, English-language interactive strategy guide for Dancing Mad (Ultimate) in Final Fantasy XIV.

Working title: Kefkademy
Tagline: Study hard. Clown responsibly.

The guide should teach the Yan Flash (ヤーン速報 / 絶妖星乱舞) strategy and seamlessly integrate Ikuya Mitty's DMU mitigation plan into the corresponding mechanics.

I want this to be the kind of raid guide people bookmark, share with their statics, and actually enjoy using.

This is a serious, ambitious project. Treat it as a polished product, with uncompromising attention to raid accuracy, visual clarity, and usability.
1. Research and source material
Primary strategy source
Yan Flash — 絶妖星乱舞 攻略特設

https://yan-flash.com/ultimate/yosei-ranbu

This is the authoritative source for our chosen strategy.

Study the entire guide, including:
- P1 — Kefka
- P2 — Forsaken Kefka
- P3 — first half
- P3 — second half
- P4 — Kefka Says
- P5 — Kefka Reimagined
Note that Yan Flash divides P3 into two sections, while the encounter has five main phases.

Read the Japanese text carefully. Examine every diagram, illustration, table, macro, positional assignment, and relevant revision note.

Do not rely on automatic translation alone for complex mechanics. Translate into natural English FFXIV raiding terminology, preserving the actual meaning and execution details.
Primary mitigation source
Ikuya Mitty (DMU)

https://docs.google.com/spreadsheets/d/10C3ytfH3irHqkb45rchIq5oqdAs-v_OKTj57M-Twi3k/edit?gid=161526414#gid=161526414

A local XLSX export may also be supplied in the repository.

Study the complete workbook, especially:
- The five active phase sheets
- Changelog and notes
- Healer Optimization
- Omnitank and relevant tank composition information
- Absolute timestamps and phase-relative timestamps
- Job-specific mitigation and healing assignments
- Carry-over indicators, footnotes, exceptions, and timing constraints
The workbook contains embedded visual elements; inspect these as well as cell values.

Use the latest active recommendations. Treat archived or superseded tabs as historical reference.
Additional sources
Community strategy pastebin

https://pastebin.com/8HN6chgM

Existing English Yan Flash localization

https://github.com/starfallxiv/dmu

Ultimate Uncoiled

https://ultimateuncoiled.com/umad/

Ulti Strats

https://ultistrats.com/guides/umad/

XIV Mit

https://ffxivmit.com/

General encounter information

https://ffxiv.consolegameswiki.com/wiki/UMAD

Research any additional useful references you discover, including reliable video demonstrations, raidplans, mechanic breakdowns, and patch-related changes.

These resources have different purposes:
1. Yan Flash defines our preferred execution strategy.
2. Ikuya Mitty defines our baseline mitigation plan.
3. Other resources explain encounter mechanics, clarify ambiguities, or help verify details.
Do not accidentally combine incompatible strategies.

If a secondary source recommends different positions, priorities, invulnerability routing, or mechanic handling, identify the difference. Preserve Yan Flash as the selected strategy unless there is evidence that its instructions are outdated or incorrect.

Check source dates and revision histories. Some English translations may predate important Japanese guide updates.

If a resource cannot be accessed, document that limitation and continue researching. Never invent missing information.
2. Research deliverables
Before building the main interface, produce structured, maintainable research documentation.

Create:
- docs/SOURCES.md — source inventory, authors, URLs, dates, reliability, and purposes.
- docs/MECHANICS.md — complete mechanic inventory by phase, in execution order.
- docs/GLOSSARY.md — Japanese names, official English names where available, community terminology, and abbreviations.
- docs/STRATEGY_DECISIONS.md — chosen variants, source disagreements, and reasons for each decision.
- docs/VERIFICATION.md — source verification status, unresolved questions, and diagram review notes.
For every mechanic, establish:
- What happens.
- What players must recognize.
- What each role does.
- How assignments are determined.
- Where players must stand and move.
- The correct resolution order.
- Important timing dependencies.
- Why the strategy works.
- What usually causes wipes.
- Relevant mitigation and healing.
- Source references.
Create a structured representation of this information so that the guide is data-driven.

Do not bury all raid knowledge inside giant React components.
3. Product vision and visual design
Imagine a premium interactive raid encyclopedia combined with an exceptional tactical visualization tool.

The visual identity should draw inspiration from Kefka's theatrical, chaotic aesthetic while maintaining outstanding readability.

Think:
- Elegant dark backgrounds
- Rich violet, crimson, gold, and restrained magical accents
- Strong editorial typography
- Sophisticated composition and spacing
- Beautiful but purposeful transitions
- High-quality original arena illustrations
- Clearly differentiated damage, danger, safety, and movement indicators
- Professional iconography
- A touch of Kefka-inspired humor and personality
Avoid generic AI-generated dashboard aesthetics, excessive glassmorphism, and endless indistinguishable cards.

The design should feel cohesive, deliberate, memorable, and made specifically for this encounter.

Use strong hierarchy. The player's next action should always be visually obvious.

Support desktop and mobile. Desktop should be especially good because raiders frequently study guides on a second monitor.

Accessibility matters: keyboard navigation, readable contrasts, color-blind-friendly encodings, reduced-motion preferences, and proper focus behavior.
4. Main guide structure
Build a complete encounter overview followed by five substantial phase guides.

Each phase should include:
Phase overview
A concise introduction explaining the phase's central ideas, major threats, and skill requirements.

Provide a visual mechanic timeline with meaningful chapter divisions.
Mechanic-by-mechanic walkthroughs
Every significant mechanic should have its own dedicated section containing:

At a glance

A concise instruction summarizing what the player actually needs to do.

Recognize

The visual, castbar, debuff, animation, or boss-position cue that determines the resolution.

Execute

A precise, numbered sequence of actions.

Visualize

An accurate, interactive diagram showing positions, movement, and timing.

Role-specific instructions

Relevant responsibilities for MT, OT/ST, H1, H2, and D1–D4.

Mitigation and healing

The synchronized Ikuya Mitty recommendations.

Common mistakes

The critical mistakes and their consequences.

Why this works

A compact mechanical explanation for players who want to understand the underlying logic.

Provide links to the original sources and relevant video demonstrations when available.

Avoid walls of text. Progressive disclosure should keep the initial presentation concise while making detailed explanations readily accessible.
5. The centerpiece: exceptional interactive diagrams
This is the most important visual feature.

I want beautiful, accurate, purpose-built encounter diagrams.

Use a reusable SVG-based or similarly precise vector rendering system.

Represent:
- Arena geometry and orientation
- Waymarks
- Boss and enemy positions
- Eight player positions
- Safe and dangerous zones
- Stack and spread indicators
- Towers and soak locations
- Tethers
- Debuffs
- Knockbacks
- Movement paths
- Facing and directional attacks
- Ordering and priority relationships
- Mechanic-specific objects
Every relevant mechanic should have a sequence of diagrams, even when an animation would add no value.
Interactive playback
Where practical, allow users to:
- Step backward and forward
- Play and pause the sequence
- Scrub through meaningful mechanic states
- Select a role to highlight its position and movement
- Switch between legitimate mechanic variations
- Display or hide explanatory overlays
- Inspect individual elements
- Reset to the initial state
Animations should communicate actual mechanic execution. Do not add decorative movement that might misrepresent timing.
Fidelity requirements
Accuracy is non-negotiable.

A polished diagram containing an incorrect safe spot is unacceptable.

Reconstruct the actual geometry and assignments from verified source material.

Maintain consistent north orientation and waymark conventions, unless a mechanic requires a clearly labeled relative orientation.

Explicitly distinguish:
- Fixed positions
- Relative positions
- Example positions
- Randomized outcomes
- Orientation-dependent positions
- Mechanics requiring player adjustment
Never use arbitrary rotations, mirrored assignments, invented AoE sizes, or approximate geometry without clearly identifying them.

Where exact geometry is uncertain, avoid presenting an unverified visualization as authoritative.

Use original vector diagrams where possible. Credit original authors appropriately and respect third-party asset licenses.

Prioritize mechanical clarity over realism.
6. Deep integration with Ikuya Mitty
Mitigation must feel like an integral part of the walkthrough.

For each relevant damage event, show the corresponding Ikuya recommendations directly alongside the mechanic.

Build a synchronized encounter timeline covering both mechanic execution and mitigation planning.
Requirements
Support:
- MT and OT/ST assignments
- Tank job selection: WAR, PLD, DRK, GNB
- Healer job selection: WHM, AST, SCH, SGE
- DPS mitigation responsibilities
- Phase-relative and encounter-relative timestamps
- Ability names and recognizable icons
- Mitigation carry-over between consecutive events
- Job and composition-specific alternatives
- Important footnotes and exceptions
- Mitigation availability and cooldown constraints where verified
Preserve Ikuya's distinction between an ability being freshly activated and its effect continuing from an earlier mechanic.

Do not repeat carry-over abilities as though they must be pressed again.
Role-focused views
Allow users to select their role and job.

Highlight the mitigation and mechanic instructions relevant to that selection while preserving the ability to see party-wide responsibilities.

For example, a DRK playing MT should be able to quickly understand:
- Where to stand
- What mechanic is coming
- What to bait or resolve
- Whether a tank swap or invulnerability is required
- What mitigation to press
- When to press it
- Whether the mitigation must also cover the next damage event
Support configurable party compositions and explain assumptions when the mitigation plan depends on a particular composition.
Timeline integration
The encounter timeline should visually connect mechanics and mitigation events.

Selecting a mechanic should bring up its corresponding mitigation information, and selecting a mitigation event should navigate to the relevant mechanic.

Use precise timestamps from the source. Avoid creating an apparently exact timer by interpolating unverified event times.

Keep source notes visible where important.
Advanced usability
If practical, add a compact, role-filtered mitigation cheat sheet that can be printed or viewed on a second monitor.

Consider a cooldown-availability visualization, but only when supported by verified ability data.

Do not fabricate cooldown coverage or pretend the spreadsheet is universally valid for every party composition.
7. Personalization and raid preparation
Add practical customization features:
- Role selection
- Job selection
- Party assignment configuration
- Light-party identification
- Relevant strategy branch selection
- Saved preferences in local storage
- Deep links to individual mechanics
- Shareable links preserving relevant selections
- Compact reference mode
- Full learning mode
- Print-friendly cheat sheets
Use sensible default assignments that can be changed.

Remember player preferences locally without requiring accounts, databases, or a backend.

Make it trivial to switch between a detailed learning experience and a quick reference during actual progression.
8. Interactive learning tools
Where they genuinely improve learning, add interactive mechanic practice.

Examples include:

Position drills

Present a mechanic variation and ask the player to identify the correct destination or assignment.

Sequence exercises

Require the player to choose the correct order of movements or debuff resolutions.

Recognition exercises

Display a verified boss tell or debuff configuration and ask the player what happens next.

True/Lie exercises

Especially useful for P4. Let players practice interpreting the relevant stored mechanics and determining their correct actions.

Priority exercises

Useful for mechanics involving tethers, towers, markers, ordered soaks, or directional priorities.

Exercises must be driven by the same verified mechanic data as the reference diagrams.

Never generate random scenarios that violate actual encounter constraints.

Offer an explanation after each answer.

Do not sacrifice the core guide's completeness to implement elaborate minigames. Mechanic accuracy and reference usability remain the priorities.
9. Translation quality
Produce excellent English raid explanations.

Use official English game terminology where available, supplemented by commonly recognized community names.

Preserve Japanese terminology when it is useful for players who will encounter Japanese PF macros or callouts.

Offer a glossary mapping between English and Japanese terminology.

The writing style should be:
- Concise
- Precise
- Natural to experienced FFXIV raiders
- Easy to scan
- Technically accurate
- Free of awkward literal translations
Avoid lengthy introductory prose before explaining what to do.

Use a consistent terminology and abbreviation system throughout the application.
10. Source traceability and future maintenance
Strategies evolve. The guide should be easy to update.

Each mechanic's structured data should include relevant source URLs, verification information, and applicable strategy revisions.

Provide a credits and sources page.

Where practical, show a discreet source link within each mechanic.

Add a clear last-reviewed date and a visible indicator for mechanics with unresolved verification issues.

Build the content architecture so individual mechanics, timelines, mitigation assignments, and diagrams can be updated independently.

Do not silently overwrite verified instructions with material from a secondary source.
11. Technical architecture
First inspect the repository and follow existing project conventions.

If this is a new or effectively empty repository, prefer:
- React
- TypeScript with strict typing
- Vite
- Tailwind CSS
- High-quality accessible UI primitives
- SVG-based mechanic visualization
- Lightweight animation tooling
- Vitest for logic and data validation
- Playwright for browser and visual regression testing
Choose additional dependencies carefully.

Create reusable components for:
- Phase navigation
- Mechanic pages
- Timeline events
- Interactive arena diagrams
- Player markers
- Movement paths
- AoE shapes
- Debuff indicators
- Mitigation assignments
- Ability icons
- Source citations
- Practice scenarios
Keep raid mechanics, presentation, and rendering logic cleanly separated.

Create a well-defined data schema with validation.

Static hosting should be sufficient. Avoid unnecessary backend infrastructure.

Optimize the initial page load and ensure that interactive diagrams remain responsive.
12. Quality assurance
Treat this as an application where incorrect information can cause real raid wipes.
Content verification
For every mechanic, verify:
- Correct strategy variant
- Correct party assignments
- Correct positional priorities
- Correct orientation
- Correct movement order
- Correct debuff interpretation
- Correct timing relationships
- Correct mitigation mappings
- Correct English terminology
Specifically review conditional mechanics and every diagram variation.
Automated tests
Write meaningful tests for:
- Mechanic data schema validity
- Timeline sorting and synchronization
- Role filtering
- Mitigation matching
- Carry-over interpretation
- Branch selection
- Known mechanic scenarios
- Source metadata completeness
- Deep linking and saved settings
Visual QA
Use browser automation and screenshots to inspect the actual rendered application.

Test desktop, laptop, tablet, and mobile layouts.

Verify that:
- Diagrams are readable
- Labels never obscure important positions
- Animations behave correctly
- Text does not overflow
- Interactive controls work
- Navigation is intuitive
- Light/dark contrasts are accessible
- Reduced-motion behavior works
- Loading and error states are polished
Make corrections based on actual rendered output.

Do not assume a successful build means the UX is good.
13. Implementation process
Work autonomously and make sensible engineering and design decisions.

Do not stop at planning, project scaffolding, mockups, or a generic landing page.

Proceed through:
1. Research the encounter and source material.
2. Establish the chosen strategy and source-of-truth hierarchy.
3. Extract and normalize mitigation data.
4. Define the mechanic data model.
5. Build the visual design system.
6. Implement the actual phase guides.
7. Build the reusable interactive diagram engine.
8. Create verified diagrams and mechanic sequences.
9. Integrate synchronized mitigation information.
10. Add role personalization and reference features.
11. Add meaningful interactive practice tools.
12. Test, inspect, refine, and document the application.
Prioritize a fully functional, high-quality guide containing authentic raid content.

If the full scope exceeds the available execution context, create a coherent, genuinely usable vertical slice and maintain an explicit completion matrix for the remaining work. Complete as much as possible without leaving misleading placeholders.

An incomplete mechanic must never appear to be fully documented or verified.

Avoid hardcoded fake data and decorative demo mechanics.
14. Definition of done
The desired finished product must have:
- Complete English coverage of all five phases
- Correct Yan Flash strategy integration
- Accurate, substantial visualizations of important mechanics
- Ikuya Mitty mitigation integrated with corresponding damage events
- Interactive role-specific guidance
- Navigable mechanic and mitigation timelines
- Excellent desktop and mobile usability
- Consistent English terminology
- Credited sources and revision tracking
- Automated testing
- A polished visual identity
- Useful documentation for future maintenance
The user should be able to open Kefkademy, select their role, choose any phase, and learn precisely how to execute each mechanic and which mitigation is expected.

The guide should also work exceptionally well for a static leader explaining a mechanic to other players.

Above all, deliver a genuinely impressive application.

Content accuracy, exceptional diagrams, and intuitive UX are the three defining priorities.

Build something worthy of the name Kefkademy.

Study hard. Clown responsibly.
