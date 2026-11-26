# Scenario Format — v0.4

## Principles
- **Scenarios are authored, not improvised.** During play the AI GM reads the player's orders, picks one of the authored **outcomes** for each event, applies that outcome's **effects**, and writes in-character replies.
- **The GM may add flavor, never plot.** Names of minor characters, dialogue, the tone of a report: fine. A new threat, a betrayal, a lost ship that isn't in the scenario: not allowed.
- **Complexity is a property of the scenario.** The same format covers low-complexity scripts (Sector Alpha) and branching ones (Sector Beta). A future scenario engine will generate new scenarios in this format before play.
- **Branches rejoin at checkpoints**, so storylines don't multiply out of control.

## Structure
- **Scenario**: id, title, complexity, era and in-universe year (the year limits which ship classes exist), the player's role, the setting, factions, locations, player resources and GM guidance.
- **Stage**: one of the original "Questions". Has a briefing, prompts and events.
- **Prompt**: something the player answers. Kinds: free text, fleet request, fleet builder (adding specific ships), starbase placement, multiple choice.
- **Event**: a crisis or development. Optional **conditions** decide whether it happens. Has prompts for the player's orders, a list of outcomes, a default outcome and private GM notes.
- **Outcome**: a label, criteria telling the GM which responses fall here, effects, and direction on how characters react.
- **Effect**: set a flag, adjust a faction's standing (−3 to +3), remove ships (by a defined selector), reveal a secret, or add a log line.
- **Secret**: hidden truth the GM knows but must not reveal until a reveal effect fires (e.g. Sector Alpha's "probe" is really a distress buoy).
- **Checkpoint**: a fixed state that every branch is normalised to before a given stage.

## How complexity shows up
| | Low (Sector Alpha) | Higher (Sector Beta) |
|---|---|---|
| Event conditions | None: every event always happens | Events depend on flags, standings and fleet |
| Outcomes | Mostly change standings and how characters react | Change which events follow |
| Hidden information | One or two secrets on a fixed reveal schedule | Secrets revealed by player actions |
| Time and space | Abstract | Day-by-day operations on a map grid |
| Checkpoints | Not needed | Required to rejoin branches |

## Fleet requests
The player doesn't pick exact ships. They describe what the fleet must do and request ships by **category** (capital, cruiser, frigate, scout, science, transport), with a count, an optional preferred class and a purpose for each line. Request rules (ship limit, capital limit, non-combat minimum, a purpose for every line) are checked before the request can be sent.

### Order of play
1. **Grade.** The AI GM grades the whole plan (priorities, starbase, fleet request) by picking one of the stage's authored review outcomes.
2. **Allocate.** The engine, not the AI, fills every slot, using the grade.
3. **Posture.** If the assigned fleet breaks the sector's posture rule, its effects apply.
4. **Reply.** The AI GM writes Starfleet Command's reply: the assessment, the ships exactly as assigned, and a reason for each substitution.
5. **Duties.** The player names the ships and gives each a duty and primary mission.

### How a slot is filled
- A **preferred class** is granted with a chance built from three things:
  - **Availability:** Ubiquitous 95%, Common 80%, Uncommon 50%, Rare 30%, Unique 10% (a scenario can override).
  - **The grade:** the scenario maps each review outcome to a shift in availability tiers. In Sector Alpha, a commended plan treats classes one tier more available (Uncommon odds become Common odds); a plan approved with concerns, one tier less.
  - **Sector factors:** multipliers by the class's **status** (Frontline, Second-line, Obsolescent, Reserve) and **combat role** (primary, secondary, none).
  The result is capped between 5% and 95%.
  - **Repeats:** each ship of the same class already assigned multiplies the chance again: Ubiquitous ×1, Common ×0.85, Uncommon ×0.5, Rare ×0.15, Unique ×0.02 per copy (a scenario can override, e.g. a high-stakes scenario where two Galaxies are plausible).
- Otherwise Starfleet sends another class from the same category, chosen at random, weighted by availability (Ubiquitous 5, Common 4, Uncommon 2, Rare 1, Unique 0.25) times the same sector and repeat factors, so substitutes tend to vary.
- Every requested slot is filled.

### Posture rule
A scenario can set a limit on front-line warships (ships with combat role "primary"). If the assigned fleet exceeds it, the rule's effects apply (e.g. standing changes) and the GM is told how characters react. The player is given a plain-language hint up front, not the number.

### Sector Alpha settings
| Setting | Value |
|---|---|
| Status factors | Frontline ×0.6, Second-line ×1, Obsolescent ×1.25, Reserve ×1 |
| Combat-role factors | Primary ×0.8, Secondary ×1, Non-combat ×1.1 |
| Grade shift | Commended +1 tier, Approved 0, Approved with concerns −1 tier |
| Posture | More than 4 primary-combat ships: Tekanan −1, Kestu −1 |

Repeat example (approved plan): Istanbul 33% → 16.5% → 8%; Galaxy 14% → 2% → 0.3%; Miranda 95% → 81% → 69%; Oberth stays at 95%.

Resulting odds of getting a first preferred class (approved / commended / concerns): Galaxy, Nebula and Akira 14% / 24% / 5%; Ambassador 24% / 40% / 8%; Excelsior 80% / 95% / 50%; New Orleans 40% / 64% / 24%; Saber 38% / 46% / 24%; Miranda 95% / 95% / 63%.

The grading criteria also count balance: a warship-heavy request is graded down in Sector Alpha.

## Scenes and continuity (v0.4)
- A free-text prompt can be marked `short`: the player sees a smaller box with a "A few sentences" hint, and the GM replies in under 140 words as a live exchange, without jumping ahead.
- For each answer the GM also sees the earlier scenes of the same stage (the admiral's answers and the replies), so a run of scenes reads as one continuous story.
- Secrets are only shown to the GM from the stage that introduces them, and only as their cover story until revealed. A secret with no cover story is never sent; its scene's text and GM notes carry what the GM needs.

## Schema (TypeScript)
```ts
/**
 * Scenario format, v0.1
 *
 * A scenario is authored content. During play the AI GM never invents plot:
 * it reads the player's orders, picks one of the authored outcomes for each
 * event, applies that outcome's effects, and writes in-character replies.
 * It may add flavor (names, dialogue, colour) but not plot facts.
 */

import type { BalanceEra } from "./shipTypes";

export type Complexity = "low" | "medium" | "high";

export interface Scenario {
  id: string;                    // "sector-alpha"
  title: string;                 // "Sector Alpha"
  version: string;
  complexity: Complexity;
  source?: { name: string; url?: string; author?: string };
  era: BalanceEra;
  year: number;                  // in-universe year; limits which ship classes exist
  playerRole: { rank: string; title: string; briefing: string };
  setting: Setting;
  factions: Faction[];
  locations: Location[];
  resources: Resources;
  initialState?: StateSeed;
  stages: Stage[];
  checkpoints?: Checkpoint[];
  gm: GmGuidance;
}

// ── Setting ────────────────────────────────────────────

export interface Setting {
  overview: string;
  assumptions: string[];         // facts the player is told up front
  map?: { imageUrl?: string; caption?: string };
}

export interface Faction {
  id: string;                    // "tekanan"
  name: string;                  // "Tekanan III"
  status: "member" | "aligned" | "applicant" | "neutral" | "unknown" | "hostile";
  population?: string;
  government?: string;
  technology?: string;
  military?: ForceEntry[];
  resources?: string;
  traits?: string[];             // what the GM should know about how they behave
  startingStanding: number;      // -3 (hostile) … +3 (close ally)
}

export interface ForceEntry {
  count?: number;
  description: string;           // "Nebula-class equivalent warships"
  equivalentTo?: string;         // ShipClass.id, for the rules engine
}

export interface Location {
  id: string;
  name: string;
  kind: "planet" | "star" | "nebula" | "open-space" | "border" | "station" | "other";
  factionId?: string;
  description?: string;
  starbaseOptions?: ("planet-orbit" | "star-orbit" | "open-space")[];
}

// ── Player resources ───────────────────────────────────

export interface Resources {
  fleet?: FleetRules;
  starbase?: { description: string; model?: string };
}

export interface FleetRules {
  maxShips: number;
  tagLimits?: { tag: string; max: number; label: string }[];
  roleMinimums?: { combatRole: "primary" | "secondary" | "none"; min: number; label: string }[];
  justificationRequired?: ("capital" | "non-combat" | "all")[];
  assignments: string[];         // duty categories the player assigns ships to
  categories: FleetCategory[];   // what the player can request
  /** Chance a requested class is granted, by availability. Defaults below in the engine. */
  availabilityChance?: Partial<Record<Availability, number>>;
  allocation?: AllocationFactors;
  posture?: PostureRule;
}

/**
 * How this sector shapes what Starfleet sends. Factors multiply both the chance
 * a preferred class is granted and how often a class is picked as a substitute.
 */
export interface AllocationFactors {
  statusFactor?: Record<string, number>;          // by ShipClass status: "Frontline", "Second-line"…
  roleFactor?: Partial<Record<"primary" | "secondary" | "none", number>>;
  /** Availability tiers to shift preferred-class odds by, keyed by the review outcome id. */
  gradeTierShift?: Record<string, number>;
  /** Multiplier applied for each ship of the same class already assigned. Overrides engine defaults. */
  repeatFactor?: Partial<Record<Availability, number>>;
  note?: string;                                   // shown to the player
}

/** Consequences when the assigned fleet carries too many front-line warships. */
export interface PostureRule {
  maxPrimaryCombat: number;      // more ships with combatRole "primary" than this triggers it
  flag: string;
  effects: Effect[];
  gmNote: string;                // how characters should react
  hint: string;                  // what the player is told up front
}

export type Availability = "Unique" | "Rare" | "Uncommon" | "Common" | "Ubiquitous";

export interface FleetCategory {
  id: string;                    // matches ShipClass.category
  label: string;                 // "Frigate"
  description: string;
  nonCombat?: boolean;           // counts toward the non-combat minimum
  capital?: boolean;             // counts toward the capital limit
  /**
   * For scarce categories: if the preferred class misses, other classes in this
   * category must each win their own grant roll; failing that, Starfleet sends
   * a ship from this fallback category instead.
   */
  fallbackCategory?: string;
  /** Extra weight by status when picking the fallback ship, e.g. { Frontline: 3 }. */
  fallbackStatusFactor?: Record<string, number>;
}

// ── Hidden information ─────────────────────────────────

/** A secret the GM knows but must not reveal until a "reveal" effect fires. */
export interface Secret {
  id: string;
  truth: string;
  coverStory?: string;           // what characters believe until revealed
}

// ── Stages, prompts and events ─────────────────────────

export interface Stage {
  id: string;                    // "q1"
  title: string;                 // "Question One: Taking Command"
  briefing: string;              // shown when the stage opens
  prompts?: Prompt[];            // things the player must answer in this stage
  review?: StageReview;          // GM's in-character response to the stage prompts
  events?: GameEvent[];          // crises and developments, in order
  onEnter?: Effect[];
  secrets?: Secret[];
}

/** How the GM responds to a stage's own prompts (before its events). */
export interface StageReview {
  from: string;                  // "Starfleet Command"
  outcomes: Outcome[];
  defaultOutcomeId: string;
  gmNotes?: string;
}

export type Prompt =
  | { id: string; kind: "free-text"; text: string; guidance?: string; short?: boolean }  // short: answerable in a few sentences
  | { id: string; kind: "fleet-builder"; text: string; mode: "initial" | "add"; addRules?: AddRules }
  | { id: string; kind: "fleet-request"; text: string }
  | { id: string; kind: "starbase-placement"; text: string }
  | { id: string; kind: "choice"; text: string; options: { id: string; label: string }[] };

export interface AddRules {
  ships: { count: number; combatRole?: "primary" | "secondary" | "none"; tag?: string; label: string }[];
}

export interface GameEvent {
  id: string;
  title: string;
  conditions?: Condition[];      // empty or absent = always happens
  from?: string;                 // who delivers it: "Starfleet Command", "Lysaran Court"…
  text: string;                  // what the player is told
  onEnter?: Effect[];            // effects applied before the player responds
  prompts: Prompt[];             // usually one free-text order prompt
  outcomes: Outcome[];
  defaultOutcomeId: string;      // used if the GM can't decide
  gmNotes?: string;              // private direction for the GM
}

export interface Outcome {
  id: string;
  label: string;                 // "Measured response"
  criteria: string;              // for the GM: which player responses fall here
  effects?: Effect[];
  reactions?: string;            // how characters should react (GM direction)
}

// ── Effects and conditions ─────────────────────────────

export type Effect =
  | { type: "set-flag"; flag: string; value: string | number | boolean }
  | { type: "adjust-standing"; factionId: string; delta: number }
  | { type: "remove-ships"; selector: ShipSelector; count: number; reason: string }
  | { type: "reveal"; secretId: string }
  | { type: "log"; text: string };

export type ShipSelector =
  | "strongest"                  // highest total rating (ties: longer hull)
  | "weakest-combat"
  | { assignment: string }       // e.g. ships the player assigned to "patrol"
  | { addedIn: string };         // ships added by a given prompt id

export type Condition =
  | { flag: string; equals: string | number | boolean }
  | { standing: string; atLeast?: number; atMost?: number }
  | { fleetHasTag: string };

// ── Checkpoints and state ──────────────────────────────

export interface Checkpoint {
  id: string;
  beforeStage: string;
  description: string;
  state: StateSeed;              // the state every branch is normalised to
}

export interface StateSeed {
  flags?: Record<string, string | number | boolean>;
  standings?: Record<string, number>;
}

// ── GM guidance ────────────────────────────────────────

export interface GmGuidance {
  tone: string;
  improvisation: string;         // what the GM may and may not invent
  sampleAnswer?: { url: string; note: string };
  notes?: string[];
}
```
