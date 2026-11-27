import type { GameEvent, Outcome, Prompt, Scenario, Stage } from "./scenarioTypes";
import type { ShipClass } from "./shipTypes";
import type { GameState, Transmission } from "./state";
import type { CastMember } from "./state";
import { TRANSIT, activeFactions, castSeen, locationName, readLines, standingLabel } from "./state";

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
  const factions = activeFactions(s, state).map((f) => {
    const facts = [f.status, f.government, f.population && `population ${f.population}`, f.technology].filter(Boolean).join("; ");
    return `- ${f.name} (${facts}). Current standing with the Federation: ${standingLabel(state.standings[f.id] ?? 0)}. ${(f.traits ?? []).join(" ")}`;
  }).join("\n");
  return `You are the game master for "${s.title}", a Star Trek "You're the Admiral" scenario set in ${s.year}. The player is a ${s.playerRole.rank} serving as ${s.playerRole.title}.

RULES FOR YOU
- ${s.gm.improvisation}
- Tone: ${s.gm.tone}
- There is no answer key. Many different plans are reasonable; judge the player's reasoning on its own merits.
${(s.gm.notes ?? []).filter((n) => typeof n === "string" || s.stages.findIndex((st) => st.id === n.fromStage) <= state.stageIndex).map((n) => `- ${typeof n === "string" ? n : n.text}`).join("\n")}
${extraRules.map((n) => `- ${n}`).join("\n")}
- Never reveal hidden information, and never mention game mechanics, outcomes, odds or ratings to the player.
- Assume the admiral keeps Starfleet Command informed as a matter of routine. Never mark an answer down, and never have a character point out, that the admiral didn't mention reporting to Starfleet, unless the question expressly asks for a report.

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
    return `- ${f.name}, ${c?.name ?? f.classId} class (${c?.type ?? ""}; ${c?.status ?? ""}), registry ${f.registry ?? "unassigned"}, commanded by Captain ${f.captain ?? "(unnamed)"}. Requested as: ${f.requested ?? "n/a"}.${f.substituted ? " SUBSTITUTE: the preferred class could not be spared." : ""}`;
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

// ── Later stages: one call picks the outcome and writes the reply ──

function campaignSoFar(s: Scenario, state: GameState, byId: ById): string {
  const sb = s.locations.find((l) => l.id === state.starbase.locationId);
  const fleet = state.fleet.map((f) => {
    const c = byId[f.classId];
    const r = c?.ratings;
    return `- ${f.name}, ${c?.name ?? f.classId} class (${c?.type ?? ""}; firepower ${r?.firepower}, defense ${r?.defense}, speed ${r?.speed}, sensors ${r?.sensors}, science ${r?.science}, logistics ${r?.logistics}). Registry ${f.registry ?? "unassigned"}. Captain ${f.captain ?? "(unnamed)"}. Duty: ${f.assignment || "none"}. Mission: ${f.mission || "none"}. NOW AT: ${locationName(s, f.location)}. CURRENT TASK: ${f.task || "none"}.`;
  }).join("\n");
  const departed = state.departed.map((d) => `- ${d.name} (${byId[d.classId]?.name ?? d.classId} class): ${d.reason}`).join("\n");
  const history = state.transmissions.map((t) => `- ${t.subject} (from ${t.from}): outcome "${t.outcomeLabel}"`).join("\n");
  const priorities = (state.answers["q1-priorities"] ?? "").slice(0, 1200);
  return `THE CAMPAIGN SO FAR
Admiral's stated priorities (from the first stage): ${priorities || "(none)"}
Starbase: ${sb ? sb.name : "none"}${state.starbase.orbit ? `, ${state.starbase.orbit.replace("-", " ")}` : ""}.
Current fleet (only these ships exist; orders naming other ships cannot be carried out). Each ship's position and task are current: a ship can only act where it is, or after travelling there.
${fleet || "(none)"}
${departed ? `Ships no longer available:\n${departed}\n` : ""}Earlier results:
${history || "(none)"}`;
}

function castText(s: Scenario, state: GameState): string {
  const people = castSeen(s, state);
  if (!people.length) return "";
  return `PEOPLE AND PLACES ALREADY IN THE STORY (reuse these names for these roles; never give a second person the same role or name; ship captains are listed with the fleet)
