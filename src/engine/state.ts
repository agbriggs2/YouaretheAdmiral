import type { Availability, Effect, FleetRules, Scenario, ShipSelector } from "./scenarioTypes";
import type { ShipClass } from "./shipTypes";
import { totalRating } from "./shipTypes";

export interface FleetShip {
  uid: string;
  classId: string;
  name: string;
  assignment: string;
  mission: string;
  justification: string;
  addedIn: string;               // prompt id that added it
  requested?: string;            // what the player asked for, e.g. "Frigate (New Orleans preferred)"
  substituted?: boolean;         // true if Starfleet sent something other than the preference
}

export interface RequestLine {
  id: string;
  category: string;
  count: number;
  preferredClassId: string;      // "" = any
  purpose: string;
}

export interface FleetRequest {
  disposition: string;
  lines: RequestLine[];
}

export interface Transmission {
  stageId: string;
  outcomeId: string;
  outcomeLabel: string;
  from: string;
  subject: string;
  body: string;
  offline?: boolean;
}

export interface LogEntry { stageId: string; text: string }

export interface GameState {
  scenarioId: string;
  stageIndex: number;
  answers: Record<string, string>;
  starbase: { locationId: string; orbit: string; reasoning: string };
  fleetRequest: FleetRequest;
  fleet: FleetShip[];
  departed: (FleetShip & { reason: string })[];
  standings: Record<string, number>;
  flags: Record<string, string | number | boolean>;
  revealed: string[];
  transmissions: Transmission[];
  log: LogEntry[];
  submitted: Record<string, boolean>;
}

export function newGame(s: Scenario): GameState {
  return {
    scenarioId: s.id,
    stageIndex: 0,
    answers: {},
    starbase: { locationId: "", orbit: "", reasoning: "" },
    fleetRequest: { disposition: "", lines: [] },
    fleet: [],
    departed: [],
    standings: Object.fromEntries(s.factions.map((f) => [f.id, f.startingStanding])),
    flags: { ...(s.initialState?.flags ?? {}) },
    revealed: [],
    transmissions: [],
    log: [],
    submitted: {},
  };
}

// ── Fleet rules ────────────────────────────────────────

export interface RuleCheck { label: string; ok: boolean; detail: string }

export function checkFleet(rules: FleetRules, fleet: FleetShip[], byId: Record<string, ShipClass>): RuleCheck[] {
  const classes = fleet.map((f) => byId[f.classId]).filter(Boolean);
  const checks: RuleCheck[] = [];
  checks.push({
    label: `Up to ${rules.maxShips} ships`,
    ok: fleet.length > 0 && fleet.length <= rules.maxShips,
    detail: `${fleet.length} of ${rules.maxShips}`,
  });
  for (const t of rules.tagLimits ?? []) {
    const n = classes.filter((c) => c.tags.includes(t.tag)).length;
    checks.push({ label: t.label, ok: n <= t.max, detail: `${n} of at most ${t.max}` });
  }
  for (const r of rules.roleMinimums ?? []) {
    const n = classes.filter((c) => c.combatRole === r.combatRole).length;
    checks.push({ label: r.label, ok: n >= r.min, detail: `${n} of at least ${r.min}` });
  }
  const missing = fleet.filter((f) => !f.assignment || !f.mission.trim());
  checks.push({
    label: "Every ship has a duty and a primary mission",
    ok: fleet.length > 0 && missing.length === 0,
    detail: missing.length ? `${missing.length} incomplete` : "Complete",
  });
  const req = rules.justificationRequired ?? [];
  const needs = fleet.filter((f) => {
    const c = byId[f.classId];
    if (!c) return false;
    return req.includes("all") || (req.includes("capital") && c.tags.includes("capital")) || (req.includes("non-combat") && c.combatRole === "none");
  });
  const unjustified = needs.filter((f) => !f.justification.trim());
  if (needs.length) {
    checks.push({
      label: "Capital and non-combat ships are justified",
      ok: unjustified.length === 0,
      detail: unjustified.length ? `${unjustified.length} need a justification` : "Complete",
    });
  }
  return checks;
}

export function needsJustification(rules: FleetRules, c: ShipClass): boolean {
  const req = rules.justificationRequired ?? [];
  return req.includes("all") || (req.includes("capital") && c.tags.includes("capital")) || (req.includes("non-combat") && c.combatRole === "none");
}

// ── Fleet requests and allocation ──────────────────────

