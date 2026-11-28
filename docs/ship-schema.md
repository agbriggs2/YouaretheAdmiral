# Ship Class Schema — v0.7

## Changes from v0.6
- **Combat roles recast.** `combatRole` is now `warship | combat-capable | non-combat`:
  - **warship:** built to fight; combat is its purpose (Akira, Defiant, Sovereign, Prometheus).
  - **combat-capable:** multi-role, armed to fight, but combat is not its purpose (Galaxy, Nebula, Excelsior, Intrepid…).
  - **non-combat:** defensive armament only. It never counts as a combat vessel.
- **Derived terms** (in `shipTypes.ts`):
  - **Combat vessel** = warship or combat-capable.
  - **Heavy modern ship** = status Frontline, combat vessel (combat-capable or warship), and category cruiser or capital. Currently: Galaxy, Nebula, Akira, Sovereign, Prometheus.
- **New tags:**
  - `heavy-combat` (Sovereign, Prometheus), for scenario bans such as Sector Omicron's;
  - `escort`, `medical`, `supply`, `multi-vector`.
- **New source tier `fanon`:** a published fan design, currently the Advanced Starship Design Bureau (ASDB, marked "speculative, backstage"). Each fanon entry lists its ASDB page in `sources`. Where ASDB gives no figure (crew, warp, weapons and so on), the value is our own, in keeping with the class's stated role and era.
- **The catalogue has 33 classes:** the 13 from the spreadsheet, plus 20 added for Sector Omicron.
  - **Canon:** Centaur, Challenger, Constellation, Defiant, Intrepid, Norway, Nova, Olympic, Prometheus, Sovereign, Springfield.
  - **ASDB:** Andromeda, Deneva, Hokule'a, Korolev, Mediterranean, Merced, Renaissance, Sequoia, Yorkshire.
- **`maxWarp` is the top speed a ship can hold for a journey,** not its rated burst maximum: Intrepid 9.8 (rated 9.975); Sovereign 9.8.
- **Scenario year.** Classes whose `serviceEntry` falls after a scenario's year are never offered (for example, Prometheus, 2374, is excluded from Sector Alpha, 2372).

## Changes from v0.5
- **Speeds now drive travel.** The game times every journey from the class's cruising speed and its maximum, converted to multiples of light speed on the TNG scale:
  - cruising speed: `specs.warp.cruise` (app field `cruiseWarp`); warp 6 if not set, lower for slow classes;
  - maximum: `specs.warp.max` (app field `maxWarp`).

  Filling in cruise speeds in the spreadsheet will make journey times more accurate.

## Changes from v0.4
- **New `registryRange` field:** the range of registry numbers (e.g. NCC-62000 to NCC-63999) a class's ships are drawn from. Ranges are roughly chronological, so older classes sit lower and newer ones higher, using canon examples where they exist. Each ship gets a unique registry from its class's range when it's assigned.
- **Light cruiser category** added between cruiser and frigate.

## Changes from v0.3
- **New `category` field** for fleet requests: capital, cruiser, light cruiser, frigate, scout, science or transport. Players request ships by category; the engine fills each slot from that category based on availability.
- **Availability now drives allocation.** The availability value sets the chance a requested class is granted, and how often a class is sent as a substitute:

  | Availability | Chance granted |
  |---|---|
  | Unique | 10% |
  | Rare | 30% |
  | Uncommon | 50% |
  | Common | 80% |
  | Ubiquitous | 95% |
- **Torpedo launchers** are written as single-fire or burst-fire in the weapons text; still planned as a structured field.

## Changes from v0.2
- **ENT is folded into the TOS balance era** for now.
- **Provenance is per entry only:** one source tier and a source list per class.
- **Specs limited to what supports the nine ratings.**
- **Nine rating dimensions confirmed.**
- **Data entry:** classes are entered in the "YatA Ship Class Data Entry" spreadsheet (one row per class per balance era) and imported into this schema.

## What the app needs from a ship class

Two different consumers read this data:

- **The rules engine** needs compact, comparable numbers. Can this ship catch that one, or survive a fight? Can it carry 5,000 refugees, or tow a starbase? Does it count as a combat vessel or non-combat under the scenario's fleet limits? How likely is Starfleet to spare one, and how long does it take to get somewhere?
- **The AI GM** needs texture: what the class is known for, its quirks, how its arrival reads diplomatically.

## Design choices

1. **Balance eras:** TOS (includes ENT), TMP, TNG (includes DS9 and VOY). First pass covers TNG only.
2. **Ratings are 1–10 within a balance era.** A class in several eras gets one profile per era.
3. **Variants and refits are separate entries** linked by `parentClassId`, generally within one era.
4. **Scenario rules use tags, categories and combat roles,** not hard-coded classes. For example:
   - Sector Alpha's "no more than one Galaxy, Sovereign or Ambassador" is a rule against the `capital` tag/category.
   - Sector Omicron's limits are "at most two warships" and "no `heavy-combat`".
