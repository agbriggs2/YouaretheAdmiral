import type { Prompt, Scenario } from "./scenarioTypes";
import type { ShipClass } from "./shipTypes";
import type { GameState, Transmission } from "./state";
import { activeFactions, locationName, readLines, standingLabel } from "./state";

/* The campaign as a readable record: each scene, the admiral's orders and the replies. */

interface Section { heading: string; from?: string; scene?: string; orders: { q: string; a: string }[]; reply?: Transmission }

function answer(s: Scenario, state: GameState, p: Prompt, byId: Record<string, ShipClass>): string {
  if (p.kind === "reinforcement") {
    const cat = (id: string) => s.resources.fleet?.categories.find((c) => c.id === id)?.label ?? id;
    const req = readLines(state, p.id).map((l) => `${l.count} × ${cat(l.category)}${l.preferredClassId ? ` (${byId[l.preferredClassId]?.name ?? l.preferredClassId} preferred)` : ""}: ${l.purpose}`);
    const got = state.fleet.concat(state.departed).filter((f) => f.addedIn === p.id).map((f) => `${f.name} (${byId[f.classId]?.name} class)`);
    return `${req.join("\n")}${got.length ? `\nSent: ${got.join(", ")}` : ""}`;
  }
  return state.answers[p.id] ?? "";
}

function sections(s: Scenario, state: GameState, byId: Record<string, ShipClass>): { stage: string; briefing: string; items: Section[] }[] {
  const out: { stage: string; briefing: string; items: Section[] }[] = [];
  s.stages.slice(0, state.stageIndex + 1).forEach((st, i) => {
    const items: Section[] = [];
    if (i === 0) {
      const sb = s.locations.find((l) => l.id === state.starbase.locationId);
      const cat = (id: string) => s.resources.fleet?.categories.find((c) => c.id === id)?.label ?? id;
      items.push({
        heading: "Your plan",
        orders: [
          { q: "Priorities", a: state.answers["q1-priorities"] ?? "" },
          { q: "Starbase", a: `${sb?.name ?? "Not chosen"}${state.starbase.orbit ? `, ${state.starbase.orbit.replace("-", " ")}` : ""}. ${state.starbase.reasoning}` },
          { q: "Fleet request", a: `${state.fleetRequest.disposition}\n${state.fleetRequest.lines.map((l) => `${l.count} × ${cat(l.category)}${l.preferredClassId ? ` (${byId[l.preferredClassId]?.name} preferred)` : ""}: ${l.purpose}`).join("\n")}` },
        ],
        reply: state.transmissions.find((t) => t.stageId === st.id && !t.eventId),
      });
    } else if (st.prompts?.length) {
      items.push({ heading: "Your orders", orders: st.prompts.map((p) => ({ q: p.text, a: answer(s, state, p, byId) })), reply: state.transmissions.find((t) => t.stageId === st.id && !t.eventId) });
    }
    for (const ev of st.events ?? []) {
      const reply = state.transmissions.find((t) => t.stageId === st.id && t.eventId === ev.id);
      if (!reply) continue;
      const lost = state.departed.filter((d) => d.lostIn === `${st.id}:${ev.id}`).map((d) => `the ${d.name} (${byId[d.classId]?.name} class)`);
      items.push({ heading: ev.title, from: ev.from, scene: ev.text.replace("{lost}", lost.join(" and ") || "one of your ships"), orders: ev.prompts.map((p) => ({ q: p.text, a: answer(s, state, p, byId) })), reply });
    }
    out.push({ stage: st.title, briefing: st.briefing, items });
  });
  return out;
}

const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const paras = (t: string) => t.split(/\n+/).filter(Boolean).map((p) => `<p>${esc(p)}</p>`).join("");

