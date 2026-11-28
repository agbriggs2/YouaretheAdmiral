/** Ship class schema v0.3 (see ship-schema.md), as the app uses it. */

export type BalanceEra = "TOS" | "TMP" | "TNG";
export type SourceTier = "canon" | "beta" | "headcanon";
export type CombatRole = "primary" | "secondary" | "none";

export interface Ratings {
  firepower: number;
  defense: number;
  speed: number;
  agility: number;
  sensors: number;
  science: number;
  endurance: number;
  logistics: number;
  presence: number;
}

export const RATING_KEYS: (keyof Ratings)[] = [
  "firepower", "defense", "speed", "agility", "sensors",
  "science", "endurance", "logistics", "presence",
];

export interface ShipClass {
  id: string;
  name: string;
  faction: string;
  era: BalanceEra;
  type: string;
  category: string;              // request category: capital, cruiser, frigate, scout, science, transport
  combatRole: CombatRole;
  tags: string[];
  availability: string;
  status: string;
  ratings: Ratings;
  /** Range of NCC registry numbers this class is drawn from (roughly chronological; canon examples where they exist). */
  registryRange?: [number, number];
  serviceEntry?: number;
  lengthM?: number;
  crew?: number;
  evacuation?: number;
  maxWarp?: number;
  /** Normal cruising speed; defaults to warp 6, or less for slow classes. */
  cruiseWarp?: number;
  weapons?: string;
  auxiliaryCraft?: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  reputation?: string;
  sourceTier: SourceTier;
}

export function totalRating(s: ShipClass): number {
  return RATING_KEYS.reduce((sum, k) => sum + s.ratings[k], 0);
}
