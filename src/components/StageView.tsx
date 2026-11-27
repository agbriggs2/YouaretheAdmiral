import { useEffect, useState } from "react";
import type { FleetRules, Prompt, Scenario, Stage } from "../engine/scenarioTypes";
import type { ShipClass } from "../engine/shipTypes";
import type { GameState, Transmission } from "../engine/state";
import type { RequestLine } from "../engine/state";
import { activeFactions, allocateFleet, applyEffects, checkAssignments, conditionsMet, crewShips, grantChance, readLines, standingChanges, standingLabel, uid } from "../engine/state";
import { saveUndo, readUndo, clearUndo } from "../engine/dev";
import { AssignedFleet } from "./AssignedFleet";
import { resolve, writeReview } from "../engine/gm";

interface Props {
  scenario: Scenario;
  stage: Stage;
  state: GameState;
  byId: Record<string, ShipClass>;
  setState: (fn: (s: GameState) => GameState) => void;
  onContinue: () => void;
  nextLabel: string;
  nextReady: boolean;
  rules: FleetRules;
  catalogue: ShipClass[];
  isLast: boolean;
  dev: boolean;
}

const SUPPORTED = ["free-text", "choice", "reinforcement", "ship-choice"];

type Unit = {
  key: string;                   // "q2" for the review, "q2:q2-piracy" for an event
  eventId?: string;
  from: string;
  title: string;
  text: string;
  prompts: Prompt[];
  outcomes: import("../engine/scenarioTypes").Outcome[];
  defaultOutcomeId: string;
  gmNotes?: string;
  onEnter?: import("../engine/scenarioTypes").Effect[];
};

function errorText(e: unknown): string {
  const err = e as { code?: string; message?: string };
  if (err.code === "rate_limited") return "The channel is busy. Wait a moment, then send again.";
  if (err.code === "not_granted") return "Permission to contact Claude wasn't granted, so the GM can't reply here.";
  return `The transmission failed: ${err.message ?? "unknown error"}. Try again.`;
}