export function campaignHtml(s: Scenario, state: GameState, byId: Record<string, ShipClass>): string {
  const body = sections(s, state, byId).map((st) => `
<h2>${esc(st.stage)}</h2>
${paras(st.briefing)}
${st.items.map((it) => `
<section>
<h3>${esc(it.heading)}</h3>
${it.from ? `<p class="meta">Reported by ${esc(it.from)}</p>` : ""}
${it.scene ? paras(it.scene) : ""}
${it.orders.filter((o) => o.a.trim()).map((o) => `<div class="orders"><p class="q">${esc(o.q)}</p>${paras(o.a)}</div>`).join("")}
${it.reply ? `<div class="reply"><p class="meta">${esc(it.reply.from)} · ${esc(it.reply.subject)}</p>${paras(it.reply.body)}</div>` : ""}
</section>`).join("")}`).join("");
  const fleet = state.fleet.map((f) => `<li><b>${esc(f.name)}</b> (${esc(f.registry ?? "")}), ${esc(byId[f.classId]?.name ?? "")} class, Captain ${esc(f.captain ?? "")}: ${esc(locationName(s, f.location))}, ${esc(f.task ?? "")}</li>`).join("");
  const lost = state.departed.map((d) => `<li><b>${esc(d.name)}</b>: ${esc(d.reason)}</li>`).join("");
  const standings = activeFactions(s, state).map((f) => `<li>${esc(f.name)}: ${esc(standingLabel(state.standings[f.id] ?? 0))}</li>`).join("");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${esc(s.title)}: campaign record</title>
<style>
body{font:16px/1.55 Georgia,serif;max-width:46rem;margin:2.5rem auto;padding:0 1.25rem;color:#1d1d1f}
h1{font:600 2rem/1.2 system-ui,sans-serif;margin:0 0 .25rem}h2{font:600 1.4rem system-ui,sans-serif;margin:2.5rem 0 .5rem;border-bottom:2px solid #8b1a1a;padding-bottom:.25rem}
h3{font:600 1.1rem system-ui,sans-serif;margin:1.75rem 0 .25rem}.meta{font:.85rem system-ui,sans-serif;color:#666;margin:.25rem 0}
.orders{border-left:3px solid #1f7a7a;padding:.1rem 0 .1rem 1rem;margin:.75rem 0}.q{font:600 .9rem system-ui,sans-serif;color:#1f7a7a;margin:.25rem 0}
.reply{background:#f5f3ef;padding:.5rem 1rem;border-radius:6px;margin:.75rem 0}ul{padding-left:1.25rem}
</style></head><body>
<h1>${esc(s.title)}</h1>
<p class="meta">${esc(s.playerRole.rank)} · ${esc(s.playerRole.title)} · ${s.year}</p>
${body}
${state.review ? `<h2>Review of the posting</h2><div class="reply"><p class="meta">${esc(state.review.from)} · ${esc(state.review.subject)}</p>${paras(state.review.body)}</div>` : ""}
<h2>Where things stand</h2>
<ul>${standings}</ul>
<h3>Fleet</h3><ul>${fleet}</ul>
${lost ? `<h3>No longer under your command</h3><ul>${lost}</ul>` : ""}
</body></html>`;
}

export function campaignText(s: Scenario, state: GameState, byId: Record<string, ShipClass>): string {
  const out: string[] = [`${s.title}`, `${s.playerRole.rank} · ${s.playerRole.title} · ${s.year}`, ""];
  for (const st of sections(s, state, byId)) {
    out.push(`== ${st.stage} ==`, st.briefing, "");
    for (const it of st.items) {
      out.push(`-- ${it.heading} --`);
      if (it.from) out.push(`Reported by ${it.from}`);
      if (it.scene) out.push(it.scene);
      for (const o of it.orders.filter((x) => x.a.trim())) out.push("", `> ${o.q}`, o.a);
      if (it.reply) out.push("", `${it.reply.from}: ${it.reply.subject}`, it.reply.body);
      out.push("");
    }
  }
  if (state.review) out.push("== Review of the posting ==", `${state.review.from}: ${state.review.subject}`, state.review.body, "");
  return out.join("\n");
}
