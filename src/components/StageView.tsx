import { useEffect, useState } from "react";
import type { Prompt, Scenario, Stage } from "../engine/scenarioTypes";
import type { ShipClass } from "../engine/shipTypes";
import type { GameState, Transmission } from "../engine/state";
import { applyEffects, conditionsMet, standingChanges, standingLabel } from "../engine/state";
import { resolve } from "../engine/gm";

interface Props {
  scenario: Scenario;
  stage: Stage;
  state: GameState;
  byId: Record<string, ShipClass>;
  setState: (fn: (s: GameState) => GameState) => void;
  onContinue: () => void;
  nextLabel: string;
  nextReady: boolean;
}

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

export function StageView({ scenario, stage, state, byId, setState, onContinue, nextLabel, nextReady }: Props) {
  const [busy, setBusy] = useState("");
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
      prompts: ev.prompts.filter((p) => p.kind === "free-text" || p.kind === "choice"),
      outcomes: ev.outcomes, defaultOutcomeId: ev.defaultOutcomeId, gmNotes: ev.gmNotes, onEnter: ev.onEnter,
    });
  }
  const unsupported = (stage.events ?? []).some((ev) => ev.prompts.some((p) => p.kind !== "free-text" && p.kind !== "choice"));

  const firstOpen = units.findIndex((u) => !state.submitted[u.key]);
  const allDone = firstOpen === -1;

  const send = async (u: Unit) => {
    setBusy(u.key);
    setError(null);
    try {
      const working = state;
      const r = await resolve(scenario, working, byId, {
        stage, event: u.eventId ? stage.events?.find((e) => e.id === u.eventId) : undefined,
        from: u.from, title: u.title, situation: u.text || stage.briefing, prompts: u.prompts,
        outcomes: u.outcomes, defaultOutcomeId: u.defaultOutcomeId, gmNotes: u.gmNotes,
      });
      setState((s) => {
        const base = s;
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
    if (!openUnit?.onEnter?.length) return;
    setState((s) => s.submitted[`${openUnit.key}:entered`] ? s : {
      ...applyEffects(s, openUnit.onEnter, stage.id, byId),
      submitted: { ...s.submitted, [`${openUnit.key}:entered`]: true },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openKey]);

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
            {units.map((u, i) => <li key={u.key} className={state.submitted[u.key] ? "done" : i === firstOpen ? "now" : ""}>{u.title}</li>)}
          </ol>
        )}
      </section>

      {units.map((u, i) => {
        if (i > firstOpen && firstOpen !== -1) return null;
        const done = !!state.submitted[u.key];
        const reply = state.transmissions.find((t) => t.stageId === stage.id && t.eventId === u.eventId);
        const ready = u.prompts.every((p) => (state.answers[p.id] ?? "").trim().length > 0);
        return (
          <section key={u.key} className={`card event${done ? " resolved" : ""}`}>
            {u.eventId ? (
              <>
                <p className="tx-meta">{u.from ? `Report · ${u.from}` : "Report"}</p>
                <h2>{u.title}</h2>
                <p>{u.text}</p>
              </>
            ) : (
              <h2><span className="step">{i + 1}</span>{u.title}</h2>
            )}
            {u.prompts.map((p) => (
              <div key={p.id} className="field">
                <span>{p.text}</span>
                {p.kind === "choice" ? (
                  <div className="orbit" role="radiogroup">
                    {p.options.map((o) => (
                      <label key={o.id} className={`radio${state.answers[p.id] === o.label ? " on" : ""}`}>
                        <input type="radio" name={p.id} disabled={done} checked={state.answers[p.id] === o.label} onChange={() => setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: o.label } }))} />
                        {o.label}
                      </label>
                    ))}
                  </div>
                ) : (
                  <textarea rows={5} value={state.answers[p.id] ?? ""} disabled={done || busy === u.key} onChange={(e) => setState((s) => ({ ...s, answers: { ...s.answers, [p.id]: e.target.value } }))} aria-label={p.text} />
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
          </section>
        );
      })}

      {allDone && (
        <section className="card transmit">
          {unsupported && <p className="muted small-text">Some parts of this stage aren't playable yet.</p>}
          <button type="button" className="btn primary" disabled={!nextReady} onClick={onContinue}>{nextLabel}</button>
          {!nextReady && <p className="muted small-text">The next stage comes in a later build. Your answers are saved.</p>}
        </section>
      )}
    </>
  );
}