${people.map((p) => `- ${p.name}: ${p.role}`).join("\n")}`;
}

function locationIds(s: Scenario): string {
  return [...s.locations.map((l) => `"${l.id}" (${l.name})`), `"${TRANSIT}" (in transit between locations)`].join(", ");
}

export interface ShipUpdate { ship: string; location: string; task: string }

/** Read the GM's proposed ship moves and new characters, keeping only valid ones. */
function extras(s: Scenario, state: GameState, data: Record<string, unknown> | null): { shipUpdates: ShipUpdate[]; newCharacters: CastMember[] } {
  const ids = new Set([...s.locations.map((l) => l.id), TRANSIT]);
  const names = new Set(state.fleet.map((f) => f.name.toLowerCase()));
  const ups = Array.isArray(data?.shipUpdates) ? (data!.shipUpdates as Record<string, unknown>[]) : [];
  const shipUpdates = ups.filter((u) => typeof u?.ship === "string" && names.has((u.ship as string).toLowerCase()) && typeof u.location === "string" && ids.has(u.location as string))
    .map((u) => ({ ship: u.ship as string, location: u.location as string, task: typeof u.task === "string" ? (u.task as string).slice(0, 120) : "" }));
  const known = new Set(castSeen(s, state).map((c) => c.name.toLowerCase()));
  const chars = Array.isArray(data?.newCharacters) ? (data!.newCharacters as Record<string, unknown>[]) : [];
  const newCharacters = chars.filter((c) => typeof c?.name === "string" && typeof c.role === "string" && !known.has((c.name as string).toLowerCase()))
    .map((c) => ({ name: (c.name as string).slice(0, 60), role: (c.role as string).slice(0, 100), source: "gm" as const }));
  return { shipUpdates, newCharacters };
}

const EXTRAS_SPEC = `"shipUpdates": [{"ship": "<exact ship name from the fleet>", "location": "<location id>", "task": "<what it is doing now, under 12 words>"}] for every ship whose position or task changes because of these orders (an empty list if none), and "newCharacters": [{"name": "<full name>", "role": "<who they are, a few words>"}] for any named person your reply introduces who isn't already listed (an empty list if none)`;

function secretsText(s: Scenario, state: GameState): string {
  // Only secrets introduced up to the current stage; later ones don't exist yet.
  // A secret tied to a scene stays unknown until that scene opens.
  const opened = (key?: string) => !key || !!(state.submitted[key] || state.submitted[`${key}:seen`] || state.submitted[`${key}:entered`]);
  const all = s.stages.slice(0, state.stageIndex + 1).flatMap((st) => st.secrets ?? []).filter((x) => opened(x.introducedIn) || state.revealed.includes(x.id));
  if (!all.length) return "";
  const lines = all.map((x) => state.revealed.includes(x.id)
    ? `- REVEALED, may be discussed: ${x.truth}`
    : x.coverStory ? `- What everyone currently believes (keep to this; nothing more is known): ${x.coverStory}` : "").filter(Boolean);
  return lines.length ? `KNOWN SITUATION\n${lines.join("\n")}` : "";
}

export interface ResolveInput {
  stage: Stage;
  event?: GameEvent;
  from: string;
  title: string;
  situation: string;
  prompts: Prompt[];
  outcomes: Outcome[];
  defaultOutcomeId: string;
  gmNotes?: string;
}

