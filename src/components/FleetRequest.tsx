import type { FleetRules } from "../engine/scenarioTypes";
import type { ShipClass } from "../engine/shipTypes";
import { RATING_KEYS } from "../engine/shipTypes";
import type { FleetRequest as Req, RequestLine } from "../engine/state";
import { grantChance, uid } from "../engine/state";

interface Props {
  rules: FleetRules;
  catalogue: ShipClass[];
  request: Req;
  locked: boolean;
  onChange: (r: Req) => void;
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function FleetRequest({ rules, catalogue, request, locked, onChange }: Props) {
  const total = request.lines.reduce((n, l) => n + l.count, 0);
  const left = rules.maxShips - total;

  const setLine = (id: string, patch: Partial<RequestLine>) =>
    onChange({ ...request, lines: request.lines.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  const addLine = (category: string) =>
    onChange({ ...request, lines: [...request.lines, { id: uid(), category, count: 1, preferredClassId: "", purpose: "" }] });
  const removeLine = (id: string) => onChange({ ...request, lines: request.lines.filter((l) => l.id !== id) });

  return (
    <div className="fleet-request">
      <label className="field">
        <span>What does your fleet need to be able to do?</span>
        <textarea rows={4} value={request.disposition} disabled={locked} placeholder="e.g. Keep the trade lanes safe, watch the border, show the flag at Lysara, and survey the nebula." onChange={(e) => onChange({ ...request, disposition: e.target.value })} />
      </label>

      <h3 className="sub">Ship requests <span className="muted">({total} of {rules.maxShips})</span></h3>
      {request.lines.length === 0 && <p className="empty">No requests yet. Add a ship type below.</p>}
      <ol className="req-lines">
        {request.lines.map((l) => {
          const cat = rules.categories.find((c) => c.id === l.category);
          const pool = catalogue.filter((c) => c.category === l.category);
          const maxHere = cat?.capital ? 1 : l.count + Math.max(0, left);
          return (
            <li key={l.id} className="req-line">
              <div className="req-top">
                <strong className="req-cat">{cat?.label ?? l.category}</strong>
                <div className="stepper" aria-label={`Number of ${cat?.label ?? ""} ships`}>
                  <button type="button" className="btn small ghost" disabled={locked || l.count <= 1} onClick={() => setLine(l.id, { count: l.count - 1 })} aria-label="Fewer">−</button>
                  <span className="count">{l.count}</span>
                  <button type="button" className="btn small ghost" disabled={locked || l.count >= maxHere} onClick={() => setLine(l.id, { count: l.count + 1 })} aria-label="More">+</button>
                </div>
                {!locked && <button type="button" className="btn ghost small" onClick={() => removeLine(l.id)}>Remove</button>}
              </div>
              <div className="req-fields">
                <label>
                  <span>Preferred class</span>
                  <select value={l.preferredClassId} disabled={locked} onChange={(e) => setLine(l.id, { preferredClassId: e.target.value })}>
                    <option value="">No preference</option>
                    {pool.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.availability}, ~{pct(grantChance(rules, c))})</option>
                    ))}
                  </select>
                </label>
                <label className="grow">
                  <span>What are they for?</span>
                  <input value={l.purpose} disabled={locked} onChange={(e) => setLine(l.id, { purpose: e.target.value })} placeholder={cat?.capital ? "Why you need a capital ship" : "e.g. Patrol the Tekanan–Lysara lane"} />
                </label>
              </div>
              {(() => {
                const pref = pool.find((c) => c.id === l.preferredClassId);
                if (!pref || l.count < 2) return null;
                const odds = Array.from({ length: l.count }, (_, i) => grantChance(rules, pref, 0, i));
                if (odds[1] >= odds[0]) return null;
                return <p className="repeat-note small-text">Starfleet rarely spares several {pref.name}s: about {odds.map(pct).join(", then ")} for each in turn, before your plan's grade.</p>;
              })()}
            </li>
          );
        })}
      </ol>

      {!locked && (
        <div className="add-cats">
          {rules.categories.map((c) => {
            const capitalTaken = c.capital && request.lines.some((l) => rules.categories.find((x) => x.id === l.category)?.capital);
            return (
              <button key={c.id} type="button" className="btn small" disabled={left <= 0 || capitalTaken} onClick={() => addLine(c.id)} title={c.description}>
                + {c.label}
              </button>
            );
          })}
        </div>
      )}

      <details className="classes-ref">
        <summary>Ship classes and how available they are</summary>
        <p className="muted small-text">If you name a preferred class, Starfleet grants it with roughly the chance shown, which reflects how common the class is and what this sector can expect. A well-argued plan improves those odds; a weak one lowers them. Each extra ship of the same class is harder to get: no penalty for ubiquitous classes, a small one for common, a moderate one for uncommon and a steep one for rare. Otherwise Starfleet sends another class from the same category, more often a common one. Every slot you request is filled.</p>
        {rules.categories.map((cat) => (
          <div key={cat.id} className="ref-cat">
            <h4>{cat.label}</h4>
            <ul className="catalogue">
              {catalogue.filter((c) => c.category === cat.id).map((c) => (
                <li key={c.id} className="class-card">
                  <div className="class-head">
                    <div><strong>{c.name}</strong><span className="muted"> {c.type}</span></div>
                    <span className="badge">{c.availability} · {c.status} · ~{pct(grantChance(rules, c))}</span>
                  </div>
                  <div className="ratings" aria-label="Ratings out of 10">
                    {RATING_KEYS.map((k) => (
                      <div key={k} className="rating">
                        <span className="r-top"><span>{k[0].toUpperCase() + k.slice(1)}</span><span className="num">{c.ratings[k]}</span></span>
                        <span className="bar"><span style={{ width: `${c.ratings[k] * 10}%` }} /></span>
                      </div>
                    ))}
                  </div>
                  <p className="small-text muted">{c.summary}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </details>
    </div>
  );
}
