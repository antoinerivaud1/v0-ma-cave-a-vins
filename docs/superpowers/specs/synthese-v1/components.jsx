/* Synthèse v1 — Composants */
/* Cards: bordure dure 2px, offset shadow 3px 3px 0 0 #ink, filigrane typo en top-right */

const { useState, useEffect, useMemo, useRef } = React;

/* ─── Tokens helpers ─── */
const wineSurface = {
  red:       { bg: "var(--rouge)",  fg: "var(--rouge-fg)",  label: "Rouge" },
  white:     { bg: "var(--blanc)",  fg: "var(--blanc-fg)",  label: "Blanc" },
  sparkling: { bg: "var(--bulle)",  fg: "var(--bulle-fg)",  label: "Bulle" },
  rose:      { bg: "var(--rose)",   fg: "var(--rose-fg)",   label: "Rosé"  },
};

const statusMeta = {
  urgent:  { label: "URGENT",   color: "var(--urgent)" },
  apogee:  { label: "APOGÉE",   color: "var(--apogee)" },
  optimal: { label: "OPTIMAL",  color: "var(--optimal)" },
  garde:   { label: "À GARDER", color: "var(--garde)" },
};

/* ─── Lucide-style stroke icons ─── */
const Icon = ({ d, size = 18, stroke = "currentColor", sw = 1.8, fill = "none", children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
    {children ?? <path d={d} />}
  </svg>
);
const IcHome    = (p) => <Icon {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>;
const IcBook    = (p) => <Icon {...p}><path d="M4 4h7a3 3 0 0 1 3 3v13"/><path d="M20 4h-7a3 3 0 0 0-3 3v13"/><path d="M4 4v16h7"/><path d="M20 4v16h-7"/></Icon>;
const IcList    = (p) => <Icon {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/></Icon>;
const IcDish    = (p) => <Icon {...p}><path d="M3 11h18"/><path d="M5 11a7 7 0 0 1 14 0"/><path d="M4 15h16l-2 5H6z"/></Icon>;
const IcGear    = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>;
const IcPlus    = (p) => <Icon {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Icon>;
const IcSearch  = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></Icon>;
const IcArrow   = (p) => <Icon {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></Icon>;
const IcBack    = (p) => <Icon {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/></Icon>;
const IcHeart   = (p) => <Icon {...p}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"/></Icon>;
const IcCam     = (p) => <Icon {...p}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3.5l2-3h7l2 3H21a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></Icon>;
const IcStar    = ({size=14, filled=false}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled?"currentColor":"none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <polygon points="12 2 15 9 22 9.3 16.5 14 18.3 21 12 17.3 5.7 21 7.5 14 2 9.3 9 9"/>
  </svg>
);
const IcSparkle = (p) => <Icon {...p}><path d="M12 3v6"/><path d="M12 15v6"/><path d="M3 12h6"/><path d="M15 12h6"/></Icon>;

/* ─── BottomNav ─── */
function BottomNav({ tab, onTab }) {
  const tabs = [
    { id: "cave",     label: "Cave",     Ic: IcHome  },
    { id: "carnet",   label: "Carnet",   Ic: IcBook  },
    { id: "liste",    label: "Liste",    Ic: IcList  },
    { id: "accords",  label: "Accords",  Ic: IcDish  },
    { id: "reglages", label: "Réglages", Ic: IcGear  },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map(({id,label,Ic}) => {
        const active = tab === id;
        return (
          <button key={id} className={"nav-btn" + (active ? " active" : "")} onClick={() => onTab(id)}>
            <Ic size={22} sw={active ? 2.2 : 1.6} stroke={active ? "var(--ink)" : "var(--ink-soft)"} />
            <span className="nav-lbl" style={{color: active ? "var(--ink)" : "var(--ink-soft)", fontWeight: active ? 700 : 500}}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ─── FAB ─── */
function FAB({ onClick }) {
  return (
    <button className="fab" onClick={onClick} aria-label="Ajouter une bouteille">
      <IcPlus size={26} sw={2.2} stroke="var(--bg)" />
    </button>
  );
}

/* ─── Watermark — gros mot italique top-right ─── */
function Watermark({ children, color, size, top = 8, right = 10, opacity }) {
  const op = opacity != null ? opacity : "var(--watermark-opacity, 0.22)";
  // Adaptive: si size n'est pas fourni, on s'appuie sur container query (parent en container-type: inline-size)
  // Tailles réduites pour que le mot tienne entièrement dans la tuile, sans débord.
  const fontSize = size != null
    ? (typeof size === "number" ? `${size}px` : size)
    : "clamp(20px, 11cqi, 46px)";
  return (
    <span aria-hidden style={{
      position: "absolute", top, right,
      fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
      fontSize, lineHeight: 1, color, opacity: op,
      pointerEvents: "none", letterSpacing: "-0.01em", whiteSpace: "nowrap",
      maxWidth: "calc(100% - 16px)",
    }}>{children}</span>
  );
}

/* ─── WineTile (Liste) ─── */
function WineTile({ wine, onClick, density = "regular" }) {
  const surf = wineSurface[wine.type] || wineSurface.red;
  const st = statusMeta[wine.status];
  const pad = density === "compact" ? 11 : density === "comfy" ? 16 : 13;
  const titleSize = density === "compact" ? 17 : density === "comfy" ? 21 : 19;
  return (
    <button onClick={onClick} className="wine-tile" style={{
      background: surf.bg, color: surf.fg,
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: pad,
      position: "relative", overflow: "hidden", textAlign: "left",
      display: "flex", flexDirection: "column", gap: 10, width: "100%", cursor: "pointer",
      containerType: "inline-size",
    }}>
      <Watermark color={surf.fg}>{surf.label}</Watermark>

      {/* Top row */}
      <div style={{ position: "relative", zIndex: 1, paddingRight: 56 }}>
        <div className="kicker" style={{ color: surf.fg, opacity: 0.7 }}>
          {wine.region} · {wine.appellation}
        </div>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
          fontSize: titleSize, lineHeight: 1.1, marginTop: 2,
          textWrap: "balance", color: surf.fg,
        }}>
          {wine.name}
        </div>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 8,
          marginTop: 4, color: surf.fg, opacity: 0.85,
          fontFamily: "var(--font-sans)",
        }}>
          <span style={{ fontSize: 11, fontWeight: 600 }}>×{wine.qty}</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{wine.millesime}</span>
        </div>
      </div>

      {/* Cycle row */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div style={{display: "flex", alignItems: "center", gap: 8}}>
            <span className="label-tracked" style={{ color: surf.fg }}>{st.label}</span>
            {wine.status === "urgent" && <span style={{fontFamily:"var(--font-hand)", fontStyle:"var(--hand-style)", fontSize:13, color: surf.fg}}>↗ pic atteint</span>}
          </div>
          <span style={{ fontSize: 10, fontVariantNumeric: "tabular-nums", color: surf.fg, opacity: 0.85 }}>
            {wine.cyclePct}%
          </span>
        </div>
        <ProgressBar pct={wine.cyclePct} peakPct={wine.peakPct} fg={surf.fg} />
      </div>
    </button>
  );
}

/* ─── ProgressBar (cycle) ─── */
function ProgressBar({ pct, peakPct = null, fg, height = 6 }) {
  return (
    <div style={{
      height, border: `1px solid ${fg}`, borderRadius: 999,
      background: "transparent", position: "relative", overflow: "visible",
    }}>
      <div style={{
        position: "absolute", inset: 0, borderRadius: 999, overflow: "hidden",
      }}>
        <div style={{ width: "100%", height: "100%", background: fg, opacity: 0.22 }} />
        <div style={{
          position: "absolute", top: 0, left: 0, bottom: 0,
          width: `${pct}%`, background: fg,
        }} />
      </div>
      {peakPct != null && (
        <span style={{
          position: "absolute", left: `${peakPct}%`, top: -3, bottom: -3,
          width: 1.5, background: fg, opacity: 0.55, transform: "translateX(-0.75px)",
        }}/>
      )}
    </div>
  );
}

/* ─── BigTile (dashboard) ─── */
function BigTile({
  bg = "var(--paper-2)", fg = "var(--ink)", watermark, label, big, sub,
  children, onClick, style = {}, shadow = true, accent = false,
}) {
  return (
    <div onClick={onClick} style={{
      background: bg, color: fg,
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: shadow ? (accent ? "var(--shadow-accent)" : "var(--shadow-hard)") : "none",
      padding: 16, position: "relative", overflow: "hidden",
      cursor: onClick ? "pointer" : "default",
      containerType: "inline-size",
      ...style,
    }}>
      {watermark && <Watermark color={fg}>{watermark}</Watermark>}
      {label && <div className="label-tracked" style={{ color: fg, opacity: 0.78 }}>{label}</div>}
      {big != null && (
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
          fontSize: 48, lineHeight: 1, marginTop: 6, color: fg, position: "relative", zIndex: 1,
        }}>{big}</div>
      )}
      {sub && <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4, fontFamily: "var(--font-sans)" }}>{sub}</div>}
      {children}
    </div>
  );
}

/* ─── CycleChart — courbe en cloche SVG ─── */
function CycleChart({ wine, fg = "var(--ink)", accent = "var(--rouge)" }) {
  const W = 320, H = 150, PAD = 16;
  // Bell curve: M (peakPct as x), with start/end at edges
  const pk = wine.peakPct; // 0–100 percent
  const cur = wine.cyclePct;
  const xOf = (p) => PAD + (W - PAD*2) * (p/100);
  const yPeak = 18;
  const yBase = H - 32;
  // smooth path: M start L start C cp1 cp2 peak C cp3 cp4 end
  const x0 = PAD, x1 = W - PAD;
  const xPk = xOf(pk);
  const path = `
    M ${x0} ${yBase}
    C ${x0 + (xPk-x0)*0.35} ${yBase-2} ${xPk - (xPk-x0)*0.45} ${yPeak+4} ${xPk} ${yPeak}
    C ${xPk + (x1-xPk)*0.45} ${yPeak+4} ${x1 - (x1-xPk)*0.35} ${yBase-2} ${x1} ${yBase}
  `;
  // current y on curve — interpolate via path point sampling
  const ref = useRef(null);
  const [curPt, setCurPt] = useState({x: xOf(cur), y: yBase});
  useEffect(() => {
    if (!ref.current) return;
    const len = ref.current.getTotalLength();
    // binary search for x ≈ xOf(cur)
    const target = xOf(cur);
    let lo = 0, hi = len, mid;
    for (let i=0; i<22; i++) {
      mid = (lo+hi)/2;
      const p = ref.current.getPointAtLength(mid);
      if (p.x < target) lo = mid; else hi = mid;
    }
    const p = ref.current.getPointAtLength(mid);
    setCurPt({x: p.x, y: p.y});
  }, [cur, pk]);

  const peakY = yPeak;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", overflow: "visible" }}>
      {/* baseline */}
      <line x1={PAD} y1={yBase} x2={W-PAD} y2={yBase} stroke={fg} strokeWidth="1" opacity="0.18" />
      {/* aire sous courbe */}
      <path d={`${path} L ${x1} ${yBase} L ${x0} ${yBase} Z`} fill={accent} opacity="0.18" />
      {/* courbe */}
      <path ref={ref} d={path} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" />
      {/* today line */}
      <line x1={curPt.x} y1={yBase} x2={curPt.x} y2={curPt.y} stroke={fg} strokeWidth="1" strokeDasharray="3 3" opacity="0.7" />
      <circle cx={curPt.x} cy={curPt.y} r="4" fill={fg} />
      <text x={curPt.x} y={yBase + 22} textAnchor="middle" style={{ fontFamily: "var(--font-hand)", fontStyle: "var(--hand-style)", fontSize: 13, fill: fg }}>aujourd'hui</text>
      {/* peak marker */}
      <circle cx={xOf(pk)} cy={peakY} r="6" fill="var(--blanc)" stroke={fg} strokeWidth="1.8" />
      <text x={xOf(pk)} y={peakY - 10} textAnchor="middle" style={{ fontFamily: "var(--font-hand)", fontStyle: "var(--hand-style)", fontSize: 14, fontWeight: 500, fill: fg }}>★ pic {wine.peakYear}</text>
      {/* axis ticks */}
      <text x={x0} y={H-4} textAnchor="start" style={{ fontFamily: "var(--font-sans)", fontSize: 9, fill: fg, opacity: 0.6 }}>{wine.birthYear}</text>
      <text x={x1} y={H-4} textAnchor="end" style={{ fontFamily: "var(--font-sans)", fontSize: 9, fill: fg, opacity: 0.6 }}>{wine.endYear}</text>
    </svg>
  );
}

/* ─── ApogeeBar ─── */
function ApogeeBar({ wine, fg = "var(--ink)" }) {
  const cur = wine.cyclePct;
  const peak = wine.peakPct;
  // 3 zones: jeunesse 0–30, apogée 30–80, déclin 80–100 (visual reference)
  const Z = [
    { label: "jeunesse", from: 0,  to: 30, bg: "var(--garde)" },
    { label: "apogée",   from: 30, to: 80, bg: "var(--apogee)" },
    { label: "déclin",   from: 80, to: 100, bg: "var(--urgent)" },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ position: "relative", height: 10, border: `1.5px solid ${fg}`, borderRadius: 999, display: "flex", overflow: "hidden" }}>
        {Z.map((z, i) => (
          <div key={i} style={{
            flex: (z.to - z.from), background: z.bg, opacity: 0.22,
            borderRight: i < 2 ? `1px solid ${fg}` : "none",
          }}/>
        ))}
        {/* fill to current */}
        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: `${cur}%`,
          background: fg, opacity: 0.9, mixBlendMode: "multiply",
        }} />
        {/* peak tick */}
        <span style={{
          position: "absolute", left: `${peak}%`, top: -3, bottom: -3, width: 2,
          background: fg, transform: "translateX(-1px)",
        }}/>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: fg, opacity: 0.7, fontSize: 9, fontFamily: "var(--font-sans)" }}>
        <span>jeunesse</span>
        <span>apogée</span>
        <span>déclin</span>
      </div>
    </div>
  );
}

