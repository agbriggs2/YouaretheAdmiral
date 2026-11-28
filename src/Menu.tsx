import { useEffect, useState } from "react";
import { SCENARIOS, type ScenarioEntry } from "./scenarios";
import type { GameState } from "./engine/state";
import { loadGame } from "./engine/storage";

type Status = { kind: "new" } | { kind: "progress"; where: string } | { kind: "complete" } | { kind: "loading" };

/** Where a saved game stands, for the menu. */
function statusOf(entry: ScenarioEntry, g: GameState | null): Status {
  const s = entry.scenario;
  if (!s || !g || !g.transmissions?.length) return { kind: "new" };
  const last = s.stages[s.stages.length - 1];
  const lastDone = g.stageIndex === s.stages.length - 1 && (last.events ?? []).every((e) => g.submitted?.[`${last.id}:${e.id}`]);
  if (g.review || lastDone) return { kind: "complete" };
  return { kind: "progress", where: s.stages[g.stageIndex]?.title ?? "" };
}

export function Menu({ onPlay }: { onPlay: (id: string) => void }) {
  const [status, setStatus] = useState<Record<string, Status>>(() => Object.fromEntries(SCENARIOS.map((e) => [e.id, { kind: e.scenario ? "loading" : "new" }])));

  useEffect(() => {
    for (const e of SCENARIOS) {
      if (!e.scenario) continue;
      loadGame(e.id).then((g) => setStatus((s) => ({ ...s, [e.id]: statusOf(e, g) })));
    }
  }, []);

  return (
    <div className="app menu">
      <header className="band top">
        <div className="top-inner">
          <p className="kicker">Starfleet Command · Sector assignments</p>
          <h1>You're the Admiral</h1>
          <p className="role">Choose your command</p>
        </div>
      </header>
      <main className="menu-list">
        {SCENARIOS.map((e, i) => {
          const st = status[e.id];
          const ready = !!e.scenario;
          return (
            <section key={e.id} className={`card menu-card${ready ? "" : " locked"}`}>
              <p className="tx-meta">Posting {i + 1} · {e.year} · Complexity: {e.complexity}</p>
              <h2>{e.title}</h2>
              <p>{e.blurb}</p>
              <div className="menu-actions">
                {!ready ? (
                  <span className="badge">Coming next</span>
                ) : st.kind === "loading" ? (
                  <span className="muted">Checking your records…</span>
                ) : (
                  <>
                    <button type="button" className="btn primary" onClick={() => onPlay(e.id)}>
                      {st.kind === "new" ? "Take command" : st.kind === "complete" ? "Review posting" : "Continue"}
                    </button>
                    {st.kind === "progress" && <span className="muted">In progress · {st.where}</span>}
                    {st.kind === "complete" && <span className="muted">Posting complete</span>}
                  </>
                )}
              </div>
            </section>
          );
        })}
      </main>
      <footer className="foot"><p className="muted small-text">Adapted from the "You're the Admiral!" game on Flare SciFi Forums. Personal use.</p></footer>
    </div>
  );
}
