# Interactive YatA — Design Brief (v0.4, 2026-11-26)

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

## Fleet allocation
- Players request ships by **category** (capital, cruiser, frigate, scout, science, transport) with counts, optional preferred class and purposes; they don't pick exact ships.
- The **engine** fills every slot. A preferred class is granted with odds from its **availability**, the plan's **grade**, the sector's **status** and **combat-role** factors, and a **repeat penalty** for multiples of scarce classes (Ubiquitous none, Common small, Uncommon moderate, Rare steep). Otherwise a substitute from the same category is sent, weighted the same way.
- A sector **posture rule** penalizes warship-heavy fleets where locals would be alarmed.
- Order of play: GM grades the plan → engine allocates → posture check → GM writes Starfleet Command's reply announcing the ships → player assigns duties.
- A Galaxy should be hard to get in a normal scenario; scarce logistics ships (e.g. Istanbul) likewise.

## Ship catalogue
- **Scope:** "Classic" Trek only — ENT, TOS, TNG, DS9, VOY, and the TOS and TNG films.
- **Sources:** Canon, beta canon, DITL referenced items, DITL speculation where reasonable, Andrew's headcanon, and marked Claude estimates.
- Data entry in the "YatA Ship Class Data Entry" spreadsheet (including Category); schema in ship-schema.md. 13 TNG-era demo classes complete.

## Status
- Sector Alpha encoded in full (`src/scenarios/sectorAlpha.ts`).
- Question One playable, with the fleet request and allocation system; moving to Question Two applies the scripted reassignment.

## Next steps
1. Make Question Two's three crises playable (event → GM picks outcome → standing changes).
2. Questions Three and Four.
3. Import the ship catalogue from the spreadsheet automatically instead of by hand.
4. Encode Sector Beta to exercise branching.