/** Pick one authored outcome for the player's orders and write the in-character reply. */
export async function resolve(s: Scenario, state: GameState, byId: ById, inp: ResolveInput): Promise<{ outcome: Outcome; subject: string; body: string; offline?: boolean; shipUpdates?: ShipUpdate[]; newCharacters?: CastMember[] }> {
  const def = inp.outcomes.find((o) => o.id === inp.defaultOutcomeId) ?? inp.outcomes[0];
  const sample = await getSample();
  if (!sample) {
    return { outcome: def, subject: inp.title, body: `Admiral, your orders have been received and are being carried out.`, offline: true };
  }
  const catLabel = (id: string) => s.resources.fleet?.categories.find((c) => c.id === id)?.label ?? id;
  const answerText = (p: Prompt): string => {
    if (p.kind === "reinforcement") {
      const req = readLines(state, p.id).map((l) => `- ${l.count} × ${catLabel(l.category)}${l.preferredClassId ? ` (prefers ${byId[l.preferredClassId]?.name ?? l.preferredClassId})` : ""}: ${l.purpose}`).join("\n");
      const got = state.fleet.filter((f) => f.addedIn === p.id).map((f) => `- ${f.name}, ${byId[f.classId]?.name ?? f.classId} class. Requested as: ${f.requested ?? ""}.${f.substituted ? " SUBSTITUTE: the preferred class could not be spared." : ""}`).join("\n");
      return `Requested:\n${req || "(none)"}\nShips Starfleet has sent (already decided; announce exactly these and give a one-sentence reason for any substitution):\n${got || "(none)"}`;
    }
    return state.answers[p.id] || "(no answer)";
  };
  const orders = inp.prompts.map((p) => `${p.text}\n${answerText(p)}`).join("\n\n");
  const brief = inp.prompts.some((p) => p.kind === "free-text" && p.short);
  // A compact picture of the present, so reports and assessments can be judged against reality.
  const standingsNow = activeFactions(s, state).map((f) => `- ${f.name}: ${standingLabel(state.standings[f.id] ?? 0)} (${state.standings[f.id] ?? 0} on a scale of -3 to +3)`).join("\n");
  const resultsSoFar = state.log.filter((l) => !l.text.includes("Reassigned")).map((l) => `- ${l.text}`).join("\n");
  // Continuity: earlier scenes of this stage, with the admiral's answers and the replies.
  const earlier = state.transmissions.filter((t) => t.stageId === inp.stage.id).map((t) => {
    const ev = inp.stage.events?.find((e) => e.id === t.eventId);
    const ps = ev ? ev.prompts : (inp.stage.prompts ?? []);
    const ans = ps.map((p) => state.answers[p.id]).filter(Boolean).join(" / ");
    return `- ${ev?.title ?? "Stage orders"}. Admiral: ${ans.slice(0, 500)}\n  Reply from ${t.from}: ${t.body.slice(0, 700)}`;
  }).join("\n");
  const prompt = `${header(s, state, [inp.gmNotes ?? ""].filter(Boolean))}

${campaignSoFar(s, state, byId)}

${secretsText(s, state)}

${castText(s, state)}

CURRENT STAGE: ${inp.stage.title}
${inp.stage.briefing}
${earlier ? `\nEARLIER IN THIS STAGE (stay consistent with these)\n${earlier}\n` : ""}
WHERE THINGS STAND NOW
Relations with the Federation:
${standingsNow}
Results so far (scene: outcome):
${resultsSoFar || "(none)"}

SITUATION: ${inp.title}${inp.from ? ` (reported by ${inp.from})` : ""}
${inp.situation}

THE ADMIRAL'S ORDERS
${orders}

YOUR TASK
1. Decide which one outcome below best fits the admiral's orders. Judge the reasoning and whether the ships named can plausibly do what is asked, given their duties and capabilities. When the admiral gives an assessment or report, judge whether it fits WHERE THINGS STAND NOW, not whether it ticks every box in the question. Pick the closest outcome; it doesn't have to match perfectly. Be fair, not flattering: characters can be unhappy, and a sound decision can still disappoint someone.
2. Write the in-character reply from ${inp.from || "the relevant party"} (or the captain carrying out the orders, if more fitting), addressed to the admiral, showing how events unfold under that outcome. Refer to specific ships and details from the orders. The reply must reflect everything the admiral actually ordered or offered, even under an unfavourable outcome: never contradict or ignore it (for example, don't have characters still short of supplies the admiral just sent). Do not state any standing changes or game terms. ${brief ? "This is one scene in a fast-moving sequence and the admiral's orders are brief: reply in under 140 words, as a live exchange, and do not jump ahead to later events." : "Under 250 words."} Plain text, short paragraphs, no headings or bullet points.
3. Update the ship board: for each ship whose position or task changes because of these orders, give its new location (one of: ${locationIds(s)}) and its current task. A ship ordered somewhere far away is "${TRANSIT}" with a task like "En route to Lysara". Ships not mentioned stay as they are.

OUTCOMES
${inp.outcomes.map((o) => `- id "${o.id}" (${o.label}): ${o.criteria} How characters react: ${o.reactions ?? ""}`).join("\n")}

Respond with only a JSON object: {"outcomeId": "<one id from the list>", "subject": "<short message subject>", "body": "<the in-character message>", ${EXTRAS_SPEC}}`;
  const res = await sample(prompt, { modelTier: "default", cache: false });
  const data = parseJson(res.text);
  const outcome = inp.outcomes.find((o) => o.id === data?.outcomeId) ?? def;
  return {
    outcome,
    subject: typeof data?.subject === "string" ? data.subject : inp.title,
    body: typeof data?.body === "string" ? data.body : res.text,
    ...extras(s, state, data),
  };
}

