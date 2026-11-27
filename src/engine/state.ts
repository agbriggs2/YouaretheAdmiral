import type { Availability, Condition, Effect, FleetRules, Scenario, ShipSelector } from "./scenarioTypes";
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
  captain?: string;              // assigned with the ship; cosmetic for now
  location?: string;             // a scenario location id, or "transit"
  task?: string;                 // what the ship is doing right now
}

/** A named person or place in the story, so the GM keeps names consistent. */
export interface CastMember { name: string; role: string; source: "scenario" | "gm" }

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
  eventId?: string;              // absent for a stage's own review
  outcomeId: string;
  outcomeLabel: string;
  from: string;
  subject: string;
  body: string;
  offline?: boolean;
  changes?: { factionId: string; from: number; to: number }[];
  shipsLost?: string[];
}

export interface LogEntry { stageId: string; text: string }

export interface GameState {
  scenarioId: string;
  stageIndex: number;
  answers: Record<string, string>;
  starbase: { locationId: string; orbit: string; reasoning: string };
  fleetRequest: FleetRequest;
  fleet: FleetShip[];
  departed: (FleetShip & { reason: string; lostIn?: string })[];
  standings: Record<string, number>;
  flags: Record<string, string | number | boolean>;
  revealed: string[];
  transmissions: Transmission[];
  log: LogEntry[];
  submitted: Record<string, boolean>;
  cast: CastMember[];            // people the GM has introduced (authored cast lives in the scenario)
  review?: Transmission;         // end-of-sector review
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
    cast: [],
  };
}

// ── Captains, positions and cast ───────────────────────

const FIRST = ["Maren", "Rhael", "Tomas", "Aiko", "Elena", "Kofi", "Imani", "Dmitri", "Priya", "Sean", "Lucia", "Haruto", "Nadia", "Oren", "Yusuf", "Ingrid", "Mateo", "Leila", "Jonah", "Saoirse", "Ravi", "Thea", "Kwame", "Marisol", "Anders", "Mei", "Callum", "Zara", "Teodor", "Amara", "Viktor", "Noor", "Gabriel", "Hana", "Desmond", "Ines", "Bram", "Keiko", "Felix", "Adaeze"];
const LAST = ["Okonjo", "Varga", "Castellanos", "Lindgren", "Tanaka", "Abernathy", "Moreau", "Rasmussen", "Chandra", "O'Hare", "Petrov", "Nakamura", "Adeyemi", "Halvorsen", "Quintero", "Sato", "Mbeki", "Delacroix", "Kowalski", "Reyes", "Aziz", "Fenwick", "Ibarra", "Thorne", "Kaur", "Bjornsson", "Achebe", "Marchetti", "Haddad", "Novak", "Shin", "Mwangi", "Calloway", "Duarte", "Yilmaz", "Brandt", "Harlan", "Ferreira", "Volkov"];

/** A captain's name not already used by anyone in the story. */
export function newCaptain(taken: Iterable<string>, rand: () => number = Math.random): string {
  const names = [...taken];
  const usedLast = new Set(names.map((n) => n.split(" ").pop()));
  const usedFirst = new Set(names.map((n) => n.split(" ").slice(-2, -1)[0]));
  const firsts = FIRST.filter((f) => !usedFirst.has(f));
  const lasts = LAST.filter((l) => !usedLast.has(l));
  const pick = <T,>(xs: T[], all: T[]) => (xs.length ? xs : all)[Math.floor(rand() * (xs.length || all.length))];
  return `${pick(firsts, FIRST)} ${pick(lasts, LAST)}`;
}

/** Every name already in the story: authored cast, GM-introduced people and captains. */
export function takenNames(s: Scenario, state: GameState): string[] {
  return [...(s.cast ?? []).map((c) => c.name), ...state.cast.map((c) => c.name), ...[...state.fleet, ...state.departed].map((f) => f.captain ?? "").filter(Boolean)];
}

/** Give newly assigned ships a captain and put them at the starbase awaiting orders. */
export function crewShips(s: Scenario, state: GameState, ships: FleetShip[]): FleetShip[] {
  const taken = takenNames(s, state);
  return ships.map((f) => {
    const captain = f.captain ?? newCaptain(taken);
    taken.push(captain);
    return { ...f, captain, location: f.location ?? (state.starbase.locationId || undefined), task: f.task ?? "Arriving; awaiting orders" };
  });
}

