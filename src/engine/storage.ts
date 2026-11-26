import type { GameState } from "./state";

/* Saves go to the artifact database (per player, private), with a
   localStorage copy as a convenience. Both may be missing. */

interface DocRef { get(): Promise<{ exists?: boolean; data?: () => unknown } | unknown>; set(v: unknown): Promise<void> }
interface Db { collection(path: string): { doc(id: string): DocRef } }
interface User { id(): Promise<string> }

const LS_KEY = (id: string) => `yata-save-${id}`;

async function dbDoc(scenarioId: string): Promise<DocRef | null> {
  try {
    if (!window.claude?.use) return null;
    const [db, user] = await Promise.all([
      window.claude.use("db") as Promise<Db | null>,
      window.claude.use("user") as Promise<User | null>,
    ]);
    if (!db || !user) return null;
    const id = await user.id();
    return db.collection(`data/users/${id}`).doc(`save-${scenarioId}`);
  } catch {
    return null;
  }
}

function unwrap(snap: unknown): unknown {
  if (!snap) return null;
  const s = snap as { exists?: boolean; data?: () => unknown };
  if (typeof s.data === "function") return s.exists === false ? null : s.data();
  return snap;
}

export async function loadGame(scenarioId: string): Promise<GameState | null> {
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 10000));
  const fromDb = (async () => {
    const ref = await dbDoc(scenarioId);
    if (!ref) return null;
    const v = unwrap(await ref.get()) as { state?: string } | null;
    return v?.state ? (JSON.parse(v.state) as GameState) : null;
  })().catch(() => null);
  const db = await Promise.race([fromDb, timeout]);
  if (db) return db;
  try {
    const raw = localStorage.getItem(LS_KEY(scenarioId));
    return raw ? (JSON.parse(raw) as GameState) : null;
  } catch {
    return null;
  }
}

export function saveLocal(state: GameState): void {
  try { localStorage.setItem(LS_KEY(state.scenarioId), JSON.stringify(state)); } catch { /* unavailable */ }
}

let writing: Promise<void> = Promise.resolve();
let lastWritten = "";
export function saveRemote(state: GameState): void {
  const json = JSON.stringify(state);
  if (json === lastWritten) return;
  lastWritten = json;
  writing = writing.then(async () => {
    const ref = await dbDoc(state.scenarioId);
    if (ref) await ref.set({ state: json, savedAt: new Date().toISOString() });
  }).catch(() => undefined);
}
