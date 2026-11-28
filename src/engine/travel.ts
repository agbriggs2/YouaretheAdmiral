import type { GameEvent, Scenario, Stage } from "./scenarioTypes";
import type { ShipClass } from "./shipTypes";

/*
 * Travel and time. The sector has a clock (hours since the posting began) and a
 * map in light-years. Ships travel at a warp factor; the engine, not the GM,
 * works out when they arrive.
 */

export interface Coords { x: number; y: number }

/** Multiples of light speed by warp factor (TNG scale, after the TNG Technical Manual). */
const WARP_TABLE: [number, number][] = [
  [1, 1], [2, 10], [3, 39], [4, 102], [5, 214], [6, 392], [7, 656], [8, 1024], [9, 1516], [9.2, 1649], [9.6, 1909], [9.9, 3053], [9.99, 7912],
];
const HOURS_PER_YEAR = 8766;

export function warpToC(w: number): number {
  if (w <= WARP_TABLE[0][0]) return WARP_TABLE[0][1];
  for (let i = 1; i < WARP_TABLE.length; i++) {
    const [w1, c1] = WARP_TABLE[i];
    const [w0, c0] = WARP_TABLE[i - 1];
    if (w <= w1) return c0 + ((w - w0) / (w1 - w0)) * (c1 - c0);
  }
  return WARP_TABLE[WARP_TABLE.length - 1][1];
}

export function distanceLy(a: Coords, b: Coords): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function travelHours(ly: number, warp: number): number {
  return (ly / warpToC(warp)) * HOURS_PER_YEAR;
}

export function cruiseWarp(c?: ShipClass): number {
  if (c?.cruiseWarp) return c.cruiseWarp;
  return Math.round(Math.min(6, (c?.maxWarp ?? 6.8) - 0.8) * 10) / 10;
}
export function maxWarp(c?: ShipClass): number {
  return c?.maxWarp ?? 8;
}

/** "cruise", "maximum" or a warp factor, capped at what the class can do. */
export function speedToWarp(speed: unknown, c?: ShipClass): number {
  if (typeof speed === "number" && speed > 0) return Math.min(speed, maxWarp(c));
  if (typeof speed === "string") {
    if (/max|full|emergency/i.test(speed)) return maxWarp(c);
    const n = parseFloat(speed.replace(/[^0-9.]/g, ""));
    if (!isNaN(n) && n > 0) return Math.min(n, maxWarp(c));
  }
  return cruiseWarp(c);
}

export function locationCoords(s: Scenario, id?: string): Coords | undefined {
  return s.locations.find((l) => l.id === id)?.coords;
}

/** When a stage or scene happens, in hours since the posting began. */
export function stageTime(st: Stage): number {
  return (st.atDay ?? 0) * 24;
}
export function unitTime(st: Stage, ev?: GameEvent): number {
  return stageTime(st) + (ev?.atHours ?? 0);
}

export function formatDuration(h: number): string {
  if (h < 1) return "under an hour";
  if (h < 36) return `${Math.round(h)} hours`;
  const d = h / 24;
  return d < 10 ? `${d.toFixed(1)} days` : `${Math.round(d)} days`;
}

export function formatClock(h: number): string {
  const day = Math.floor(h / 24);
  const hh = String(Math.floor(h % 24)).padStart(2, "0");
  return `day ${day}, ${hh}00 hours`;
}
