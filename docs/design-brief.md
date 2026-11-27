# Interactive YatA — Design Brief (v0.6, 2026-11-27)

## Concept
A solo, single-player web game inspired by Flare SciFi Forums' "You're the Admiral!" (archived at st-minutiae.com/articles/admiral/). The player commands a Starfleet sector; an AI GM delivers events and answers in character. Faithful to Star Trek canon (personal use only).

## Decisions
- **Players:** Solo. Human admiral + AI GM first. AI-as-admiral (human GMs) is a later mode, so seats are abstracted from day one.
- **No real-time generative plot.** The game runs authored scenarios with branching. During play the AI interprets the player's orders, chooses among authored outcomes, and writes the in-character responses; it may add flavor (names, dialogue) but never plot facts.
- **Phases:**
  1. **Proof of concept: low-complexity replay** — Sector Alpha. A fixed, non-branching script; branching is cosmetic.
  2. **Branching scenarios** — Sector Beta as the model: player choices change which events occur, with state carried forward; checkpoints rejoin branches.
  3. **Scenario engine** — the player supplies inputs (era, setting, factions, **complexity**, etc.) and the app generates a new scenario *before play*, in the same authored format.
- **Complexity** is a first-class scenario property.
- **Feedback:** In-world, in-character responses. Decisions can fail; early on, failure alters the scenario rather than ending it.
- **Rewards for good answers:** the GM grades plans against authored criteria, and grades feed back into mechanics (e.g. better fleet allocation odds).
- **Content:** Start with the original st-minutiae scenarios; originals later via the scenario engine. Forum-only parts (peer critique, player-written scenarios) dropped for now.
- **Sample answer:** One example of a reasonable answer, not an answer key.
- **Platform/stack:** TypeScript + React + Vite, single-file build published as a claude.ai artifact (AI GM via Claude's in-page capability; saves in the artifact database).
- **Parked:** Campaign continuity across sectors (career mode).

## Authoring rules
- **In-universe presentation.** From Question Three on, stages unfold as scenes reported by named characters (duty officers, ambassadors, ministers, rival commanders), not an out-of-character narrator. Named characters help immersion and may be added freely.
- **Short-answer scenes.** Later stages break big questions into more, smaller prompts that can be fully answered in a few sentences, for a sense of back-and-forth. No hard length limits.
- **No hypotheticals** ("what would you do if…"). Any such question needs in-narrative backing, i.e. it becomes a real development.
- **Responsive developments stay narrative for now.** New scenes may add colour and consequences (flags, standing changes) but don't change the plot; branching comes after Sector Alpha.

## Fleet allocation
- Players request ships by **category** (capital, cruiser, frigate, scout, science, transport) with counts, optional preferred class and purposes; they don't pick exact ships.
- The **engine** fills every slot. A preferred class is granted with odds from its **availability**, the plan's **grade**, the sector's **status** and **combat-role** factors, and a **repeat penalty** for multiples of scarce classes (Ubiquitous none, Common small, Uncommon moderate, Rare steep). Otherwise a substitute from the same category is sent, weighted the same way.
- A sector **posture rule** penalizes warship-heavy fleets where locals would be alarmed.
- Order of play: GM grades the plan → engine allocates → posture check → GM writes Starfleet Command's reply announcing the ships → player assigns duties.
- A Galaxy should be hard to get in a normal scenario; scarce logistics ships (e.g. Istanbul) likewise.

## Play aids
- **Ship board.** Ships are listed strongest first (by total rating), so new arrivals fall into place; destroyed ships stay on the board, greyed out and tagged, with a "damaged" tag ready for later. The board collapses, and the sidebar scrolls separately from the scenario. Every ship has a captain, a current location and a current task. Captains are assigned with the ships (cosmetic for now; traits could come later). After each order the GM proposes position and task updates, which the engine validates, and the GM always sees where each ship is.
- **Cast list and Who's who.** Authored characters, places and nations appear in Who's who once their scene opens; people the GM introduces are recorded too. The GM is sent the list so names and roles stay consistent.
- **End-of-sector review.** When the scenario ends, the GM writes a review of the whole posting from the player's superior: strengths, decisions Starfleet would question, and how the sector stands.
- **Export.** The campaign can be exported as a readable record (an HTML file, or copied as text).
- **Testing tools.** Hidden unless switched on with Alt+Shift+D: revise the latest answer, clear the review. Not a gameplay feature.
- **Factions can drop out.** A faction leaves the standings once it stops being relevant (Sector Alpha's border power, once the Saalit are known to be extinct).

## Ship catalogue
- **Scope:** "Classic" Trek only — ENT, TOS, TNG, DS9, VOY, and the TOS and TNG films.
- **Sources:** Canon, beta canon, DITL referenced items, DITL speculation where reasonable, Andrew's headcanon, and marked Claude estimates.
- Data entry in the "YatA Ship Class Data Entry" spreadsheet (including Category); schema in ship-schema.md. 13 TNG-era demo classes complete.

## Status
- Sector Alpha encoded in full (`src/scenarios/sectorAlpha.ts`).
- Question One playable, with the fleet request and allocation system.
- Question Three rewritten as ten in-universe scenes with a named cast (Ambassador Rhiannon Okafor, Minister Hadrin Toma, Fleet Commander Drevak Sul, Commander Ysolde Hart and others; the seven Lysaran nations: Caldre and Imrath ask for Federation help, Voss, Thale and Orvane invite Kestu, and Merrow and Dunhal stay unaligned). The original's hypothetical is replaced by three real developments: stranded merchants (a mixed convoy, mostly unaligned Merrovian and Dunhali ships with three Caldrean and Imrathi ships, so escorting it raises the question of taking sides), a Kestu deconfliction proposal, and intelligence that Kestu ships left home two days before the assassination (never confirmed either way). The report to Brennan also asks for the admiral's view for the Council on Tekanan joining and a long-term Federation presence; Question Four's petition scene refers back to it without changing the outcome.
- Question Four rewritten as twelve in-universe scenes (adding First Speaker Imra Talov, Lt. Commander Ama Osei and Rear Admiral Teresa Vance) with the original plot: war started by the unaligned Merrow and Dunhal against the Kestu-backed nations, reinforcements by request, the fleets' mutual destruction and a named lost patrol ship, the Kestu accusation, refugees, a targeted strike that kills the Kestu junta with a device resembling a salvaged photon-torpedo warhead (culprit never revealed; no weapons of mass destruction), the new Kestu government, the buoy reveal, an exploration programme, the Council accepting Tekanan's membership petition (a first step, not membership) and the starbase sale, the handover briefing and the choice of ship for Sector Beta. A closing screen shows final standings.
- Sector Alpha is playable end to end, with the ship board, cast list, end-of-sector review and export. Lysara's standing falls by two when the war ends, since no Lysaran faction is happy with the Federation.
- Questions Two through Four playable through a shared stage engine: the player answers each prompt and crisis, the AI GM picks one authored outcome and writes the in-character reply in a single call, and the outcome's effects (standing changes, flags) apply and are shown. Hidden truths are never sent to the GM until revealed; it only sees what characters currently believe.

## Decided against for now
- Follow-up replies within a scene, and a "what came of it" debrief for loose threads: both are limits of non-branching scenarios and should resolve naturally with branching.

## Next steps
1. A "load test game" option for replaying from saved fixtures.
2. Import the ship catalogue from the spreadsheet automatically instead of by hand.
3. Encode Sector Beta to exercise branching.
