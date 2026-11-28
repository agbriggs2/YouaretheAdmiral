# Ship Class Schema — v0.7

See the project copy for full history. Summary of the current schema:

## Changes from v0.6
- **Combat roles recast.** `combatRole` is now `warship | combat-capable | non-combat`:
  - **warship:** built to fight; combat is its purpose (Akira, Defiant, Sovereign, Prometheus).
  - **combat-capable:** multi-role, armed to fight, but combat is not its purpose (Galaxy, Nebula, Excelsior, Intrepid…).
  - **non-combat:** defensive armament only. It never counts as a combat vessel.
- **Derived terms** (in `shipTypes.ts`):
  - **Combat vessel** = warship or combat-capable.
  - **Heavy modern ship** = status Frontline, warship, and category cruiser or capital. Currently: Akira, Sovereign, Prometheus.
- **New tags:**
  - `heavy-combat` (Sovereign, Prometheus), for scenario bans such as Sector Omicron's;
  - `escort`, `medical`, `supply`, `multi-vector`.
- **New source tier `fanon`:** a published fan design, currently the Advanced Starship Design Bureau (ASDB). Each fanon entry lists its ASDB page in `sources`. Where ASDB gives no figure (crew, warp, weapons and so on), the value is our own, in keeping with the class's stated role and era.
- **The catalogue has 33 classes:** the 13 from the spreadsheet, plus 20 added for Sector Omicron.
  - **Canon:** Centaur, Challenger, Constellation, Defiant, Intrepid, Norway, Nova, Olympic, Prometheus, Sovereign, Springfield.
  - **ASDB:** Andromeda, Deneva, Hokule'a, Korolev, Mediterranean, Merced, Renaissance, Sequoia, Yorkshire.
- **Warp limits.** `maxWarp` is the top speed a ship can hold for a journey, not its rated burst maximum: Intrepid 9.8 (rated 9.975); Sovereign 9.8.
- **Scenario year.** Classes whose `serviceEntry` falls after a scenario's year are never offered (for example, Prometheus, 2374, is excluded from Sector Alpha, 2372).

## Design choices
1. **Balance eras:** TOS (includes ENT), TMP, TNG (includes DS9 and VOY). First pass covers TNG only.
2. **Ratings are 1–10 within a balance era.** A class in several eras gets one profile per era.
3. **Variants and refits are separate entries** linked by `parentClassId`.
4. **Scenario rules use tags, categories and combat roles,** not hard-coded classes.
5. **Classes and named ships are separate.**
6. **All factions use the same schema** and the same within-era scale.
7. **Provenance is per entry:** one source tier (canon / beta / fanon / headcanon) and a source list.

## Ship class schema (TypeScript)

```ts
type SourceTier = "canon" | "beta" | "fanon" | "headcanon";
type BalanceEra = "TOS" | "TMP" | "TNG";
type Production = "ENT" | "TOS" | "TOS-films" | "TNG" | "DS9" | "VOY" | "TNG-films";
type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface ShipClass {
  id: string;
  name: string;
  parentClassId?: string;
  faction: string;
  registryPrefix?: string;
  type: string;
  category: "capital" | "cruiser" | "light-cruiser" | "frigate" | "scout" | "science" | "transport";
  combatRole: "warship" | "combat-capable" | "non-combat";
  tags: string[];
  appearsIn: Production[];
  cruiseWarp?: number;               // normal cruising speed; defaults to warp 6 (lower for slow classes)
  registryRange?: [number, number];  // NCC numbers this class is drawn from; roughly chronological
  serviceEntry: number;
  serviceRetired?: number;
  specs: {
    lengthM?: number; decks?: number; crew?: number; passengers?: number; evacuationCapacity?: number;
    warp: { scale: "TOS" | "TNG"; cruise?: number; maxSustained?: number; max?: number; maxDurationHours?: number };
    enduranceMonths?: number;
  };
  weapons: string;
  torpedoStores?: number;
  defenses: { shields?: string; armor?: string; cloak?: boolean };
  capabilities: {
    auxiliaryCraft?: string; transporters?: string; cargoCapacity?: string; labs?: number;
    medical?: "none" | "sickbay" | "full hospital"; diplomaticFacilities?: boolean; troopCapacity?: number;
    tractorTow?: "none" | "light" | "heavy"; planetaryLanding?: boolean; saucerSeparation?: boolean;
    repairFacilities?: "none" | "field" | "drydock-lite";
  };
  eraProfiles: EraProfile[];
  narrative: { summary: string; strengths: string[]; weaknesses: string[]; reputation?: string };
  sourceTier: SourceTier;
  sources: string[];
  notes?: string;
}

interface EraProfile {
  era: BalanceEra;
  availability: "unique" | "rare" | "uncommon" | "common" | "ubiquitous";
  status?: "frontline" | "second-line" | "obsolescent" | "reserve";
  ratings: {
    firepower: Rating; defense: Rating; speed: Rating; agility: Rating; sensors: Rating;
    science: Rating; endurance: Rating; logistics: Rating; presence: Rating;
  };
  notes?: string;
}

interface NamedShip {
  id: string; name: string; registry?: string; classId: string;
  kind: "hero" | "notable" | "player";
  activeYears?: { from: number; to?: number };
  fate?: string;
  captains?: { name: string; from?: number; to?: number }[];
  ratingModifiers?: Partial<Record<keyof EraProfile["ratings"], number>>;
  traits?: string[];
  narrative?: { summary?: string; gmNotes?: string };
  career?: { commissionedIn?: string; serviceLog: { scenarioId: string; summary: string }[]; damageHistory?: string[] };
  sourceTier: SourceTier;
  sources?: string[];
}
```

## Current classes by category

| Category | Warship | Combat-capable | Non-combat |
|---|---|---|---|
| capital | Sovereign | Galaxy, Ambassador | |
| cruiser | Akira, Prometheus | Nebula, Excelsior, Challenger, Springfield, Hokule'a, Korolev | |
| light-cruiser | | Steamrunner, Intrepid, Norway, Sequoia, Constellation, Centaur, Renaissance | |
| frigate | Defiant | Miranda, New Orleans, Saber, Merced | |
| scout | | Cheyenne, Andromeda | |
| science | | | Oberth, Nova |
| transport | | | Istanbul, Sydney, Olympic, Deneva, Mediterranean, Yorkshire |

## Spreadsheet mapping
- One row = one class in one balance era; rows with the same Class name merge into one `ShipClass` with several `eraProfiles`.
- Rating, Availability, Status and Era notes columns form the era profile; all other columns are shared.
- Strengths, weaknesses and sources are semicolon-separated; tags are comma-separated.
- The app's simplified runtime type is in `src/engine/shipTypes.ts`. The 13 spreadsheet classes are in `src/data/ships.ts`; the 20 added for Sector Omicron are in `src/data/shipsAdded.ts`. They are not yet in the spreadsheet.