function Reply({ t, scenario }: { t: Transmission; scenario: Scenario }) {
  const name = (id: string) => scenario.factions.find((f) => f.id === id)?.name ?? id;
  return (
    <div className="reply">
      <p className="tx-meta">Incoming transmission · {t.from}</p>
      <h3 className="sub">{t.subject}</h3>
      {t.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
      {t.offline && <p className="muted small-text">Standard acknowledgement: the AI game master wasn't available.</p>}
      {(t.changes?.length ?? 0) > 0 && (
        <ul className="changes">
          {t.changes!.map((c) => (
            <li key={c.factionId} className={c.to > c.from ? "up" : "down"}>
              {name(c.factionId)}: {standingLabel(c.from)} → {standingLabel(c.to)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReinforcementForm({ p, state, rules, catalogue, locked, setState }: { p: Extract<Prompt, { kind: "reinforcement" }>; state: GameState; rules: FleetRules; catalogue: ShipClass[]; locked: boolean; setState: Props["setState"] }) {
  const saved = readLines(state, p.id);
  const lines: RequestLine[] = p.slots.map((slot) => saved.find((l) => l.id === slot.id) ?? { id: slot.id, category: slot.categories.length === 1 ? slot.categories[0] : "", count: slot.count, preferredClassId: "", purpose: "" });
  const set = (id: string, patch: Partial<RequestLine>) => {
    const next = lines.map((l) => (l.id === id ? { ...l, ...patch } : l));
    setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: JSON.stringify(next) } }));
  };
  const label = (id: string) => rules.categories.find((c) => c.id === id)?.label ?? id;
  return (
    <ol className="req-lines">
      {p.slots.map((slot) => {
        const l = lines.find((x) => x.id === slot.id)!;
        const pool = catalogue.filter((c) => c.category === l.category);
        return (
          <li key={slot.id} className="req-line">
            <div className="req-top"><strong className="req-cat">{slot.label}</strong></div>
            <div className="req-fields">
              {slot.categories.length > 1 && (
                <label>
                  <span>Type</span>
                  <select value={l.category} disabled={locked} onChange={(e) => set(slot.id, { category: e.target.value, preferredClassId: "" })}>
                    <option value="">Choose…</option>
                    {slot.categories.map((c) => <option key={c} value={c}>{label(c)}</option>)}
                  </select>
                </label>
              )}
              <label>
                <span>Preferred class</span>
                <select value={l.preferredClassId} disabled={locked || !l.category} onChange={(e) => set(slot.id, { preferredClassId: e.target.value })}>
                  <option value="">No preference</option>
                  {pool.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.availability}, ~{Math.round(grantChance(rules, c) * 100)}%)</option>)}
                </select>
              </label>
              <label className="grow">
                <span>What are they for?</span>
                <input value={l.purpose} disabled={locked} onChange={(e) => set(slot.id, { purpose: e.target.value })} />
              </label>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function StageView({ scenario, stage, state, byId, setState, onContinue, nextLabel, nextReady, rules, catalogue, isLast, dev }: Props) {
  const [busy, setBusy] = useState("");
  const [, bump] = useState(0);
  const [error, setError] = useState<{ key: string; text: string } | null>(null);

  const units: Unit[] = [];
  if (stage.review && stage.prompts?.length) {
    units.push({
      key: stage.id, from: stage.review.from, title: "Your orders", text: "",
      prompts: stage.prompts, outcomes: stage.review.outcomes, defaultOutcomeId: stage.review.defaultOutcomeId, gmNotes: stage.review.gmNotes,
    });
  }
  for (const ev of stage.events ?? []) {
    if (!conditionsMet(state, ev.conditions, byId)) continue;
    units.push({
      key: `${stage.id}:${ev.id}`, eventId: ev.id, from: ev.from ?? "", title: ev.title, text: ev.text,
      prompts: ev.prompts.filter((p) => SUPPORTED.includes(p.kind)),
      outcomes: ev.outcomes, defaultOutcomeId: ev.defaultOutcomeId, onEnter: ev.onEnter,
      gmNotes: [ev.gmNotes, ...(ev.conditionalNotes ?? []).filter((n) => conditionsMet(state, n.conditions, byId)).map((n) => n.note), ...(ev.recall ?? []).map((r) => `${r.label}: ${(state.answers[r.promptId] ?? "").trim() || "(the admiral gave none)"}`)].filter(Boolean).join("\n- "),
    });
  }
  const unsupported = (stage.events ?? []).some((ev) => ev.prompts.some((p) => !SUPPORTED.includes(p.kind)));

  // A unit is complete once answered, and any ships it added have duties.
  const added = (u: Unit) => state.fleet.filter((f) => u.prompts.some((p) => p.kind === "reinforcement" && p.id === f.addedIn));
  const complete = (u: Unit) => !!state.submitted[u.key] && (added(u).length === 0 || checkAssignments(added(u)).ok);
  const lostText = (u: Unit, text: string) => {
    const names = state.departed.filter((d) => d.lostIn === u.key).map((d) => `the ${d.name} (${byId[d.classId]?.name ?? d.classId} class)`);
    return text.replace("{lost}", names.length ? names.join(" and ") : "one of your ships");
  };
  const firstOpen = units.findIndex((u) => !complete(u));
  const allDone = firstOpen === -1;

  const send = async (u: Unit) => {
    setBusy(u.key);
    setError(null);
    try {
      let working = state;
      if (!state.submitted[`${u.key}:alloc`]) saveUndo(u.key, state);
      const rp = u.prompts.find((p) => p.kind === "reinforcement");
      if (rp && !state.submitted[`${u.key}:alloc`]) {
        const allocated = allocateFleet(rules, { disposition: "", lines: readLines(state, rp.id) }, catalogue, rp.id, 0, Math.random, [...state.fleet, ...state.departed])
          .map((f) => ({ ...f, uid: uid(), assignment: "" }));
        const newShips = crewShips(scenario, state, allocated, byId);
        working = { ...working, fleet: [...working.fleet, ...newShips], submitted: { ...working.submitted, [`${u.key}:alloc`]: true } };
        const w = working;
        setState(() => w);
      }
      const r = await resolve(scenario, working, byId, {
        stage, event: u.eventId ? stage.events?.find((e) => e.id === u.eventId) : undefined,
        from: u.from, title: u.title, situation: lostText(u, u.text) || stage.briefing, prompts: u.prompts,
        outcomes: u.outcomes, defaultOutcomeId: u.defaultOutcomeId, gmNotes: u.gmNotes,
      });
      setState((s) => {
        // Ship moves and new characters from the GM, then the outcome's effects.
        const moved = s.fleet.map((f) => {
          const up = r.shipUpdates?.find((x) => x.ship.toLowerCase() === f.name.toLowerCase());
          return up ? { ...f, location: up.location, task: up.task || f.task } : f;
        });
        const base = { ...s, fleet: moved, cast: [...s.cast, ...(r.newCharacters ?? []).filter((c) => !s.cast.some((x) => x.name === c.name))] };
        const after = applyEffects(base, r.outcome.effects, stage.id, byId);
        const t: Transmission = {
          stageId: stage.id, eventId: u.eventId, outcomeId: r.outcome.id, outcomeLabel: r.outcome.label,
          from: u.from, subject: r.subject, body: r.body, offline: r.offline,
          changes: standingChanges(base, after),
        };
        return {
          ...after,
          transmissions: [...after.transmissions.filter((x) => !(x.stageId === stage.id && x.eventId === u.eventId)), t],
          log: [...after.log, { stageId: stage.id, text: `${u.title}: ${r.outcome.label}` }],
          submitted: { ...after.submitted, [u.key]: true },
        };
      });
    } catch (e) {
      setError({ key: u.key, text: errorText(e) });
    } finally {
      setBusy("");
    }
  };

  // Entry effects (e.g. a ship lost before the player responds) apply once, when the unit opens.
  const openUnit = units[firstOpen];
  const openKey = openUnit?.key;
  useEffect(() => {
    if (openUnit && !state.submitted[`${openUnit.key}:seen`]) setState((s) => ({ ...s, submitted: { ...s.submitted, [`${openUnit.key}:seen`]: true } }));
    if (!openUnit?.onEnter?.length) return;
    setState((s) => s.submitted[`${openUnit.key}:entered`] ? s : {
      ...applyEffects(s, openUnit.onEnter, stage.id, byId, openUnit.key),
      submitted: { ...s.submitted, [`${openUnit.key}:entered`]: true },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

  // Testing only: put the state back to just before the latest scene was sent, keeping the typed answer.
  const undo = dev ? readUndo(state.scenarioId) : null;
  const revise = (u: Unit) => {
    if (!undo || undo.key !== u.key) return;
    const keep = Object.fromEntries(u.prompts.map((p) => [p.id, state.answers[p.id] ?? ""]));
    setState(() => ({ ...undo.state, answers: { ...undo.state.answers, ...keep } }));
    clearUndo(state.scenarioId);
    bump((n) => n + 1);
  };

  // End of the scenario: the review of the whole posting, requested once.
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const requestReview = async () => {
    setReviewBusy(true);
    setReviewError("");
    try {
      const t = await writeReview(scenario, state, byId);
      setState((s) => ({ ...s, review: t }));
    } catch (e) {
      setReviewError(errorText(e));
    } finally {
      setReviewBusy(false);
    }
  };
  useEffect(() => {
    if (allDone && isLast && !state.review && !reviewBusy && !reviewError) requestReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, isLast]);

  const departedHere = state.departed.filter((d) => state.log.some((l) => l.stageId === stage.id && l.text.startsWith(d.name)));

  return (
    <>
      <section className="card briefing">
        <h2>{stage.title}</h2>
        <p className="lead">{stage.briefing}</p>
        {departedHere.length > 0 && (
          <div className="departed">
            <h3 className="sub">No longer under your command</h3>
            <ul>{departedHere.map((d) => <li key={d.uid}><b>{d.name}</b> ({byId[d.classId]?.name} class) · {d.reason}</li>)}</ul>
          </div>
        )}
        {units.length > 1 && (
          <ol className="unit-steps">
            {units.map((u, i) => <li key={u.key} className={complete(u) ? "done" : i === firstOpen ? "now" : ""}>{u.title}</li>)}
          </ol>
        )}
      </section>

      {units.map((u, i) => {
        if (i > firstOpen && firstOpen !== -1) return null;
        const done = !!state.submitted[u.key];
        const reply = state.transmissions.find((t) => t.stageId === stage.id && t.eventId === u.eventId);
        const ready = u.prompts.every((p) => p.kind === "reinforcement"
          ? p.slots.every((slot) => { const l = readLines(state, p.id).find((x) => x.id === slot.id); return !!l?.category && !!l.purpose.trim(); })
          : (state.answers[p.id] ?? "").trim().length > 0);
        const newShips = added(u);
        return (
          <section key={u.key} className={`card event${done ? " resolved" : ""}`}>
            {u.eventId ? (
              <>
                <p className="tx-meta">{u.from ? `Report · ${u.from}` : "Report"}</p>
                <h2>{u.title}</h2>
                <p>{lostText(u, u.text)}</p>
              </>
            ) : (
              <h2><span className="step">{i + 1}</span>{u.title}</h2>
            )}
            {u.prompts.map((p) => (
              <div key={p.id} className="field">
                <span>{p.text}</span>
                {p.kind === "reinforcement" ? (
                  <ReinforcementForm p={p} state={state} rules={rules} catalogue={catalogue} locked={done || busy === u.key} setState={setState} />
                ) : p.kind === "ship-choice" ? (
                  <div className="orbit" role="radiogroup">
                    {state.fleet.map((f) => (
                      <label key={f.uid} className={`radio${state.answers[p.id] === f.name ? " on" : ""}`}>
                        <input type="radio" name={p.id} disabled={done} checked={state.answers[p.id] === f.name} onChange={() => setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: f.name } }))} />
                        {f.name} <span className="muted">· {byId[f.classId]?.name}</span>
                      </label>
                    ))}
                  </div>
                ) : p.kind === "choice" ? (
                  <div className="orbit" role="radiogroup">
                    {p.options.map((o) => (
                      <label key={o.id} className={`radio${state.answers[p.id] === o.label ? " on" : ""}`}>
                        <input type="radio" name={p.id} disabled={done} checked={state.answers[p.id] === o.label} onChange={() => setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: o.label } }))} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea rows={"short" in p && p.short ? 3 : 5} placeholder={"short" in p && p.short ? "A few sentences" : undefined} value={state.answers[p.id] ?? ""} disabled={done || busy === u.key} onChange={(e) => setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: e.target.value } }))} aria-label={p.text} />
                )}
              </div>
            ))}
            {!done && (
              <>
                <button type="button" className="btn primary" disabled={!ready || !!busy} onClick={() => send(u)}>
                  {busy === u.key ? "Awaiting reply…" : "Send orders"}
                </button>
                {error?.key === u.key && <p className="error" role="alert">{error.text}</p>}
              </>
            )}
            {reply && <Reply t={reply} scenario={scenario} />}
            {dev && done && undo?.key === u.key && (
              <button type="button" className="btn ghost small dev" onClick={() => revise(u)}>Revise this answer (testing)</button>
            )}
            {done && newShips.length > 0 && (
              <div className="new-ships">
                <h3 className="sub">New arrivals</h3>
                <p>Give each new ship a duty and a primary mission.</p>
                <AssignedFleet fleet={newShips} byId={byId} assignments={rules.assignments} locked={false}
                  onChange={(changed) => setState((s) => ({ ...s, fleet: s.fleet.map((f) => changed.find((c) => c.uid === f.uid) ?? f) }))} />
              </div>
            )}
          </section>
        );
      })}

      {allDone && isLast && (
        <section className="card transmission">
          <p className="tx-meta">Scenario complete</p>
          <h2>{scenario.title}: command handed over</h2>
          <p>Your time in {scenario.title} is done. Where things stand as you leave:</p>
          <ul className="changes">
            {activeFactions(scenario, state).map((f) => <li key={f.id}>{f.name}: {standingLabel(state.standings[f.id] ?? 0)}</li>)}
          </ul>
          <p className="muted small-text">{state.fleet.length} ships remain in the sector; {state.departed.length} left your command along the way. Sector Beta comes in a later build. Your game is saved.</p>
        </section>
      )}
      {allDone && isLast && (
        <section className="card transmission review">
          <p className="tx-meta">Review of your posting · {scenario.debrief?.from ?? "Starfleet Command"}</p>
          {state.review ? (
            <>
              <h2>{state.review.subject}</h2>
              {state.review.body.split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
              {state.review.offline && <button type="button" className="btn ghost small" onClick={requestReview}>Request the full review</button>}
            </>
          ) : reviewBusy ? (
            <p className="muted">Starfleet Command is reviewing your reports…</p>
          ) : (
            <>
              {reviewError && <p className="error" role="alert">{reviewError}</p>}
              <button type="button" className="btn primary" onClick={requestReview}>Request your review</button>
            </>
          )}
          {dev && state.review && <button type="button" className="btn ghost small dev" onClick={() => setState((s) => ({ ...s, review: undefined }))}>Clear review (testing)</button>}
        </section>
      )}
      {allDone && !isLast && (
        <section className="card transmit">
          {unsupported && <p className="muted small-text">Some parts of this stage aren't playable yet.</p>}
          <button type="button" className="btn primary" disabled={!nextReady} onClick={onContinue}>{nextLabel}</button>
          {!nextReady && <p className="muted small-text">The next stage comes in a later build. Your answers are saved.</p>}
        </section>
      )}
    </>
  );
}
