import type { Scenario } from "../engine/scenarioTypes";
import { sectorAlpha } from "./sectorAlpha";

/** Every scenario the menu offers, in play order. One without a `scenario` isn't built yet. */
export interface ScenarioEntry {
  id: string;
  title: string;
  year: number;
  complexity: string;
  blurb: string;
  scenario?: Scenario;
}

export const SCENARIOS: ScenarioEntry[] = [
  {
    id: sectorAlpha.id,
    title: sectorAlpha.title,
    year: sectorAlpha.year,
    complexity: "Low",
    blurb: "Take command of a quiet frontier sector of three worlds: Tekanan III, still recovering from an invasion; Lysara, seven nations under a single crown; and isolationist Kestu IX. Beyond the border, the power that once attacked Tekanan has been silent for decades.",
    scenario: sectorAlpha,
  },
  {
    id: "sector-beta",
    title: "Sector Beta",
    year: 2372,
    complexity: "Medium",
    blurb: "Your next command, and the first with branching storylines: what you decide changes what happens next.",
  },
];
