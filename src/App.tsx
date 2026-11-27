import { useEffect, useMemo, useRef, useState } from "react";
import { sectorAlpha } from "./scenarios/sectorAlpha";
import { SHIPS, SHIPS_BY_ID } from "./data/ships";
import { SectorMap } from "./components/SectorMap";
import { FleetRequest } from "./components/FleetRequest";
import { StageView } from "./components/StageView";
import { AssignedFleet } from "./components/AssignedFleet";
import type { GameState, Transmission } from "./engine/state";
import { allocateFleet, applyEffects, checkAssignments, checkRequest, newGame, postureTriggered, standingLabel } from "./engine/state";
import { getSample, gradeStage, writeReply } from "./engine/gm";
import { loadGame, saveLocal, saveRemote } from "./engine/storage";

const S = sectorAlpha;
const RULES = S.resources.fleet!;
const CATALOGUE = SHIPS.filter((c) => c.era === S.era && (c.serviceEntry ?? 0) <= S.year);
/** A stage is playable once every prompt kind it uses is supported by the stage engine. */
const playable = (i: number) => {
  const st = S.stages[i];
  if (!st) return false;
  const kinds = [...(st.prompts ?? []), ...(st.events ?? []).flatMap((e) => e.prompts)].map((p) => p.kind);
  return kinds.every((k) => ["free-text", "choice", "reinforcement", "ship-choice"].includes(k));
};
const ORBIT_LABEL: Record<string, string> = { "planet-orbit": "In planetary orbit", "star-orbit": "In orbit of the star", "open-space": "In open space" };