export const DEFAULT_CHANCE: Record<Availability, number> = {
  Ubiquitous: 0.95, Common: 0.8, Uncommon: 0.5, Rare: 0.3, Unique: 0.1,
};
/** Each extra ship of the same class is multiplied by this, once per copy already assigned. */
export const DEFAULT_REPEAT: Record<Availability, number> = {
  Ubiquitous: 1, Common: 0.85, Uncommon: 0.5, Rare: 0.15, Unique: 0.02,
};
function repeatFactor(rules: FleetRules, c: ShipClass, copies: number): number {
  if (!copies) return 1;
  const f = { ...DEFAULT_REPEAT, ...(rules.allocation?.repeatFactor ?? {}) }[c.availability as Availability] ?? 0.5;
  return f ** copies;
}
const TIERS: Availability[] = ["Unique", "Rare", "Uncommon", "Common", "Ubiquitous"];
const WEIGHT: Record<string, number> = { Ubiquitous: 5, Common: 4, Uncommon: 2, Rare: 1, Unique: 0.25 };
function sectorFactor(rules: FleetRules, c: ShipClass): number {
  const a = rules.allocation;
  return (a?.statusFactor?.[c.status] ?? 1) * (a?.roleFactor?.[c.combatRole] ?? 1);
}

/**
 * Chance Starfleet grants a preferred class, after availability, sector factors
 * and any grade shift; `copies` already assigned reduce it for scarce classes.
 */
export function grantChance(rules: FleetRules, c: ShipClass, tierShift = 0, copies = 0): number {
  const chance = { ...DEFAULT_CHANCE, ...(rules.availabilityChance ?? {}) };
  const i = TIERS.indexOf(c.availability as Availability);
  const tier = TIERS[Math.max(0, Math.min(TIERS.length - 1, (i < 0 ? 2 : i) + tierShift))];
  const base = Math.max(0.05, Math.min(0.95, chance[tier] * sectorFactor(rules, c)));
  return base * repeatFactor(rules, c, copies);
}

/** True if the fleet carries more front-line warships than the sector tolerates. */
export function postureTriggered(rules: FleetRules, fleet: FleetShip[], byId: Record<string, ShipClass>): boolean {
  if (!rules.posture) return false;
  return fleet.filter((f) => byId[f.classId]?.combatRole === "primary").length > rules.posture.maxPrimaryCombat;
}

export function checkRequest(rules: FleetRules, req: FleetRequest): RuleCheck[] {
  const total = req.lines.reduce((n, l) => n + l.count, 0);
  const cat = (id: string) => rules.categories.find((c) => c.id === id);
  const capital = req.lines.filter((l) => cat(l.category)?.capital).reduce((n, l) => n + l.count, 0);
  const nonCombat = req.lines.filter((l) => cat(l.category)?.nonCombat).reduce((n, l) => n + l.count, 0);
  const checks: RuleCheck[] = [
    { label: `Up to ${rules.maxShips} ships`, ok: total > 0 && total <= rules.maxShips, detail: `${total} of ${rules.maxShips}` },
  ];
  for (const t of rules.tagLimits ?? []) checks.push({ label: t.label, ok: capital <= t.max, detail: `${capital} of at most ${t.max}` });
  for (const r of rules.roleMinimums ?? []) checks.push({ label: r.label, ok: nonCombat >= r.min, detail: `${nonCombat} of at least ${r.min}` });
  const unexplained = req.lines.filter((l) => !l.purpose.trim());
  checks.push({ label: "Every request says what the ships are for", ok: req.lines.length > 0 && unexplained.length === 0, detail: unexplained.length ? `${unexplained.length} missing` : "Complete" });
  checks.push({ label: "Overall fleet disposition described", ok: req.disposition.trim().length > 0, detail: req.disposition.trim() ? "Complete" : "Missing" });
  return checks;
}

export function checkAssignments(fleet: FleetShip[]): RuleCheck {
  const missing = fleet.filter((f) => !f.assignment || !f.mission.trim());
  return { label: "Every ship has a duty and a primary mission", ok: fleet.length > 0 && missing.length === 0, detail: missing.length ? `${missing.length} incomplete` : "Complete" };
}

const NAMES = ["Arcturus", "Bellerophon", "Concorde", "Drake", "Endeavour", "Fearless", "Gallant", "Hermes", "Icarus", "Jaguar", "Kearsarge", "Leander", "Majestic", "Nimitz", "Orion", "Pioneer", "Resolute", "Sentinel", "Tenacity", "Valiant", "Wasp", "Yorktown", "Zephyr"];

/**
 * Starfleet fills each requested slot. A preferred class is granted with a
 * chance set by its availability, the sector's status and combat-role factors,
 * and the plan's grade; otherwise Starfleet sends another class from the same
 * category, weighted the same way. Every slot is filled.
 */
