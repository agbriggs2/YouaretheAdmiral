import type { GameState } from "./state";

/* Testing aids, hidden from normal play. Toggle with Alt+Shift+D. */

const DEV_KEY = "yata-dev";
const UNDO_KEY = (id: string) => `yata-undo-${id}`;

export function isDev(): boolean {
  try { return localStorage.getItem(DEV_KEY) === "1"; } catch { return false; }
}

export function toggleDev(): boolean {
  const on = !isDev();
  try { on ? localStorage.setItem(DEV_KEY, "1") : localStorage.removeItem(DEV_KEY); } catch { /* unavailable */ }
  return on;
}

/** The state just before a scene was sent, so that answer can be revised. Kept in this browser only. */
export function saveUndo(key: string, state: GameState): void {
  try { localStorage.setItem(UNDO_KEY(state.scenarioId), JSON.stringify({ key, state })); } catch { /* unavailable */ }
}

export function readUndo(scenarioId: string): { key: string; state: GameState } | null {
  try {
    const raw = localStorage.getItem(UNDO_KEY(scenarioId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearUndo(scenarioId: string): void {
  try { localStorage.removeItem(UNDO_KEY(scenarioId)); } catch { /* unavailable */ }
}
