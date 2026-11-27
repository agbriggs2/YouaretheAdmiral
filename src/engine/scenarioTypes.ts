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
  | { id: string; kind: "choice"; text: string; options: { id: string; label: string }[] }
  /** Request specific reinforcements; the engine allocates them like the opening fleet. */
  | { id: string; kind: "reinforcement"; text: string; slots: ReinforcementSlot[] }
  /** Pick one ship from the player's current fleet. */
  | { id: string; kind: "ship-choice"; text: string };

export interface ReinforcementSlot {
  id: string;
  label: string;                 // "One combat ship"
  categories: string[];          // categories the player may choose from
  count: number;
}

export interface AddRules {
  ships: { count: number; combatRole?: "primary" | "secondary" | "none"; tag?: string; label: string }[];
}

export interface GameEvent {
  id: string;
  title: string;
  conditions?: Condition[];      // empty or absent = always happens
  from?: string;                 // who delivers it: "Starfleet Command", "Lysaran Court"…
  text: string;                  // what the player is told; {lost} = ships removed by this event's onEnter
  onEnter?: Effect[];            // effects applied before the player responds
  prompts: Prompt[];             // usually one free-text order prompt
  outcomes: Outcome[];
  defaultOutcomeId: string;      // used if the GM can't decide
  gmNotes?: string;              // private direction for the GM
  /** Earlier answers the GM is shown for this scene, for continuity only. */
  recall?: { promptId: string; label: string }[];
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