export function allocateFleet(rules: FleetRules, req: FleetRequest, catalogue: ShipClass[], promptId: string, tierShift = 0, rand: () => number = Math.random): FleetShip[] {
  const out: FleetShip[] = [];
  const names = [...NAMES].sort(() => rand() - 0.5);
  const copies: Record<string, number> = {};
  for (const line of req.lines) {
    const pool = catalogue.filter((c) => c.category === line.category);
    if (!pool.length) continue;
    const pref = pool.find((c) => c.id === line.preferredClassId);
    const label = rules.categories.find((c) => c.id === line.category)?.label ?? line.category;
    for (let i = 0; i < line.count; i++) {
      let pick: ShipClass | undefined;
      if (pref && rand() < grantChance(rules, pref, tierShift, copies[pref.id] ?? 0)) pick = pref;
      if (!pick) {
        const others = pref && pool.length > 1 ? pool.filter((c) => c.id !== pref.id) : pool;
        const w = (c: ShipClass) => (WEIGHT[c.availability] ?? 1) * sectorFactor(rules, c) * repeatFactor(rules, c, copies[c.id] ?? 0);
        const total = others.reduce((n, c) => n + w(c), 0);
        let r = rand() * total;
        pick = others.find((c) => (r -= w(c)) < 0) ?? others[others.length - 1];
      }
      copies[pick.id] = (copies[pick.id] ?? 0) + 1;
      out.push({
        uid: uid(),
        classId: pick.id,
        name: `USS ${names[out.length % names.length]}`,
        assignment: "",
        mission: line.purpose,
        justification: line.purpose,
        addedIn: promptId,
        requested: `${label}${pref ? ` (${pref.name} preferred)` : ""}`,
        substituted: !!pref && pick.id !== pref.id,
      });
    }
  }
  return out;
}

// ── Effects ────────────────────────────────────────────

function selectShips(state: GameState, sel: ShipSelector, count: number, byId: Record<string, ShipClass>): FleetShip[] {
  const fleet = [...state.fleet];
  const score = (f: FleetShip) => {
    const c = byId[f.classId];
    return c ? totalRating(c) * 10000 + (c.lengthM ?? 0) : 0;
  };
  if (sel === "strongest") return fleet.sort((a, b) => score(b) - score(a)).slice(0, count);
  if (sel === "weakest-combat") {
    return fleet.filter((f) => byId[f.classId]?.combatRole !== "none").sort((a, b) => score(a) - score(b)).slice(0, count);
  }
  if ("assignment" in sel) {
    const pick = fleet.filter((f) => f.assignment === sel.assignment).sort((a, b) => score(a) - score(b));
    return (pick.length ? pick : selectShips(state, "weakest-combat", count, byId)).slice(0, count);
  }
  return fleet.filter((f) => f.addedIn === sel.addedIn).slice(0, count);
}

export function applyEffects(state: GameState, effects: Effect[] | undefined, stageId: string, byId: Record<string, ShipClass>): GameState {
  let s = state;
  for (const e of effects ?? []) {
    switch (e.type) {
      case "set-flag":
        s = { ...s, flags: { ...s.flags, [e.flag]: e.value } };
        break;
      case "adjust-standing": {
        const cur = s.standings[e.factionId] ?? 0;
        s = { ...s, standings: { ...s.standings, [e.factionId]: Math.max(-3, Math.min(3, cur + e.delta)) } };
        break;
      }
      case "remove-ships": {
        const gone = selectShips(s, e.selector, e.count, byId);
        const ids = new Set(gone.map((g) => g.uid));
        s = {
          ...s,
          fleet: s.fleet.filter((f) => !ids.has(f.uid)),
          departed: [...s.departed, ...gone.map((g) => ({ ...g, reason: e.reason }))],
          log: [...s.log, ...gone.map((g) => ({ stageId, text: `${g.name} (${byId[g.classId]?.name ?? g.classId} class): ${e.reason}.` }))],
        };
        break;
      }
      case "reveal":
        if (!s.revealed.includes(e.secretId)) s = { ...s, revealed: [...s.revealed, e.secretId] };
        break;
      case "log":
        s = { ...s, log: [...s.log, { stageId, text: e.text }] };
        break;
    }
  }
  return s;
}

export function standingLabel(n: number): string {
  return ["Hostile", "Unfriendly", "Wary", "Neutral", "Cordial", "Friendly", "Close ally"][n + 3] ?? "Neutral";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