// ── End of the sector: a review of the whole posting ──

function campaignRecord(s: Scenario, state: GameState): string {
  const lines: string[] = [];
  for (const st of s.stages.slice(0, state.stageIndex + 1)) {
    const units = [{ id: undefined as string | undefined, title: "Plan and orders", prompts: st.prompts ?? [] }, ...(st.events ?? []).map((e) => ({ id: e.id as string | undefined, title: e.title, prompts: e.prompts }))];
    lines.push(`${st.title}`);
    for (const u of units) {
      const t = state.transmissions.find((x) => x.stageId === st.id && x.eventId === u.id);
      if (!t) continue;
      const ans = u.prompts.map((p) => state.answers[p.id]).filter(Boolean).join(" / ").replace(/\s+/g, " ").slice(0, 600);
      lines.push(`- ${u.title}: outcome "${t.outcomeLabel}". Admiral: ${ans || "(see fleet request)"}`);
    }
  }
  return lines.join("\n");
}

export async function writeReview(s: Scenario, state: GameState, byId: ById): Promise<Transmission> {
  const from = s.debrief?.from ?? "Starfleet Command";
  const base = { stageId: "review", outcomeId: "review", outcomeLabel: "Review", from };
  const sample = await getSample();
  if (!sample) return { ...base, subject: `${s.title}: end of posting`, body: "Admiral, your posting is complete. A full review will follow once Starfleet Command has studied your reports.", offline: true };
  const standingsNow = activeFactions(s, state).map((f) => `- ${f.name}: ${standingLabel(state.standings[f.id] ?? 0)} (${state.standings[f.id] ?? 0})`).join("\n");
  const prompt = `${header(s, state, [s.debrief?.gmNotes ?? ""].filter(Boolean))}

${campaignSoFar(s, state, byId)}

${secretsText(s, state)}

THE WHOLE POSTING, SCENE BY SCENE
${campaignRecord(s, state)}

WHERE THINGS STAND AT THE END
${standingsNow}

YOUR TASK
Write ${from}'s end-of-posting review, addressed to the admiral, in character. Assess the posting as a whole: two or three things the admiral did well, two or three decisions Starfleet would question or that cost something, and a candid closing judgment of how the sector stands. Be specific: name scenes, ships and people. Be fair, not flattering; a good posting can still have real mistakes. Do not mention game mechanics, outcomes, ratings or standings numbers. Under 400 words, plain text, short paragraphs, no headings or bullet points.

Respond with only a JSON object: {"subject": "<short subject>", "body": "<the review>"}`;
  const res = await sample(prompt, { modelTier: "default", cache: false });
  const data = parseJson(res.text);
  return { ...base, subject: typeof data?.subject === "string" ? data.subject : `${s.title}: end of posting`, body: typeof data?.body === "string" ? data.body : res.text };
}
