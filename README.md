# Interactive YatA

A solo, browser-based game inspired by "You're the Admiral!", the Star Trek scenario game from the Flare SciFi Forums ([Star Trek Minutiae archive](https://www.st-minutiae.com/articles/admiral/)). You command a Starfleet sector; an AI game master delivers events and answers in character.

Personal fan project. Not affiliated with Paramount or CBS.

## Status
- **Sector Alpha, Question One** is playable: priorities, starbase placement on a sector map, a fleet request that Starfleet fills based on availability, Starfleet Command's in-character reply, and duty assignments.
- Moving to Question Two applies the scripted reassignment of your two strongest ships. Question Two's crises are next.

## How it works
- **Scenarios are authored, not improvised.** The AI GM picks one of each event's written outcomes and writes the in-character reply; it may add flavor but never plot. See `docs/scenario-format.md`.
- **Fleet allocation is done by the engine.** Odds depend on class availability, the sector's status and combat-role factors, a repeat penalty for multiples of scarce classes, and the grade Starfleet gives your plan.
- **Ships** come from the TNG-era demo catalogue (`src/data/ships.ts`), exported from the ship class data entry spreadsheet. Schema notes are in the project docs.

## Layout
- `src/engine/` — scenario and ship types, game state, allocation, effects, the AI GM prompts, saves.
- `src/scenarios/sectorAlpha.ts` — Sector Alpha in the scenario format (also exported to `docs/sector-alpha.json`).
- `src/data/ships.ts` — ship classes.
- `src/components/` — sector map, fleet request, assigned fleet, and the older fleet builder (kept for Question Four's reinforcements).
- `docs/` — scenario format and exported scenario data.

## Running it
```
npm install
npm run dev      # local development
npm run build    # single-file build in dist/index.html
```
The AI game master only works when the page runs inside Claude (it uses Claude's in-page "ask Claude" capability). Elsewhere you get a standard acknowledgement instead of an AI reply. Saves go to the artifact's database inside Claude, with a localStorage copy.
