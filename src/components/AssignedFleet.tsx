import type { ShipClass } from "../engine/shipTypes";
import type { FleetShip } from "../engine/state";

interface Props {
  fleet: FleetShip[];
  byId: Record<string, ShipClass>;
  assignments: string[];
  locked: boolean;
  onChange: (fleet: FleetShip[]) => void;
}

export function AssignedFleet({ fleet, byId, assignments, locked, onChange }: Props) {
  const update = (id: string, patch: Partial<FleetShip>) => onChange(fleet.map((f) => (f.uid === id ? { ...f, ...patch } : f)));
  return (
    <ol className="fleet">
      {fleet.map((f) => {
        const c = byId[f.classId];
        return (
          <li key={f.uid} className={`ship-row${f.substituted ? " sub" : ""}`}>
            <div className="ship-top">
              <input className="ship-name" value={f.name} disabled={locked} onChange={(e) => update(f.uid, { name: e.target.value })} aria-label="Ship name" />
              <span className="ship-class">{c?.name} class <span className="muted">· {c?.type}{f.registry ? ` · ${f.registry}` : ""}{f.captain ? ` · Captain ${f.captain}` : ""}</span></span>
            </div>
            <p className="requested small-text">
              Requested: {f.requested}
              {f.substituted && <span className="badge subst">Substitute</span>}
            </p>
            <div className="ship-fields">
              <label>
                <span>Duty</span>
                <select value={f.assignment} disabled={locked} onChange={(e) => update(f.uid, { assignment: e.target.value })}>
                  <option value="">Choose…</option>
                  {assignments.map((a) => <option key={a}>{a}</option>)}
                </select>
              </label>
              <label className="grow">
                <span>Primary mission</span>
                <input value={f.mission} disabled={locked} onChange={(e) => update(f.uid, { mission: e.target.value })} />
              </label>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