/* ─── StatPill (Détail) ─── */
function StatPill({ label, big, sub }) {
  return (
    <div style={{
      background: "var(--bg)", color: "var(--ink)",
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: "10px 12px", flex: 1,
    }}>
      <div className="label-tracked">{label}</div>
      <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600, fontSize: 26, lineHeight: 1, marginTop: 4 }}>{big}</div>
      {sub && <div style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

/* ─── Filter Pill ─── */
function FilterPill({ label, active, onClick, accent = false }) {
  return (
    <button onClick={onClick} style={{
      flexShrink: 0,
      padding: "7px 13px",
      borderRadius: 999,
      border: "var(--border-hard)",
      background: active ? "var(--ink)" : (accent ? "var(--rouge)" : "var(--bg)"),
      color: active ? "var(--bg)" : (accent ? "var(--rouge-fg)" : "var(--ink)"),
      fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 11,
      letterSpacing: "0.02em",
      cursor: "pointer",
      boxShadow: active ? "var(--shadow-hard)" : "none",
      transition: "transform .1s",
    }} className="press">{label}</button>
  );
}

/* ─── Star rating ─── */
function Stars({ n, size = 14, color = "currentColor" }) {
  return (
    <span style={{display: "inline-flex", gap: 2, color}}>
      {[1,2,3,4,5].map(i => <IcStar key={i} size={size} filled={i <= n} />)}
    </span>
  );
}

/* ─── BottleSilhouette (SVG placeholder) ─── */
function Bottle({ color = "var(--ink)", w = 38, h = 86 }) {
  return (
    <svg width={w} height={h} viewBox="0 0 38 86" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round">
      <path d="M14 4h10v18c0 1.5 6 5 6 14v44c0 2-1.5 4-4 4H12c-2.5 0-4-2-4-4V36c0-9 6-12.5 6-14V4z"/>
      <rect x="9.5" y="44" width="19" height="22" fill={color} opacity="0.18" rx="1"/>
      <line x1="11" y1="50" x2="27" y2="50" strokeWidth="0.8" opacity="0.5"/>
    </svg>
  );
}

/* expose */
Object.assign(window, {
  WineTile, BigTile, ProgressBar, CycleChart, ApogeeBar,
  BottomNav, FAB, FilterPill, StatPill, Stars, Watermark, Bottle,
  IcHome, IcBook, IcList, IcDish, IcGear, IcPlus, IcSearch, IcArrow, IcBack, IcHeart, IcCam, IcStar, IcSparkle,
  wineSurface, statusMeta,
});