export default function App() {
  const [state, setState] = useState<GameState>(() => newGame(S));
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [gmAvailable, setGmAvailable] = useState<boolean | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [mapFocus, setMapFocus] = useState("");
  const replyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGame(S.id).then((g) => {
      if (g && g.scenarioId === S.id) setState({ ...newGame(S), ...g });
      setLoaded(true);
    });
    getSample().then((s) => setGmAvailable(!!s));
  }, []);

  const first = useRef(true);
  useEffect(() => {
    if (!loaded) return;
    if (first.current) { first.current = false; return; }
    saveLocal(state);
    const t = setTimeout(() => saveRemote(state), 1500);
    return () => clearTimeout(t);
  }, [state, loaded]);

  const stage = S.stages[state.stageIndex];
  const q1 = S.stages[0];
  const q1Done = !!state.submitted.q1;
  const checks = useMemo(() => checkRequest(RULES, state.fleetRequest), [state.fleetRequest]);
  const fleetOk = checks.every((c) => c.ok);
  const dutyCheck = checkAssignments(state.fleet);
  const prioritiesOk = (state.answers["q1-priorities"] ?? "").trim().length > 20;
  const starbaseOk = !!state.starbase.locationId && !!state.starbase.orbit && state.starbase.reasoning.trim().length > 0;
  const ready = fleetOk && prioritiesOk && starbaseOk;
  const reply: Transmission | undefined = state.transmissions.find((t) => t.stageId === "q1");
  const sbLoc = S.locations.find((l) => l.id === state.starbase.locationId);

  const setAnswer = (id: string, v: string) => setState((s) => ({ ...s, answers: { ...s.answers, [id]: v } }));
  const setStarbase = (patch: Partial<GameState["starbase"]>) => setState((s) => ({ ...s, starbase: { ...s.starbase, ...patch } }));

  const pickLocation = (id: string) => {
    if (q1Done) return;
    const loc = S.locations.find((l) => l.id === id);
    if (!loc?.starbaseOptions?.length) return;
    setStarbase({ locationId: id, orbit: loc.starbaseOptions.length === 1 ? loc.starbaseOptions[0] : "" });
  };

  const transmit = async () => {
    setBusy(true);
    setError("");
    try {
      let working = state;
      // Step 1 (once): grade the plan, then assign ships with odds shaped by the grade.
      if (!working.submitted.q1alloc) {
        const graded = await gradeStage(S, q1, working, SHIPS_BY_ID);
        const shift = RULES.allocation?.gradeTierShift?.[graded.id] ?? 0;
        const fleet = allocateFleet(RULES, working.fleetRequest, CATALOGUE, "q1-fleet", shift);
        working = applyEffects({ ...working, fleet }, graded.effects, "q1", SHIPS_BY_ID);
        if (RULES.posture && postureTriggered(RULES, fleet, SHIPS_BY_ID)) {
          working = applyEffects(working, [...RULES.posture.effects, { type: "set-flag", flag: RULES.posture.flag, value: "heavy" }], "q1", SHIPS_BY_ID);
        }
        working = { ...working, flags: { ...working.flags, "q1-outcome": graded.id }, submitted: { ...working.submitted, q1alloc: true } };
        setState(working);
      }
      // Step 2: Starfleet Command's reply announcing the ships.
      const outcome = q1.review!.outcomes.find((o) => o.id === working.flags["q1-outcome"]) ?? q1.review!.outcomes[0];
      const notes = RULES.posture && working.flags[RULES.posture.flag] === "heavy" ? [RULES.posture.gmNote] : [];
      const t = await writeReply(S, q1, working, SHIPS_BY_ID, outcome, notes);
      setState((s) => ({ ...s, transmissions: [...s.transmissions.filter((x) => x.stageId !== "q1"), t], submitted: { ...s.submitted, q1: true } }));
      setTimeout(() => replyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      const err = e as { code?: string; message?: string };
      setError(err.code === "rate_limited" ? "Starfleet Command's channel is busy. Wait a moment, then transmit again." : err.code === "not_granted" ? "Permission to contact Claude wasn't granted, so the GM can't reply here." : `The transmission failed: ${err.message ?? "unknown error"}. Try again.`);
    } finally {
      setBusy(false);
    }
  };

  const advance = () => {
    setState((s) => {
      const i = s.stageIndex + 1;
      const st = S.stages[i];
      if (!st) return s;
      const next = applyEffects(s, st.onEnter, st.id, SHIPS_BY_ID);
      return { ...next, stageIndex: i };
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const continueToQ2 = advance;

  const reset = () => {
    setState(newGame(S));
    setConfirmReset(false);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="app">
      <header className="band top">
        <div className="top-inner">
          <p className="kicker">You're the Admiral</p>
          <h1>{S.title}</h1>
          <p className="role">{S.playerRole.rank} · {S.playerRole.title} · {S.year}</p>
          <nav className="stages" aria-label="Scenario stages">
            {S.stages.map((st, i) => (
              <span key={st.id} className={`stage-pill${i === state.stageIndex ? " now" : ""}${i < state.stageIndex ? " done" : ""}`}>
                {st.title.split(":")[0]}
              </span>
            ))}
          </nav>
        </div>
        <ul className="standings" aria-label="Faction standings">
          {S.factions.map((f) => {
            const n = state.standings[f.id] ?? 0;
            return (
              <li key={f.id}>
                <span className="f-name">{f.name}</span>
                <span className={`f-meter s${n + 3}`} aria-hidden="true">{[-3, -2, -1, 0, 1, 2, 3].map((v) => <i key={v} className={v <= n ? "on" : ""} />)}</span>
                <span className="f-label">{standingLabel(n)}</span>
              </li>
            );
          })}
        </ul>
      </header>

      <main className="band main">
        <div className="col-prompts">
          {state.stageIndex === 0 ? (
            <>
              <section className="card briefing">
                <h2>{q1.title}</h2>
                <p className="lead">{S.playerRole.briefing}</p>
                <p>{q1.briefing}</p>
                <details>
                  <summary>What you know about the sector</summary>
                  <ul>{S.setting.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
                </details>
                <details>
                  <summary>The inhabited worlds</summary>
                  <table className="stack worlds">
                    <thead><tr><th>World</th><th>Population</th><th>Government</th><th>Technology</th><th>Defenses</th></tr></thead>
                    <tbody>
                      {S.factions.filter((f) => f.population).map((f) => (
                        <tr key={f.id}>
                          <td><b>{f.name}</b><br /><span className="muted">{f.status === "applicant" ? "Petitioning to join" : f.status === "aligned" ? "Federation-aligned" : "Neutral"}</span></td>
                          <td>{f.population}</td>
                          <td>{f.government}</td>
                          <td>{f.technology}</td>
                          <td>{(f.military ?? []).map((m) => `${m.count ? m.count + " " : ""}${m.description}`).join("; ")}. {f.resources}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </details>
              </section>

              <section className="card">
                <h2><span className="step">1</span>Priorities</h2>
                <p>{(q1.prompts![0] as { text: string }).text}</p>
                <p className="muted">{(q1.prompts![0] as { guidance?: string }).guidance}</p>
                <textarea rows={7} value={state.answers["q1-priorities"] ?? ""} disabled={q1Done} onChange={(e) => setAnswer("q1-priorities", e.target.value)} aria-label="Starfleet's priorities" placeholder="Admiral's log…" />
              </section>

              <section className="card">
                <h2><span className="step">2</span>Starbase</h2>
                <p>{S.resources.starbase!.description} Pick a location below or on the map.</p>
                <div className="loc-grid" role="radiogroup" aria-label="Starbase location">
                  {S.locations.filter((l) => l.starbaseOptions?.length).map((l) => (
                    <button
                      key={l.id}
                      type="button"
                      role="radio"
                      aria-checked={state.starbase.locationId === l.id}
                      className={`loc-btn${state.starbase.locationId === l.id ? " on" : ""}`}
                      disabled={q1Done}
                      onMouseEnter={() => setMapFocus(l.id)}
                      onMouseLeave={() => setMapFocus("")}
                      onClick={() => pickLocation(l.id)}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>
                {sbLoc && (sbLoc.starbaseOptions?.length ?? 0) > 1 && (
                  <div className="orbit" role="radiogroup" aria-label="Orbit">
                    {sbLoc.starbaseOptions!.map((o) => (
                      <label key={o} className={`radio${state.starbase.orbit === o ? " on" : ""}`}>
                        <input type="radio" name="orbit" checked={state.starbase.orbit === o} disabled={q1Done} onChange={() => setStarbase({ orbit: o })} />
                        {ORBIT_LABEL[o]}
                      </label>
                    ))}
                  </div>
                )}
                <label className="field">
                  <span>Why here?</span>
                  <textarea rows={3} value={state.starbase.reasoning} disabled={q1Done} onChange={(e) => setStarbase({ reasoning: e.target.value })} />
                </label>
              </section>

              <section className="card">
                <h2><span className="step">3</span>Fleet request</h2>
                <p>{(q1.prompts![2] as { text: string }).text}</p>
                {RULES.allocation?.note && <p className="sector-note">{RULES.allocation.note}{RULES.posture ? ` ${RULES.posture.hint}` : ""}</p>}
                <FleetRequest rules={RULES} catalogue={CATALOGUE} request={state.fleetRequest} locked={q1Done || busy || !!state.submitted.q1alloc} onChange={(fleetRequest) => setState((s) => ({ ...s, fleetRequest }))} />
              </section>

              {!q1Done && (
                <section className="card transmit">
                  <ul className="checklist">
                    <li className={prioritiesOk ? "ok" : ""}>Priorities written</li>
                    <li className={starbaseOk ? "ok" : ""}>Starbase location, orbit and reasoning</li>
                    {checks.map((c) => <li key={c.label} className={c.ok ? "ok" : ""}>{c.label} <span className="muted">· {c.detail}</span></li>)}
                  </ul>
                  <button type="button" className="btn primary" disabled={!ready || busy} onClick={transmit}>
                    {busy ? "Awaiting reply from Starfleet Command…" : "Transmit plan and fleet request to Starfleet Command"}
                  </button>
                  {gmAvailable === false && <p className="muted small-text">The AI game master only answers inside Claude. Here you'll get a short standard acknowledgement instead.</p>}
                  {error && <p className="error" role="alert">{error}</p>}
                </section>
              )}

              {reply && (
                <section className="card transmission" ref={replyRef} aria-live="polite">
                  <p className="tx-meta">Incoming transmission · {reply.from}</p>
                  <h2>{reply.subject}</h2>
                  {reply.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
                  {reply.offline && <p className="muted small-text">Standard acknowledgement: the AI game master wasn't available.</p>}
                </section>
              )}

              {reply && (
                <section className="card">
                  <h2><span className="step">4</span>Your assigned fleet</h2>
                  <p>Starfleet has assigned these ships. Name them if you like, then give each one a duty and a primary mission.</p>
                  <AssignedFleet fleet={state.fleet} byId={SHIPS_BY_ID} assignments={RULES.assignments} locked={false} onChange={(fleet) => setState((s) => ({ ...s, fleet }))} />
                  <ul className="checklist"><li className={dutyCheck.ok ? "ok" : ""}>{dutyCheck.label} <span className="muted">· {dutyCheck.detail}</span></li></ul>
                  <button type="button" className="btn primary" disabled={!dutyCheck.ok} onClick={continueToQ2}>Continue to Question Two</button>
                </section>
              )}
            </>
          ) : (
            <>
              <StageView
                scenario={S}
                stage={stage}
                state={state}
                byId={SHIPS_BY_ID}
                setState={setState}
                onContinue={advance}
                nextLabel={S.stages[state.stageIndex + 1] ? `Continue to ${S.stages[state.stageIndex + 1].title.split(":")[0]}` : "Scenario complete"}
                nextReady={playable(state.stageIndex + 1)}
                rules={RULES}
                catalogue={CATALOGUE}
                isLast={state.stageIndex === S.stages.length - 1}
              />
              {reply && (
                <details className="card">
                  <summary>Starfleet Command's reply to your plan</summary>
                  <h3 className="sub">{reply.subject}</h3>
                  {reply.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
                </details>
              )}
            </>
          )}
        </div>

        <aside className="col-side">
          <div className="side-sticky">
            <div className="map-wrap">
              <SectorMap locations={S.locations} starbase={state.starbase} focus={mapFocus} onPick={state.stageIndex === 0 && !q1Done ? pickLocation : undefined} />
              <p className="map-cap">
                {sbLoc ? <>Starbase: <b>{sbLoc.name}</b>{state.starbase.orbit ? `, ${ORBIT_LABEL[state.starbase.orbit].toLowerCase()}` : " (choose an orbit)"}</> : "Schematic map. Pick a starbase location."}
              </p>
            </div>
            <div className="roster">
              <h3 className="sub">Fleet roster</h3>
              {state.fleet.length === 0 ? <p className="empty">{state.fleetRequest.lines.length ? `${state.fleetRequest.lines.reduce((n, l) => n + l.count, 0)} ships requested. Awaiting assignment.` : "No ships assigned."}</p> : (
                <ul>
                  {state.fleet.map((f) => (
                    <li key={f.uid}><span className="r-name">{f.name}</span><span className="muted">{SHIPS_BY_ID[f.classId]?.name} · {f.assignment || "no duty"}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </aside>
      </main>

      <footer className="band foot">
        <p className="muted small-text">Adapted from "You're the Admiral!" on <a href={S.source?.url}>Star Trek Minutiae</a>. Personal fan project; not affiliated with Paramount or CBS.</p>
        {confirmReset ? (
          <span className="reset-confirm">Start the scenario over? Your answers will be cleared. <button type="button" className="btn small danger" onClick={reset}>Start over</button> <button type="button" className="btn ghost small" onClick={() => setConfirmReset(false)}>Cancel</button></span>
        ) : (
          <button type="button" className="btn ghost small" onClick={() => setConfirmReset(true)}>Start over</button>
        )}
      </footer>
    </div>
  );
}
