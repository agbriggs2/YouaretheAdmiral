import type { Outcome, Scenario, Stage } from "./scenarioTypes";
import type { ShipClass } from "./shipTypes";
import type { GameState, Transmission } from "./state";
import { standingLabel } from "./state";

/* The platform's "ask Claude" capability. Absent outside claude.ai. */
type SampleFn = (input: string, opts?: Record<string, unknown>) => Promise<{ text: string }>;
declare global {
  interface Window { claude?: { use: (name: string) => Promise<unknown> } }
}

let samplePromise: Promise<SampleFn | null> | null = null;
export function getSample(): Promise<SampleFn | null> {
  if (!samplePromise) {
    samplePromise = window.claude?.use
      ? (window.claude.use("sample") as Promise<SampleFn | null>).catch(() => null)
      : Promise.resolve(null);
  }
  return samplePromise;
}

type ById = Record<string, ShipClass>;

function header(s: Scenario, state: GameState, extraRules: string[]): string {
  const factions = s.factions.map((f) => {
    const facts = [f.status, f.government, f.population && `population ${f.population}`, f.technology].filter(Boolean).join("; ");
    return `- ${f.name} (${facts}). Current standing with the Federation: ${standingLabel(state.standings[f.id] ?? 0)}. ${(f.traits ?? []).join(" ")}`;
  }).join("\n");
  return `You are the game master for "${s.title}", a Star Trek "You're the Admiral" scenario set in ${s.year}. The player is a ${s.playerRole.rank} serving as ${s.playerRole.title}.

RULES FOR YOU
- ${s.gm.improvisation}
- Tone: ${s.gm.tone}
- There is no answer key. Many different plans are reasonable; judge the player's reasoning on its own merits.
${(s.gm.notes ?? []).map((n) => `- ${n}`).join("\n")}
${extraRules.map((n) => `- ${n}`).join("\n")}
- Never reveal hidden information, and never mention game mechanics, outcomes, odds or ratings to the player.

SETTING
${s.setting.overview}
${s.setting.assumptions.map((a) => `- ${a}`).join("\n")}

FACTIONS
${factions}`;
}

function answersText(s: Scenario, stage: Stage, state: GameState, byId: ById): string {
  const sb = state.starbase;
  const loc = s.locations.find((l) => l.id === sb.locationId);
  const req = state.fleetRequest;
  const catLabel = (id: string) => s.resources.fleet?.categories.find((c) => c.id === id)?.label ?? id;
  const requestText = req.lines.map((l) => `- ${l.count} × ${catLabel(l.category)}${l.preferredClassId ? ` (prefers ${byId[l.preferredClassId]?.name ?? l.preferredClassId} class)` : ""}: ${l.purpose}`).join("\n");
  const answers = (stage.prompts ?? []).filter((p) => p.kind === "free-text").map((p) => `${p.text}\n${state.answers[p.id] || "(no answer)"}`).join("\n\n");
  return [
    answers,
    `Starbase: ${loc ? loc.name : "not chosen"}${sb.orbit ? `, ${sb.orbit.replace("-", " ")}` : ""}. Reasoning: ${sb.reasoning || "(none given)"}`,
    `Fleet disposition requested: ${req.disposition || "(none)"}\nShip requests:\n${requestText || "(none)"}`,
  ].join("\n\n");
}

function fleetText(state: GameState, byId: ById): string {
  return state.fleet.map((f) => {
    const c = byId[f.classId];
    return `- ${f.name}, ${c?.name ?? f.classId} class (${c?.type ?? ""}; ${c?.status ?? ""}). Requested as: ${f.requested ?? "n/a"}.${f.substituted ? " SUBSTITUTE: the preferred class could not be spared." : ""}`;
  }).join("\n");
}

function outcomeList(outcomes: Outcome[]): string {
  return outcomes.map((o) => `- id "${o.id}" (${o.label}): ${o.criteria}`).join("\n");
}

function parseJson(text: string): Record<string, unknown> | null {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

/** Step 1: the GM grades the stage's answers by picking one authored outcome. */
export async function gradeStage(s: Scenario, stage: Stage, state: GameState, byId: ById): Promise<Outcome> {
  const r = stage.review!;
  const def = r.outcomes.find((o) => o.id === r.defaultOutcomeId) ?? r.outcomes[0];
  const sample = await getSample();
  if (!sample) return def;
  const prompt = `${header(s, state, [])}

STAGE: ${stage.title}
${stage.briefing}

THE PLAYER'S ANSWERS
${answersText(s, stage, state, byId)}

YOUR TASK
Decide which one outcome below best fits the quality of the player's reasoning. Be fair but discerning: reserve the top outcome for answers that are genuinely well considered.

OUTCOMES
${outcomeList(r.outcomes)}

Respond with only a JSON object: {"outcomeId": "<one id from the list>", "reason": "<one sentence>"}`;
  const res = await sample(prompt, { modelTier: "default", cache: false });
  const data = parseJson(res.text);
  return r.outcomes.find((o) => o.id === data?.outcomeId) ?? def;
}

/** Step 2: the GM writes the in-character reply for an outcome already chosen. */
export async function writeReply(s: Scenario, stage: Stage, state: GameState, byId: ById, outcome: Outcome, extraNotes: string[]): Promise<Transmission> {
  const r = stage.review!;
  const base = { stageId: stage.id, outcomeId: outcome.id, outcomeLabel: outcome.label, from: r.from };
  const sample = await getSample();
  if (!sample) {
    return {
      ...base,
      subject: "Plan received",
      body: `Admiral, Starfleet Command has received your plan for ${s.title} and approved it. Your ships have been assigned as listed below. A full assessment will follow.`,
      offline: true,
    };
  }
  const prompt = `${header(s, state, [r.gmNotes ?? "", ...extraNotes].filter(Boolean))}

STAGE: ${stage.title}
${stage.briefing}

THE PLAYER'S ANSWERS
${answersText(s, stage, state, byId)}

SHIPS STARFLEET HAS ASSIGNED (already decided; announce exactly these)
${fleetText(state, byId) || "(none)"}

YOUR TASK
Write the in-character reply from ${r.from}, addressed to the admiral. The assessment has been decided: ${outcome.label}. ${outcome.reactions ?? ""}
Refer to specific things the player wrote. Announce the assigned ships and give a one-sentence reason for any substitution. Under 300 words, plain text, short paragraphs, no headings or bullet points.

Respond with only a JSON object: {"subject": "<short message subject>", "body": "<the in-character message>"}`;
  const res = await sample(prompt, { modelTier: "default", cache: false });
  const data = parseJson(res.text);
  return {
    ...base,
    subject: typeof data?.subject === "string" ? data.subject : stage.title,
    body: typeof data?.body === "string" ? data.body : res.text,
  };
}
