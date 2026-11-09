import type { ArrowDir, Pt, Role, Scene, Shape } from "../model/types";
import { tileCells } from "../model/arrows";
import { ROLES, roleKind } from "../model/types";
import { geometry } from "../data";

// Data coords: arena radius 1, +y north. SVG coords: +y down. Bearing: 0 = north, clockwise.
const sv = ([x, y]: Pt): Pt => [x, -y];
const atBearing = (deg: number, r: number): Pt => [r * Math.sin((deg * Math.PI) / 180), -r * Math.cos((deg * Math.PI) / 180)];
const QUAD: Record<string, [number, number]> = { NE: [0, 90], SE: [90, 180], SW: [180, 270], NW: [270, 360] };

const WAYMARK_COLOUR: Record<string, string> = { A: "#ef4461", "1": "#ef4461", B: "#f2c94c", "2": "#f2c94c", C: "#4aa3f0", "3": "#4aa3f0", D: "#b07cf2", "4": "#b07cf2" };
const ROLE_COLOUR = { tank: "#4f7fe0", healer: "#3fae5f", dps: "#d9534f" } as const;
const KIND_FILL: Record<string, string> = {
  danger: "rgba(224,49,79,0.32)", tankbuster: "rgba(224,49,79,0.38)", telegraph: "none",
  tower: "rgba(139,92,246,0.35)", puddle: "rgba(56,104,230,0.45)", stack: "rgba(232,184,74,0.22)", spread: "rgba(240,120,60,0.18)",
};
const KIND_STROKE: Record<string, string> = {
  danger: "#e0314f", tankbuster: "#e0314f", telegraph: "#ffd1d9", tower: "#a78bfa", puddle: "#6d8ff5", knockback: "#f4e6dc", stack: "#e8b84a", spread: "#f0783c",
};