/** Bring an older save up to date: cast list, captains and positions. */
export function migrate(s: Scenario, state: GameState): GameState {
  const st: GameState = { ...state, cast: state.cast ?? [] };
  // Reuse captains the GM already named in replies ("Captain Maren Doyle, USS Zephyr").
  const named: Record<string, string> = {};
  for (const t of st.transmissions) {
    for (const m of t.body.matchAll(/Captain ([A-Z][a-z]+ [A-Z][a-z'-]+)(?:,| of the| of) (USS [A-Z][A-Za-z]+(?: [A-Z][a-z]+)?)/g)) named[m[2]] ??= m[1];
  }
  const fleet = st.fleet.map((f) => ({ ...f, captain: f.captain ?? named[f.name], task: f.task ?? (f.assignment || undefined) }));
  return { ...st, fleet: crewShips(s, { ...st, fleet }, fleet) };
}

/** Authored cast whose scene has opened, plus everyone the GM has introduced. */
export function castSeen(s: Scenario, state: GameState): { name: string; role: string; group: string }[] {
  const seen = (key: string) => {
    if (!key.includes(":")) return s.stages.findIndex((st) => st.id === key) <= state.stageIndex;
    return !!(state.submitted[key] || state.submitted[`${key}:seen`] || state.submitted[`${key}:entered`]);
  };
  const authored = (s.cast ?? []).filter((c) => seen(c.introducedIn)).map((c) => ({ name: c.name, role: c.role, group: c.group ?? "People" }));
  const names = new Set(authored.map((c) => c.name));
  return [...authored, ...state.cast.filter((c) => !names.has(c.name)).map((c) => ({ name: c.name, role: c.role, group: "People" }))];
}

/** Factions still relevant: one can drop out once a secret about it is revealed. */
export function activeFactions(s: Scenario, state: GameState) {
  return s.factions.filter((f) => !(f.retiredBy && state.revealed.includes(f.retiredBy)));
}

export const TRANSIT = "transit";
export function locationName(s: Scenario, id?: string): string {
  if (!id) return "Unknown";
  if (id === TRANSIT) return "In transit";
  return s.locations.find((l) => l.id === id)?.name ?? id;
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
export function allocateFleet(rules: FleetRules, req: FleetRequest, catalogue: ShipClass[], promptId: string, tierShift = 0, rand: () => number = Math.random, existing: { name: string; classId: string }[] = []): FleetShip[] {
  const out: FleetShip[] = [];
  const taken = new Set(existing.map((e) => e.name.replace(/^USS /, "")));
  const names = NAMES.filter((n) => !taken.has(n)).sort(() => rand() - 0.5);
  // Ships already in the sector count toward the repeat penalty.
  const copies: Record<string, number> = {};
  for (const e of existing) copies[e.classId] = (copies[e.classId] ?? 0) + 1;
  for (const line of req.lines) {
    const pool = catalogue.filter((c) => c.category === line.category);
    if (!pool.length) continue;
    const pref = pool.find((c) => c.id === line.preferredClassId);
    const label = rules.categories.find((c) => c.id === line.category)?.label ?? line.category;
    for (let i = 0; i < line.count; i++) {
      let pick: ShipClass | undefined;
      if (pref && rand() < grantChance(rules, pref, tierShift, copies[pref.id] ?? 0)) pick = pref;
      const cat = rules.categories.find((c) => c.id === line.category);
      const weighted = (list: ShipClass[], extra: (c: ShipClass) => number = () => 1) => {
        const w = (c: ShipClass) => (WEIGHT[c.availability] ?? 1) * sectorFactor(rules, c) * repeatFactor(rules, c, copies[c.id] ?? 0) * extra(c);
        const total = list.reduce((n, c) => n + w(c), 0);
        let r = rand() * total;
        return list.find((c) => (r -= w(c)) < 0) ?? list[list.length - 1];
      };
      if (!pick && cat?.fallbackCategory) {
        // Scarce category: other classes must win their own roll, else a fallback-category ship.
        const others = pool.filter((c) => c.id !== pref?.id).sort(() => rand() - 0.5);
        pick = others.find((c) => rand() < grantChance(rules, c, tierShift, copies[c.id] ?? 0));
        if (!pick) {
          const fb = catalogue.filter((c) => c.category === cat.fallbackCategory);
          const boost = (c: ShipClass) => cat.fallbackStatusFactor?.[c.status] ?? 1;
          if (fb.length) pick = weighted(fb, boost);
        }
      }
      if (!pick) {
        const others = pref && pool.length > 1 ? pool.filter((c) => c.id !== pref.id) : pool;
        pick = weighted(others);
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
        substituted: pref ? pick.id !== pref.id : pick.category !== line.category,
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

export function applyEffects(state: GameState, effects: Effect[] | undefined, stageId: string, byId: Record<string, ShipClass>, sourceKey?: string): GameState {
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
          departed: [...s.departed, ...gone.map((g) => ({ ...g, reason: e.reason, lostIn: sourceKey }))],
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

// ── Conditions ─────────────────────────────────────────

export function conditionsMet(state: GameState, conds: Condition[] | undefined, byId: Record<string, ShipClass>): boolean {
  return (conds ?? []).every((c) => {
    if ("flag" in c) return state.flags[c.flag] === c.equals;
    if ("standing" in c) {
      const v = state.standings[c.standing] ?? 0;
      return (c.atLeast === undefined || v >= c.atLeast) && (c.atMost === undefined || v <= c.atMost);
    }
    return state.fleet.some((f) => byId[f.classId]?.tags.includes(c.fleetHasTag));
  });
}

/** Standing changes between two states, for display. */
export function standingChanges(before: GameState, after: GameState): { factionId: string; from: number; to: number }[] {
  return Object.keys(after.standings)
    .filter((k) => (before.standings[k] ?? 0) !== after.standings[k])
    .map((k) => ({ factionId: k, from: before.standings[k] ?? 0, to: after.standings[k] }));
}

export function standingLabel(n: number): string {
  return ["Hostile", "Unfriendly", "Wary", "Neutral", "Cordial", "Friendly", "Close ally"][n + 3] ?? "Neutral";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Reinforcement answers are stored as JSON request lines in answers[promptId]. */
export function readLines(state: GameState, promptId: string): RequestLine[] {
  try { return JSON.parse(state.answers[promptId] || "[]") as RequestLine[]; } catch { return []; }
}
