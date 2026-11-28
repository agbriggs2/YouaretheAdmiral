# Ship Class Schema — v0.6

See the project copy for full history. Summary of the current schema:

## Changes from v0.3
- **`category` field** for fleet requests: capital, cruiser, frigate, scout, science or transport. Now a column in the spreadsheet.
- **Availability drives allocation** (with sector status/combat-role factors, the plan's grade and a repeat penalty — see scenario-format.md).
- **Torpedo launchers** are written as single-fire or burst-fire in the weapons text; planned as a structured field.

## Design choices
1. **Balance eras:** TOS (includes ENT), TMP, TNG (includes DS9 and VOY). First pass covers TNG only.
2. **Ratings are 1–10 within a balance era.** A class in several eras gets one profile per era.
3. **Variants and refits are separate entries** linked by `parentClassId`.
4. **Scenario rules use tags and categories,** not hard-coded classes.
5. **Classes and named ships are separate.**
6. **All factions use the same schema** and the same within-era scale.
7. **Provenance is per entry:** one source tier (canon / beta / headcanon) and a source list.

## Ship class schema (TypeScript)

```ts
type SourceTier = "canon" | "beta" | "headcanon";
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
  category: "capital" | "cruiser" | "frigate" | "scout" | "science" | "transport";
  combatRole: "primary" | "secondary" | "none";
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

## Spreadsheet mapping
- One row = one class in one balance era; rows with the same Class name merge into one `ShipClass` with several `eraProfiles`.
- Rating, Availability, Status and Era notes columns form the era profile; all other columns are shared.
- Strengths, weaknesses and sources are semicolon-separated; tags are comma-separated.
- The app's simplified runtime type is in `src/engine/shipTypes.ts`; the demo data is in `src/data/ships.ts`.