function wedge(fromDeg: number, toDeg: number, r: number): string {
  const [x1, y1] = atBearing(fromDeg, r);
  const [x2, y2] = atBearing(toDeg, r);
  const large = toDeg - fromDeg > 180 ? 1 : 0;
  return `M0 0 L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

/** Spread nearby markers so stacked roles stay visible (display only; data points are unchanged). */
function displayPoints(scene: Scene | undefined): Partial<Record<Role, Pt>> {
  const out: Partial<Record<Role, Pt>> = {};
  const pos = scene?.positions ?? {};
  const byPoint = new Map<string, Role[]>();
  for (const r of ROLES) {
    const p = pos[r];
    if (!p) continue;
    const k = p.at.map((v) => v.toFixed(2)).join(",");
    byPoint.set(k, [...(byPoint.get(k) ?? []), r]);
  }
  for (const [, roles] of byPoint) {
    roles.forEach((r, i) => {
      const base = pos[r]!.at;
      if (roles.length === 1) { out[r] = base; return; }
      const a = (2 * Math.PI * i) / roles.length;
      out[r] = [base[0] + 0.055 * Math.cos(a), base[1] + 0.055 * Math.sin(a)];
    });
  }
  return out;
}

/** The omen the game shows on a truth/lie mechanic: hatching + dashed outline. */
function Omen({ d }: { d: string }) {
  return <><path d={d} fill="url(#omen-hatch)" stroke="none" /><path d={d} fill="none" stroke={KIND_STROKE.telegraph} strokeWidth={0.014} strokeDasharray="0.04 0.025" /></>;
}

function ShapeView({ s, scene }: { s: Shape; scene: Scene }) {
  const fill = KIND_FILL[s.kind] ?? "rgba(255,255,255,0.15)";
  const stroke = KIND_STROKE[s.kind] ?? "#fff";
  switch (s.type) {
    case "quadrants":
      // Encoding (truth/lie mechanics only): red fill = where it hits; hatching + dashed outline = the omen the game shows.
      return <g>{s.quadrants.map((q) => { const [a, b] = QUAD[q]!; const d = wedge(a, b, 0.985); return (
        <g key={q}>
          {s.kind !== "telegraph" && <path d={d} fill={fill} stroke={stroke} strokeWidth={0.006} />}
          {(s.kind === "telegraph" || s.telegraphed) && <Omen d={d} />}
        </g>); })}</g>;
    case "bands": {
      // Parallel line AoEs. `ranges` are offsets across the bands (arena radius = 1);
      // "nwse" bands run NW-SE (offset measured toward NE), "nesw" bands run NE-SW (offset toward NW).
      const k = Math.SQRT1_2;
      const [nx, ny, dx, dy] = s.axis === "nwse" ? [k, k, k, -k] : [-k, k, k, k];
      return <g>{s.ranges.map(([u0, u1], i) => {
        const pt = (u: number, v: number) => sv([u * nx + v * dx, u * ny + v * dy]).join(" ");
        const d = `M${pt(u0, -1.6)} L${pt(u0, 1.6)} L${pt(u1, 1.6)} L${pt(u1, -1.6)} Z`;
        return <g key={i}>{s.kind !== "telegraph" && <path d={d} fill={fill} stroke={stroke} strokeWidth={0.006} />}{(s.kind === "telegraph" || s.telegraphed) && <Omen d={d} />}</g>;
      })}</g>;
    }
    case "cone": {
      const [ox, oy] = sv(s.origin);
      return <path transform={`translate(${ox} ${oy})`} d={wedge(s.directionDeg - s.angleDeg / 2, s.directionDeg + s.angleDeg / 2, s.radius)} fill={fill} stroke={stroke} strokeWidth={0.008} />;
    }
    case "halfroom":
      return <path d={wedge(s.fromDeg, s.toDeg, 0.985)} fill={fill} stroke={stroke} strokeWidth={0.006} />;
    case "tiles": {
      // Cells without a dropped arrow are faint; a dropped arrow lights up its cell (when the scene tracks drops).
      const dropped = scene.arrowState?.drops;
      const taken = scene.arrowState?.taken ?? [];
      const hops = scene.arrowState?.hops ?? [];
      return <g>{s.frames.map((f, k) => {
        const [x0, y0, x1, y1] = f.rect; const [ax, ay] = sv([x0, y0]); const [bx, by] = sv([x1, y1]);
        const w = bx - ax, h = by - ay, t = Math.min(w, h);
        const col = f.colour === "red" ? "#ef4461" : "#4a7bf0";
        return (
          <g key={k}>
            <rect x={ax} y={ay} width={w} height={h} rx={0.03} fill="none" stroke={col} strokeWidth={0.012} opacity={dropped ? 0.7 : 1} />
            {tileCells(f).map((c, j) => {
              const d = dropped?.find((x) => x.frame === k && x.cell === j);
              const used = taken.find((x) => x.frame === k && x.cell === j);
              const [cx, cy] = sv(c);
              return (
                <g key={j} transform={`translate(${cx} ${cy})`} opacity={used ? 0.12 : !dropped || d ? 1 : 0.18}>
                  <circle r={t * 0.36} fill="rgba(200,80,50,0.55)" stroke={d ? "#ffd27a" : "#f0a070"} strokeWidth={d ? 0.012 : 0.006} />
                  <ArrowGlyph dir={f.arrows[j]!} />
                  {d && <title>{used ? `${used.role} was teleported by this arrow (used up)` : `${d.role} dropped this arrow (${d.index === 0 ? "short" : "long"} timer)`}</title>}
                </g>);
            })}
          </g>);
      })}
        {hops.map((h, i) => {
          const [ax, ay] = sv(h.from); const [bx, by] = sv(h.to);
          return (
            <g key={`hop-${i}`}>
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="#c9a7ff" strokeWidth={0.008} strokeDasharray="0.02 0.015" />
              <circle cx={bx} cy={by} r={0.012} fill="#c9a7ff" />
              <title>{`${h.role}: teleported`}</title>
            </g>);
        })}
      </g>;
    }
    case "knockback": {
      // Rough direction of the push: starts at the holder (the source), runs through the knocked group.
      // Ends at `end` (display end, e.g. a puddle's far edge), else at the landing spot `to`, else a fixed length.
      const [hx, hy] = sv(s.from); const [gx, gy] = sv(s.to ?? s.through);
      const len = Math.hypot(gx - hx, gy - hy) || 1; const ux = (gx - hx) / len, uy = (gy - hy) / len;
      // `lane` shifts the arrow sideways (display only) so opposing arrows do not overlap.
      const ox = -uy * (s.lane ?? 0), oy = ux * (s.lane ?? 0);
      const [sx2, sy2] = [hx + ux * 0.075 + ox, hy + uy * 0.075 + oy];
      const [tx, ty] = s.end ? sv(s.end) : s.to ? [gx, gy] : [sv(s.through)[0] + ux * 0.42, sv(s.through)[1] + uy * 0.42];
      const ex = tx + ox, ey = ty + oy;
      const ang = (Math.atan2(ey - sy2, ex - sx2) * 180) / Math.PI;
      return (
        <g stroke={stroke} fill={stroke} opacity={0.55} style={{ pointerEvents: "none" }}>
          <line x1={sx2} y1={sy2} x2={ex} y2={ey} strokeWidth={0.014} strokeLinecap="round" />
          <path transform={`translate(${ex} ${ey}) rotate(${ang})`} d="M0.025 0 L-0.04 -0.032 L-0.04 0.032 Z" stroke="none" />
        </g>);
    }
    case "raidwide":
      return <circle r={0.97} fill="none" stroke={stroke} strokeWidth={0.05} opacity={0.6} />;
    case "target": {
      const p = scene.positions?.[s.role]; if (!p) return null; const [x, y] = sv(p.at);
      return <g transform={`translate(${x} ${y})`}><circle r={0.1} fill="none" stroke={stroke} strokeWidth={0.014} strokeDasharray="0.03 0.015" /><text y={-0.13} textAnchor="middle" fontSize={0.06} fontWeight={700} fill={stroke}>{s.text}</text></g>;
    }
    case "spreads":
      return <g>{(s.roles ?? ROLES).map((r) => { const p = scene.positions?.[r]; if (!p) return null; const [x, y] = sv(p.at); return <circle key={r} cx={x} cy={y} r={s.radius} fill={fill} stroke={stroke} strokeWidth={0.006} />; })}</g>;
    case "stacks": {
      const pts = new Map<string, Pt>();
      for (const r of ROLES) { const p = scene.positions?.[r]; if (p) pts.set(p.at.join(","), p.at); }
      return <g>{[...pts.values()].map((pt) => { const [x, y] = sv(pt); return (
        <g key={pt.join(",")} transform={`translate(${x} ${y})`} stroke={stroke} strokeWidth={0.012} fill="none" strokeLinecap="round">
          {[0, 90, 180, 270].map((d) => <path key={d} transform={`rotate(${d})`} d="M0 -0.17 L0 -0.11 M-0.03 -0.14 L0 -0.11 L0.03 -0.14" />)}
        </g>); })}</g>;
    }
    case "tethers": {
      const [sx, sy] = sv(geometry.statue.point);
      return <g stroke="#c084fc" strokeWidth={0.012} strokeDasharray="0.03 0.018" opacity={0.85}>{s.targets.map((r) => {
        const p = scene.positions?.[r]; if (!p) return null;
        const [tx, ty] = sv(p.at);
        return <line key={r} x1={sx} y1={sy} x2={tx} y2={ty} />;
      })}</g>;
    }
    case "beams": {
      const [sx, sy] = sv(geometry.statue.point);
      return <g>{s.targets.map((r) => {
        const p = scene.positions?.[r]; if (!p) return null;
        const [tx, ty] = sv(p.at);
        const len = Math.hypot(tx - sx, ty - sy); const ux = (tx - sx) / len, uy = (ty - sy) / len;
        const ex = sx + ux * 2.4, ey = sy + uy * 2.4; const nx = -uy * s.width / 2, ny = ux * s.width / 2;
        return <polygon key={r} points={`${sx + nx},${sy + ny} ${ex + nx},${ey + ny} ${ex - nx},${ey - ny} ${sx - nx},${sy - ny}`} fill={fill} stroke={stroke} strokeWidth={0.005} />;
      })}</g>;
    }
    case "towers":
    case "circles":
      return <g>{s.centres.map((c, i) => { const [x, y] = sv(c); return <circle key={i} cx={x} cy={y} r={s.radius} fill={fill} stroke={stroke} strokeWidth={0.008} />; })}</g>;
  }
}

const ARROW_ROT = { up: 0, right: 90, down: 180, left: 270 } as const;
function ArrowGlyph({ dir, scale = 1 }: { dir: ArrowDir; scale?: number }) {
  return <path transform={`rotate(${ARROW_ROT[dir]}) scale(${scale})`} d="M0 -0.06 L0.05 0 L0.022 0 L0.022 0.055 L-0.022 0.055 L-0.022 0 L-0.05 0 Z" fill="#f4e6dc" />;
}

function RoleMarker({ role, at, approx, derived, carried, highlighted, dimmed, still, debuff, arrows }: { role: Role; at: Pt; approx: boolean; derived?: boolean; carried?: boolean; highlighted: boolean; dimmed: boolean; still?: boolean; debuff?: boolean; arrows?: ArrowDir[] }) {
  const kind = roleKind(role);
  const [x, y] = sv(at);
  const c = ROLE_COLOUR[kind];
  const sz = 0.052;
  const body =
    kind === "tank" ? <rect x={-sz} y={-sz} width={sz * 2} height={sz * 2} rx={0.012} /> :
    kind === "healer" ? <circle r={sz * 1.1} /> :
    <rect x={-sz} y={-sz} width={sz * 2} height={sz * 2} transform="rotate(45)" rx={0.008} />;
  return (
    <g className="role-marker" {...(still ? { transform: `translate(${x} ${y})`, style: { transition: "none" } } : { style: { transform: `translate(${x}px, ${y}px)` } })} opacity={(dimmed ? 0.35 : 1) * (carried ? 0.7 : 1)} aria-label={`${role}${carried ? " (stays from the previous step)" : approx ? " (approximate)" : ""}`}>
      {highlighted && <><circle r={0.1} fill="rgba(255,255,255,0.12)" /><circle r={0.095} fill="none" stroke="#fff" strokeWidth={0.01} /></>}
      <g fill={c} filter="url(#marker-shadow)" stroke={derived ? "#c4b5fd" : approx ? "#fff" : "rgba(255,255,255,0.35)"} strokeWidth={derived ? 0.011 : approx ? 0.008 : 0.006} strokeDasharray={approx || derived ? "0.014 0.01" : undefined}>{body}</g>
      <text y={0.018} textAnchor="middle" fontSize={0.048} fontWeight={700} fill="#fff" stroke="rgba(0,0,0,0.35)" strokeWidth={0.008} paintOrder="stroke" style={{ pointerEvents: "none", letterSpacing: "-0.002px" }}>{role}</text>
      {arrows?.map((d, i) => (
        // Arrow debuffs still to drop, short timer first (below the marker).
        <g key={i} transform={`translate(${(i - (arrows.length - 1) / 2) * 0.05} 0.082)`}>
          <rect x={-0.022} y={-0.022} width={0.044} height={0.044} rx={0.008} fill="#3b2a6b" stroke="#e8b84a" strokeWidth={0.005} />
          <ArrowGlyph dir={d} scale={0.32} />
        </g>
      ))}
      {arrows?.length ? <title>{`${role}: arrow debuffs still to drop (${arrows.join(", ")}; short timer first)`}</title> : null}
      {debuff && (
        <g transform="translate(0.05 -0.05)">
          <circle r={0.03} fill="#8b5cf6" stroke="#f4e6ff" strokeWidth={0.006} />
          <text y={0.012} textAnchor="middle" fontSize={0.034} fontWeight={800} fill="#fff">T</text>
          <title>{`${role} holds the Double-Trouble Trap debuff`}</title>
        </g>
      )}
    </g>
  );
}

/** `still` renders plain SVG transforms (for static export); otherwise markers animate via CSS. */
/** A castbar to draw under the boss (replay): ability name, fill 0–1, seconds left. */
export interface CastBar { ability: string; progress: number; left: number }

/** `phase` decides the props on the floor: the statue is only there in P1. */
export function Arena({ scene, focus, title, still, cast, phase = 1 }: { scene: Scene | undefined; focus?: Role; title: string; still?: boolean; cast?: CastBar; phase?: number }) {
  const pts = displayPoints(scene);
  const wm = geometry.waymarks.points;
  const [stx, sty] = sv(geometry.statue.point);
  return (
    <svg viewBox="-1.15 -1.15 2.3 2.3" role="img" aria-label={title} className="w-full h-auto select-none">
      <defs>
        <clipPath id="arena-clip"><circle r={1} /></clipPath>
        <radialGradient id="floor" r="1">
          <stop offset="0%" stopColor="#24212f" /><stop offset="100%" stopColor="#15131c" />
        </radialGradient>
        <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx={0} dy={0.008} stdDeviation={0.01} floodColor="#000" floodOpacity={0.55} />
        </filter>
        <radialGradient id="rim" r="1">
          <stop offset="94%" stopColor="#2b2836" /><stop offset="100%" stopColor="#3a3548" />
        </radialGradient>
        <pattern id="omen-hatch" width={0.045} height={0.045} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1={0} y1={0} x2={0} y2={0.045} stroke="rgba(255,209,217,0.42)" strokeWidth={0.008} strokeDasharray="0.02 0.012" />
        </pattern>
      </defs>
      <circle r={1.035} fill="url(#rim)" />
      <circle r={1} fill="url(#floor)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.004} />
      <g stroke="rgba(255,255,255,0.055)" strokeWidth={0.004}>
        <line x1={-1} y1={0} x2={1} y2={0} /><line x1={0} y1={-1} x2={0} y2={1} />
        <circle r={0.5} fill="none" />
      </g>
      <g clipPath="url(#arena-clip)">
        {scene?.zones?.map((z) => {
          const rect = { N: [-1, -1, 2, 1], S: [-1, 0, 2, 1], W: [-1, -1, 1, 2], E: [0, -1, 1, 2] }[z.half] as number[];
          return <rect key={z.label} x={rect[0]} y={rect[1]} width={rect[2]} height={rect[3]} fill={z.group === "th" ? "rgba(79,127,224,0.14)" : "rgba(217,83,79,0.14)"} />;
        })}
        {scene?.shapes?.map((s, i) => s.type === "knockback" ? null : <ShapeView key={i} s={s} scene={scene} />)}
      </g>
      {!scene?.relative && Object.entries(wm).map(([k, p]) => {
        const [x, y] = sv(p);
        const col = WAYMARK_COLOUR[k];
        return (
          <g key={k} transform={`translate(${x} ${y})`} opacity={0.9}>
            {/^[A-D]$/.test(k) ? <circle r={0.05} fill={col} fillOpacity={0.12} stroke={col} strokeWidth={0.01} /> : <rect x={-0.045} y={-0.045} width={0.09} height={0.09} rx={0.01} fill={col} fillOpacity={0.12} stroke={col} strokeWidth={0.01} />}
            <text y={0.02} textAnchor="middle" fontSize={0.055} fontWeight={700} fill={col}>{k}</text>
          </g>
        );
      })}
      {phase === 1 && (
        <g transform={`translate(${stx} ${sty})`}>
          <polygon points="0,-0.06 0.018,-0.018 0.06,0 0.018,0.018 0,0.06 -0.018,0.018 -0.06,0 -0.018,-0.018" fill="#e8b84a" stroke="#8b5cf6" strokeWidth={0.008} />
          <title>Statue</title>
        </g>
      )}
      {scene?.relative && <text x={0} y={1.1} textAnchor="middle" fontSize={0.05} fill="#a1a1aa">towers = relative south</text>}
      <BossToken />
      {ROLES.map((r) => {
        const alt = scene?.positions?.[r]?.alt;
        // Two equal candidate spots: drawn identically, neither is preferred.
        return alt ? <RoleMarker key={`alt-${r}`} role={r} at={alt} approx highlighted={focus === r} dimmed={!!focus && focus !== r} still /> : null;
      })}
      {ROLES.map((r) => {
        const at = pts[r];
        if (!at) return null;
        const p = scene!.positions![r]!;
        const as = scene!.arrowState;
        const pending = as?.pairs[r]?.filter((_, i) => !as.drops.some((d) => d.role === r && d.index === i));
        return <RoleMarker key={r} role={r} at={at} arrows={pending} debuff={scene!.debuff?.includes(r)} approx={p.method !== "auto" || !!p.alt} derived={p.method === "derived"} carried={p.method === "carried"} highlighted={focus === r} dimmed={!!focus && focus !== r} still={still} />;
      })}
      {scene?.shapes?.map((s, i) => s.type === "knockback" ? <ShapeView key={`kb-${i}`} s={s} scene={scene} /> : null)}
      {cast && <BossCastBar cast={cast} />}
    </svg>
  );
}

/**
 * The boss: an original jester-cap token (not game art). The notch at the top shows where the boss faces
 * (north unless a step says otherwise, convention C-01).
 */
function BossToken() {
  return (
    <g>
      <title>Kefka (boss), facing north</title>
      <path d="M0 -0.112 L0.026 -0.078 L-0.026 -0.078 Z" fill="#e0314f" />
      <circle r={0.078} fill="#2a1840" stroke="#e8b84a" strokeWidth={0.01} />
      {/* three-pointed cap */}
      <path d="M-0.05 0.022 Q-0.06 -0.02 -0.046 -0.05 Q-0.03 -0.012 -0.012 0.004 Q-0.006 -0.04 0 -0.058 Q0.006 -0.04 0.012 0.004 Q0.03 -0.012 0.046 -0.05 Q0.06 -0.02 0.05 0.022 Z"
        fill="#8b5cf6" stroke="#e8b84a" strokeWidth={0.005} strokeLinejoin="round" />
      <path d="M-0.05 0.022 L0.05 0.022 L0.046 0.038 L-0.046 0.038 Z" fill="#e0314f" stroke="#e8b84a" strokeWidth={0.004} />
      <circle cx={-0.046} cy={-0.052} r={0.008} fill="#e8b84a" />
      <circle cx={0} cy={-0.061} r={0.008} fill="#e8b84a" />
      <circle cx={0.046} cy={-0.052} r={0.008} fill="#e8b84a" />
    </g>
  );
}

/** Kefka's castbar under the boss token: ability name, filling bar, seconds left. */
function BossCastBar({ cast }: { cast: CastBar }) {
  const w = 0.44, h = 0.026, y = 0.105;
  return (
    <g pointerEvents="none">
      <rect x={-w / 2 - 0.012} y={y - 0.006} width={w + 0.024} height={0.098} rx={0.014} fill="rgba(10,8,18,0.78)" />
      <text x={-w / 2} y={y + 0.036} fontSize={0.04} fontWeight={700} fill="#f5e9c8">{cast.ability}</text>
      <text x={w / 2} y={y + 0.036} fontSize={0.036} textAnchor="end" fill="#c8bfa8" style={{ fontVariantNumeric: "tabular-nums" }}>{cast.left.toFixed(1)}</text>
      <rect x={-w / 2} y={y + 0.052} width={w} height={h} rx={h / 2} fill="#2a2338" stroke="#6b5a2c" strokeWidth={0.004} />
      <rect x={-w / 2} y={y + 0.052} width={w * Math.min(1, Math.max(0, cast.progress))} height={h} rx={h / 2} fill="#e8b84a" />
    </g>
  );
}