5. **Classes and named ships are separate.**
6. **All factions use the same schema** and the same within-era scale.

## Ship class schema (TypeScript)

```ts
type SourceTier = "canon" | "beta" | "fanon" | "headcanon";
type BalanceEra = "TOS" | "TMP" | "TNG";   // TOS includes ENT; TNG includes DS9 and VOY
type Production = "ENT" | "TOS" | "TOS-films" | "TNG" | "DS9" | "VOY" | "TNG-films";
type Rating = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

interface ShipClass {
  // ── Identity ──────────────────────────────────────────
  id: string;                 // "galaxy", "excelsior-refit"
  name: string;               // "Galaxy"
  parentClassId?: string;
  faction: string;            // "federation", "klingon", "romulan", "cardassian"...
  registryPrefix?: string;    // "NCC", "IKS"...
  registryRange?: [number, number];  // e.g. [62000, 63999]; roughly chronological, canon examples where they exist
  type: string;               // "Explorer", "Attack cruiser", "Warbird"...
  category: "capital" | "cruiser" | "light-cruiser" | "frigate" | "scout" | "science" | "transport";
  combatRole: "warship" | "combat-capable" | "non-combat";
  tags: string[];             // "capital", "heavy-combat", "escort", "scout", "transport", "medical",
                              // "supply", "planetfall", "multi-vector", "saucer-separation"...

  // ── Service history ───────────────────────────────────
  appearsIn: Production[];
  serviceEntry: number;
  serviceRetired?: number;

  // ── Hard specs ────────────────────────────────────────
  specs: {
    lengthM?: number;
    decks?: number;
    crew?: number;
    passengers?: number;
    evacuationCapacity?: number;
    warp: { scale: "TOS" | "TNG"; cruise?: number; maxSustained?: number; max?: number; maxDurationHours?: number };  // cruise and max time every journey
    enduranceMonths?: number;
  };

  weapons: string;             // e.g. "12× Type X phaser array (all-round); 2× burst-fire photon torpedo launcher (fore, aft)"
  torpedoStores?: number;
  defenses: { shields?: string; armor?: string; cloak?: boolean };

  capabilities: {
    auxiliaryCraft?: string;
    transporters?: string;
    cargoCapacity?: string;
    labs?: number;
    medical?: "none" | "sickbay" | "full hospital";
    diplomaticFacilities?: boolean;
    troopCapacity?: number;
    tractorTow?: "none" | "light" | "heavy";   // heavy = could move a starbase
    planetaryLanding?: boolean;
    saucerSeparation?: boolean;
    repairFacilities?: "none" | "field" | "drydock-lite";
  };

  eraProfiles: EraProfile[];

  narrative: { summary: string; strengths: string[]; weaknesses: string[]; reputation?: string };

  sourceTier: SourceTier;
  sources: string[];          // e.g. an ASDB page for fanon entries
  notes?: string;
}

interface EraProfile {
  era: BalanceEra;
  availability: "unique" | "rare" | "uncommon" | "common" | "ubiquitous";  // drives fleet allocation
  status?: "frontline" | "second-line" | "obsolescent" | "reserve";
  ratings: {
    firepower: Rating; defense: Rating; speed: Rating; agility: Rating; sensors: Rating;
    science: Rating; endurance: Rating;
    logistics: Rating;   // cargo, passengers, evacuation, support
    presence: Rating;    // diplomatic weight / intimidation on arrival
  };
  notes?: string;
}
```

## Classes by category and combat role

| Category | Warship | Combat-capable | Non-combat |
|---|---|---|---|
| capital | Sovereign | Galaxy, Ambassador | |
| cruiser | Akira, Prometheus | Nebula, Excelsior, Challenger, Springfield, Hokule'a, Korolev | |
| light-cruiser | | Steamrunner, Intrepid, Norway, Sequoia, Constellation, Centaur, Renaissance | |
| frigate | Defiant | Miranda, New Orleans, Saber, Merced | |
| scout | | Cheyenne, Andromeda | |
| science | | | Oberth, Nova |
| transport | | | Istanbul, Sydney, Olympic, Deneva, Mediterranean, Yorkshire |

## Registry ranges

