import type { Location } from "../engine/scenarioTypes";

/* Schematic map of Sector Alpha. Positions are illustrative, not from the original map. */
const POS: Record<string, { x: number; y: number; label: "above" | "below" | "right" | "left" }> = {
  "tekanan-iii": { x: 330, y: 100, label: "below" },
  lysara: { x: 285, y: 330, label: "below" },
  "kestu-ix": { x: 455, y: 250, label: "below" },
  "class-l": { x: 600, y: 150, label: "below" },
  nebula: { x: 150, y: 215, label: "below" },
  "open-space": { x: 390, y: 180, label: "right" },
  border: { x: 530, y: 330, label: "right" },
};

const SHORT: Record<string, string> = {
  nebula: "Really Big Nebula",
  "open-space": "Open space",
  "class-l": "Class-L world",
  border: "Border",
  lysara: "Lysara",
};

interface Props {
  locations: Location[];
  starbase: { locationId: string; orbit: string };
  focus?: string;
  onPick?: (id: string) => void;
}

export function SectorMap({ locations, starbase, focus, onPick }: Props) {
  const sb = POS[starbase.locationId];
  const sbPos = sb
    ? starbase.orbit === "star-orbit"
      ? { x: sb.x - 26, y: sb.y - 22 }
      : starbase.orbit === "planet-orbit"
        ? { x: sb.x + 22, y: sb.y - 18 }
        : { x: sb.x + 4, y: sb.y - 26 }
    : null;
  return (
    <svg viewBox="0 0 680 420" role="img" aria-label="Schematic map of Sector Alpha" className="map">
      <defs>
        <radialGradient id="neb" cx="45%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--nebula)" stopOpacity="0.55" />
          <stop offset="70%" stopColor="var(--nebula)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--nebula)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="planet" cx="35%" cy="35%" r="70%">
          <stop offset="0%" stopColor="var(--planet-light)" />
          <stop offset="100%" stopColor="var(--planet-dark)" />
        </radialGradient>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="var(--grid)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="680" height="420" fill="url(#grid)" pointerEvents="none" />
      {/* Saalit space beyond the border */}
      <path d="M520 0 C 540 120, 505 260, 560 420 L680 420 L680 0 Z" fill="var(--hostile-field)" />
      <path d="M520 0 C 540 120, 505 260, 560 420" fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeDasharray="6 6" />
      <text x="668" y="30" textAnchor="end" className="map-region">Border power</text>
      {/* Nebula */}
      <ellipse cx="150" cy="200" rx="135" ry="120" fill="url(#neb)" />
      <ellipse cx="120" cy="240" rx="80" ry="60" fill="url(#neb)" />
      {/* Trade lanes */}
      <path d="M330 100 L285 330 L455 250 Z" fill="none" stroke="var(--lane)" strokeWidth="1.5" strokeDasharray="2 5" />
      {locations.map((l) => {
        const p = POS[l.id];
        if (!p) return null;
        const active = focus === l.id || starbase.locationId === l.id;
        const ly = p.label === "below" ? p.y + 34 : p.label === "above" ? p.y - 22 : p.y + 5;
        const lx = p.label === "right" ? p.x + 16 : p.label === "left" ? p.x - 16 : p.x;
        const anchor = p.label === "right" ? "start" : p.label === "left" ? "end" : "middle";
        const isPlanet = l.kind === "planet";
        return (
          <g key={l.id} className={`loc${onPick ? " pickable" : ""}`} onClick={() => onPick?.(l.id)}>
            <circle cx={p.x} cy={p.y + 10} r="30" fill="transparent" />
            {l.id === "lysara" && (
              <>
                <circle cx={p.x - 34} cy={p.y - 6} r="7" fill="var(--star)" />
                <circle cx={p.x - 22} cy={p.y + 8} r="5" fill="var(--star)" opacity="0.8" />
              </>
            )}
            {isPlanet ? (
              <circle cx={p.x} cy={p.y} r={active ? 13 : 11} fill="url(#planet)" stroke={active ? "var(--accent)" : "none"} strokeWidth="2" />
            ) : (
              <circle cx={p.x} cy={p.y} r="4" fill={active ? "var(--accent)" : "var(--ink-soft)"} />
            )}
            <text x={lx} y={ly} textAnchor={anchor} className={`map-label${active ? " on" : ""}`}>{SHORT[l.id] ?? l.name}</text>
          </g>
        );
      })}
      {sbPos && (
        <g className="starbase" transform={`translate(${sbPos.x} ${sbPos.y})`}>
          <circle r="9" fill="var(--bg)" stroke="var(--teal)" strokeWidth="2.5" />
          <circle r="3" fill="var(--teal)" />
          <path d="M-14 0H-9M9 0H14M0 -14V-9M0 9V14" stroke="var(--teal)" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}
