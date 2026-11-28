import type { FleetRules } from "../engine/scenarioTypes";
import type { ShipClass } from "../engine/shipTypes";
import { RATING_KEYS } from "../engine/shipTypes";
import type { FleetShip } from "../engine/state";
import { needsJustification, uid } from "../engine/state";

const NAMES = ["Arcturus", "Bellerophon", "Concorde", "Drake", "Endeavour", "Fearless", "Gallant", "Hermes", "Icarus", "Jaguar", "Kearsarge", "Leander", "Majestic", "Nimitz", "Orion", "Pioneer", "Resolute", "Sentinel", "Tenacity", "Valiant", "Wasp", "Yorktown", "Zephyr"];

const SHORT: Record<string, string> = { firepower: "Firepower", defense: "Defense", speed: "Speed", agility: "Agility", sensors: "Sensors", science: "Science", endurance: "Endurance", logistics: "Logistics", presence: "Presence" };

const ROLE_LABEL = { warship: "Warship", "combat-capable": "Combat-capable", "non-combat": "Non-combat" } as const;

interface Props {
  rules: FleetRules;
  catalogue: ShipClass[];
  byId: Record<string, ShipClass>;
  fleet: FleetShip[];
  locked: boolean;
  promptId: string;
  onChange: (fleet: FleetShip[]) => void;
}

export function FleetBuilder({ rules, catalogue, byId, fleet, locked, promptId, onChange }: Props) {
  const full = fleet.length >= rules.maxShips;
  const capitalCount = fleet.filter((f) => byId[f.classId]?.tags.includes("capital")).length;
  const capitalMax = rules.tagLimits?.find((t) => t.tag === "capital")?.max ?? Infinity;

  const add = (c: ShipClass) => {
    const used = new Set(fleet.map((f) => f.name));
    const name = NAMES.find((n) => !used.has(`USS ${n}`)) ?? `Ship ${fleet.length + 1}`;
    onChange([...fleet, { uid: uid(), classId: c.id, name: `USS ${name}`, assignment: "", mission: "", justification: "", addedIn: promptId }]);
  };
  const update = (id: string, patch: Partial<FleetShip>) => onChange(fleet.map((f) => (f.uid === id ? { ...f, ...patch } : f)));
  const remove = (id: string) => onChange(fleet.filter((f) => f.uid !== id));

  return (
    <div className="fleet-builder">
      <h3 className="sub">Your fleet <span className="muted">({fleet.length} of {rules.maxShips})</span></h3>
      {fleet.length === 0 && <p className="empty">No ships yet. Add classes from the list above.</p>}
      <ol className="fleet">
        {fleet.map((f) => {
          const c = byId[f.classId];
          const justify = c && needsJustification(rules, c);
          return (
            <li key={f.uid} className="ship-row">
              <div className="ship-top">
                <input
                  className="ship-name"
                  value={f.name}
                  disabled={locked}
                  onChange={(e) => update(f.uid, { name: e.target.value })}
                  aria-label="Ship name"
                />
                <span className="muted">{c?.name} class</span>
                {!locked && (
                  <button type="button" className="btn ghost small" onClick={() => remove(f.uid)} aria-label={`Remove ${f.name}`}>
                    Remove
                  </button>
                )}
              </div>
              <div className="ship-fields">
                <label>
                  <span>Duty</span>
                  <select value={f.assignment} disabled={locked} onChange={(e) => update(f.uid, { assignment: e.target.value })}>
                    <option value="">Choose…</option>
                    {rules.assignments.map((a) => <option key={a}>{a}</option>)}
                  </select>
                </label>
                <label className="grow">
                  <span>Primary mission</span>
                  <input value={f.mission} disabled={locked} onChange={(e) => update(f.uid, { mission: e.target.value })} placeholder="e.g. Patrol the Tekanan–Lysara trade lane" />
                </label>
                {justify && (
                  <label className="full">
                    <span>Why this ship? <em>(required for {c.tags.includes("capital") ? "a capital ship" : "non-combat ships"})</em></span>
                    <textarea rows={2} value={f.justification} disabled={locked} onChange={(e) => update(f.uid, { justification: e.target.value })} />
                  </label>
                )}
              </div>
            </li>
          );
        })}
      </ol>
      {!locked && (
        <>
          <h3 className="sub">Available classes</h3>
          <ul className="catalogue">
            {catalogue.map((c) => {
              const capitalBlocked = c.tags.includes("capital") && capitalCount >= capitalMax;
              return (
                <li key={c.id} className="class-card">
                  <div className="class-head">
                    <div>
                      <strong>{c.name}</strong>
                      <span className="muted"> {c.type}</span>
                    </div>
                    <button type="button" className="btn small" disabled={full || capitalBlocked} onClick={() => add(c)} aria-label={`Add a ${c.name}-class ship`}>
                      Add
                    </button>
                  </div>
                  <div className="badges">
                    <span className={`badge role-${c.combatRole}`}>{ROLE_LABEL[c.combatRole]}</span>
                    {c.tags.includes("capital") && <span className="badge capital">Capital</span>}
                    <span className="badge">{c.availability}</span>
                  </div>
                  <div className="ratings" aria-label="Ratings out of 10">
                    {RATING_KEYS.map((k) => (
                      <div key={k} className="rating">
                        <span className="r-top"><span>{SHORT[k]}</span><span className="num">{c.ratings[k]}</span></span>
                        <span className="bar"><span style={{ width: `${c.ratings[k] * 10}%` }} /></span>
                      </div>
                    ))}
                  </div>
                  <details>
                    <summary>Details</summary>
                    <p>{c.summary}</p>
                    <p className="muted small-text">
                      {c.lengthM ? `${c.lengthM} m · ` : ""}{c.crew ? `crew ${c.crew} · ` : ""}{c.maxWarp ? `max warp ${c.maxWarp}` : ""}
                    </p>
                    {c.weapons && <p className="small-text">{c.weapons}</p>}
                    <p className="small-text"><b>Strengths:</b> {c.strengths.join("; ")}</p>
                    <p className="small-text"><b>Weaknesses:</b> {c.weaknesses.join("; ")}</p>
                  </details>
                </li>
              );
            })}
          </ul>
        </>
      )}

    </div>
  );
}