| Class | Range | Basis |
|---|---|---|
| Oberth | NCC-600 – 31999 | canon examples (Grissom 638 and others) |
| Miranda | NCC-1800 – 31999 | canon examples (Reliant 1864, Brattain 21166, Saratoga 31911) |
| Sydney | NCC-1950 – 2999 | canon example (Jenolan 2010) |
| Excelsior | NCC-2000 – 42999 | canon examples (Excelsior 2000, Fearless 14598, Hood 42296) |
| Constellation | NCC-2500 – 9999 | canon examples (Magellan 3069, Gettysburg 3890, Victory 9754) |
| Deneva | NCC-6200 – 7499 | ASDB prototype NX-6200 |
| Ambassador | NCC-10500 – 26999 | canon examples (Excalibur 26517, Adelphi 26849) |
| Hokule'a | NCC-15000 – 19999 | Claude estimate |
| Istanbul | NCC-33000 – 41999 | Claude estimate |
| Merced | NCC-36000 – 37999 | Claude estimate (canon Trieste 37124) |
| Yorkshire | NCC-38000 – 40999 | Claude estimate |
| Renaissance | NCC-40000 – 45999 | canon example (Aries 45167) |
| Centaur | NCC-42000 – 42999 | canon example (Centaur 42043) |
| Mediterranean | NCC-43000 – 44999 | canon example (Lalo 43837) |
| Steamrunner | NCC-51000 – 56999 | canon example (Appalachia 52136) |
| Springfield | NCC-57200 – 57399 | canon example (Chekov 57302) |
| Challenger | NCC-57400 – 57699 | canon examples (Armstrong 57537, Kearsarge 57566, Buran 57580) |
| Korolev | NCC-58000 – 58899 | Claude estimate (canon Goddard 59621 is kept as its own registry) |
| Olympic | NCC-58900 – 59299 | canon example (Pasteur 58925) |
| Prometheus | NCC-59600 – 59999 | canon example (Prometheus 59650) |
| Nebula | NCC-60000 – 72999 | canon examples (Bellerophon 62048, Phoenix 65420, Sutherland 72015) |
| Saber | NCC-61000 – 62999 | canon example (Yeager 61947) |
| Akira | NCC-62000 – 63999 | canon examples (Geronimo 62497, Thunderchild 63549) |
| New Orleans | NCC-63000 – 65999 | canon examples (Renegade 63102, Kyushu 65491) |
| Norway | NCC-64900 – 65399 | canon example (Budapest 64923) |
| Andromeda | NCC-66000 – 66999 | Claude estimate |
| Sequoia | NCC-68000 – 68999 | Claude estimate |
| Cheyenne | NCC-69000 – 71999 | canon example (Ahwahnee 71620) |
| Galaxy | NCC-70600 – 71999 | canon examples (Galaxy 70637, Yamato 71807) |
| Nova | NCC-72300 – 72799 | canon examples (Equinox 72381, Rhode Island 72701) |
| Sovereign | NCC-73800 – 75999 | canon example (Sovereign 73811) |
| Defiant | NCC-74200 – 75699 | canon examples (Defiant 74205, Valiant 74210, São Paulo 75633) |
| Intrepid | NCC-74500 – 74999 | canon examples (Intrepid 74600, Voyager 74656, Bellerophon 74705) |

Canon doesn't always follow the chronological rule (the Steamrunner and Saber entered service after the Galaxy but carry lower numbers). Where canon examples exist, they take priority.

## Named ship schema (TypeScript)

```ts
interface NamedShip {
  id: string;                 // "enterprise-d"
  name: string;               // "USS Enterprise"
  registry?: string;          // "NCC-1701-D"
  classId: string;            // → ShipClass.id
  kind: "hero" | "notable" | "player";
  activeYears?: { from: number; to?: number };
  fate?: string;
  captains?: { name: string; from?: number; to?: number }[];
  ratingModifiers?: Partial<Record<keyof EraProfile["ratings"], number>>; // e.g. { science: +1 }
  traits?: string[];
  narrative?: { summary?: string; gmNotes?: string };
  career?: { commissionedIn?: string; serviceLog: { scenarioId: string; summary: string }[]; damageHistory?: string[] };
  sourceTier: SourceTier;
  sources?: string[];
}
```

Scenario-specific facts (current location, journey, condition, assignment, captain, registry for player ships) live in game state, not here.

## Spreadsheet mapping
- One row = one class in one balance era; rows with the same Class name merge into one `ShipClass` with several `eraProfiles`.
- Rating, Availability, Status and Era notes columns form the era profile; all other columns are shared by the class.
- Strengths, weaknesses and sources are semicolon-separated; tags are comma-separated.
- **Category** is a sheet column (Capital, Cruiser, Light Cruiser, Frigate, Scout, Science, Transport).
- **Combat role** values in the sheet should become Warship, Combat-capable or Non-combat.
- **Not yet sheet columns:** registry range and cruise speed. The app holds the ranges above, and cruise defaults to warp 6.
- **Where the data lives:** the 13 spreadsheet classes are in `src/data/ships.ts`; the 20 added for Sector Omicron are in `src/data/shipsAdded.ts` and are not yet in the spreadsheet.
