/* Synthèse v1 — Écrans */
/* Imports: window globals from components.jsx + data.js */

const { useState: useS, useMemo: useM, useEffect: useE } = React;

/* ════════════════════════════════════════════
   DASHBOARD — Cave
════════════════════════════════════════════ */
function ScreenCave({ wines, onOpenWine, onFab }) {
  const total = wines.reduce((s, w) => s + w.qty, 0);
  const urgent = wines.filter(w => w.status === "urgent").length;
  const apogee = wines.filter(w => w.status === "apogee").length;
  const aBoire = urgent + apogee;
  const tasted = window.TASTINGS.length;
  const tastedThisMonth = window.TASTINGS.filter(t => t.date.startsWith("2026-04")).length;

  // Pioche du soir = highest cyclePct that is not urgent (close to but at peak)
  const pioche = useM(() => {
    return [...wines].sort((a,b) => Math.abs(b.cyclePct - 65) > Math.abs(a.cyclePct - 65) ? -1 : 1)[0]
        || wines.find(w => w.status === "apogee") || wines[0];
  }, [wines]);

  const headline = urgent > 0
    ? `${urgent} vin${urgent>1?"s":""} arrive${urgent>1?"nt":""} à leur pic.`
    : aBoire > 0
      ? `Une belle soirée vous attend.`
      : `Votre cave dort tranquillement.`;

  return (
    <div className="screen-pad">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8 }}>
        <span className="hand-greeting">Salut Antoine 👋</span>
        <div style={{
          width: 34, height: 34, borderRadius: "50%",
          background: "var(--ink)", color: "var(--bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 12,
          border: "var(--border-hard)",
        }}>AR</div>
      </div>
      <h1 className="h1" style={{ marginTop: 10, marginBottom: 4 }}>{headline}</h1>

      {/* Hero — La cave */}
      <BigTile
        bg="var(--rouge)" fg="var(--rouge-fg)"
        watermark="cave"
        label="VOTRE CAVE"
        big={total}
        sub={`bouteilles · ${new Set(wines.map(w=>w.cellar)).size} caves`}
        accent
        style={{ marginTop: 10 }}
      >
        <div style={{ display: "flex", gap: 8, marginTop: 14, position: "relative", zIndex: 1 }}>
          <MiniChip label={`${wines.length} étiquettes`} fg="var(--rouge-fg)" />
          <MiniChip label={`${urgent} urgents`} fg="var(--rouge-fg)" />
        </div>
      </BigTile>

      {/* Grid 2 tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
        <BigTile
          bg="var(--blanc)" fg="var(--blanc-fg)"
          watermark="ouvrir"
          label="À OUVRIR"
          big={aBoire}
          sub="à leur pic ou bientôt"
        >
          <div style={{ marginTop: 12, position: "relative", zIndex: 1 }}>
            <ProgressBar pct={Math.round((aBoire/wines.length)*100)} fg="var(--blanc-fg)" height={5} />
          </div>
        </BigTile>
        <RepartitionTile wines={wines} />
      </div>

      {/* Pioche du soir */}
      <div style={{ marginTop: 16 }}>
        <div className="section-row">
          <h2 className="h2">La pioche du soir</h2>
          <span className="hand-mini">choisie pour vous</span>
        </div>
        <PiocheCard wine={pioche} onClick={() => onOpenWine(pioche)} />
      </div>

      {/* Le saviez-vous */}
      <div style={{ marginTop: 16 }}>
        <BigTile bg="var(--paper-2)" fg="var(--ink)" label="LE SAVIEZ-VOUS ?" shadow={false} style={{ border: "1.5px dashed var(--ink)", boxShadow: "none" }}>
          <p style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
            fontSize: 18, lineHeight: 1.3, marginTop: 6, color: "var(--ink)",
            textWrap: "pretty",
          }}>
            « Un Bordeaux dort 5 ans avant de parler. Vos Margaux 2008 entrent dans la conversation. »
          </p>
          <div style={{ marginTop: 8 }}>
            <span className="hand-mini">— votre sommelier</span>
          </div>
        </BigTile>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

function MiniChip({ label, fg }) {
  return (
    <span style={{
      fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 600,
      color: fg, padding: "3px 8px",
      border: `1.5px solid ${fg}`, borderRadius: 999, opacity: 0.9,
    }}>{label}</span>
  );
}

/* ─── Répartition par type — camembert ─── */
function RepartitionTile({ wines }) {
  const order = ["red", "white", "sparkling", "rose"];
  const data = order
    .map(t => ({
      type: t,
      label: wineSurface[t].label,
      color: wineSurface[t].bg,
      value: wines.filter(w => w.type === t).reduce((s, w) => s + w.qty, 0),
    }))
    .filter(d => d.value > 0);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;

  const C = 46, R = 40;
  let angle = -Math.PI / 2;
  const slices = data.map(d => {
    const frac = d.value / total;
    const start = angle;
    const end = angle + frac * 2 * Math.PI;
    angle = end;
    const x1 = C + R * Math.cos(start), y1 = C + R * Math.sin(start);
    const x2 = C + R * Math.cos(end), y2 = C + R * Math.sin(end);
    const large = frac > 0.5 ? 1 : 0;
    const path = frac >= 0.999
      ? `M ${C} ${C - R} A ${R} ${R} 0 1 1 ${C - 0.01} ${C - R} Z`
      : `M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`;
    return { ...d, path, pct: Math.round(frac * 100) };
  });

  return (
    <div style={{
      background: "var(--paper-2)", color: "var(--ink)",
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: 14,
      position: "relative", overflow: "hidden", containerType: "inline-size",
      display: "flex", flexDirection: "column",
    }}>
      <Watermark color="var(--ink)" opacity={0.1}>vins</Watermark>
      <div className="label-tracked" style={{ color: "var(--ink)", opacity: 0.78, position: "relative", zIndex: 1 }}>RÉPARTITION</div>
      <div style={{ display: "flex", justifyContent: "center", margin: "10px 0 12px", position: "relative", zIndex: 1 }}>
        <svg width="92" height="92" viewBox="0 0 92 92" style={{ display: "block" }}>
          {slices.map(s => (
            <path key={s.type} d={s.path} fill={s.color} stroke="var(--ink)" strokeWidth="1.5" strokeLinejoin="round" />
          ))}
        </svg>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5, position: "relative", zIndex: 1 }}>
        {slices.map(s => (
          <div key={s.type} style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ width: 9, height: 9, borderRadius: 2, background: s.color, border: "1.5px solid var(--ink)", flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600, color: "var(--ink)", flex: 1 }}>{s.label}</span>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--ink)" }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PiocheCard({ wine, onClick }) {
  const surf = wineSurface[wine.type] || wineSurface.red;
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left",
      background: "var(--paper-2)", color: "var(--ink)",
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: 14, marginTop: 6,
      position: "relative", overflow: "hidden", cursor: "pointer",
      display: "flex", gap: 14, alignItems: "stretch",
      containerType: "inline-size",
    }}>
      <Watermark color={surf.bg} opacity={0.16}>{surf.label}</Watermark>
      <div style={{
        width: 56, background: surf.bg, color: surf.fg,
        border: "1.5px solid var(--ink)", borderRadius: 10,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <Bottle color={surf.fg} w={32} h={66} />
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div className="label-tracked" style={{ color: "var(--ink-soft)" }}>POUR CE SOIR</div>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
          fontSize: 20, lineHeight: 1.1, marginTop: 2, color: "var(--ink)",
          textWrap: "balance",
        }}>{wine.name}</div>
        <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 3 }}>
          {wine.appellation} · <span style={{fontWeight:700, color:"var(--ink)"}}>{wine.millesime}</span>
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <ProgressBar pct={wine.cyclePct} peakPct={wine.peakPct} fg="var(--ink)" height={5} />
          </div>
          <span style={{ fontSize: 9, fontFamily: "var(--font-sans)", fontWeight: 600, letterSpacing: "0.16em", color: "var(--ink-soft)" }}>
            CYCLE · {wine.cyclePct}% ★
          </span>
        </div>
        <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="hand-mini">fenêtre courte</span>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            background: "var(--ink)", color: "var(--bg)",
            padding: "5px 12px", borderRadius: 999,
            fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 600,
          }}>Ouvrir ce soir <IcArrow size={13} sw={2.4} /></span>
        </div>
      </div>
    </button>
  );
}

/* ════════════════════════════════════════════
   LISTE
════════════════════════════════════════════ */
function ScreenListe({ wines, onOpenWine, density, accentTw }) {
  const [filter, setFilter] = useS("all");
  const filters = [
    { id: "all",       label: "Tous",     match: () => true },
    { id: "red",       label: "Rouges",   match: w => w.type === "red" },
    { id: "white",     label: "Blancs",   match: w => w.type === "white" },
    { id: "sparkling", label: "Bulles",   match: w => w.type === "sparkling" },
    { id: "drink",     label: "À boire",  match: w => w.status === "urgent" || w.status === "apogee" },
  ];
  const filtered = useM(() => {
    const f = filters.find(f => f.id === filter);
    return [...wines].filter(f.match).sort((a, b) => b.cyclePct - a.cyclePct);
  }, [wines, filter]);

  const total = wines.reduce((s, w) => s + w.qty, 0);

  return (
    <div className="screen-pad">
      {/* Header */}
      <div style={{ paddingTop: 8, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div className="kicker">{total} BOUTEILLES · TRIÉ PAR CYCLE</div>
          <h1 className="h1" style={{ marginTop: 4 }}>Toute la cave</h1>
        </div>
        <button style={{
          width: 38, height: 38, border: "var(--border-hard)", borderRadius: 12,
          background: "var(--bg)", display: "grid", placeItems: "center",
          boxShadow: "var(--shadow-hard)", cursor: "pointer",
        }}><IcSearch size={18} stroke="var(--ink)" /></button>
      </div>

      {/* Filter pills scrollable */}
      <div style={{
        display: "flex", gap: 8, overflowX: "auto", padding: "14px 0 8px",
        marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        scrollbarWidth: "none",
      }} className="no-scroll">
        {filters.map(f => (
          <FilterPill key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />
        ))}
      </div>

      {/* Tiles */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap-card)", marginTop: 4 }}>
        {filtered.map(w => (
          <WineTile key={w.id} wine={w} onClick={() => onOpenWine(w)} density={density} />
        ))}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

/* ════════════════════════════════════════════
   DÉTAIL
════════════════════════════════════════════ */
function ScreenDetail({ wine, onBack }) {
  const surf = wineSurface[wine.type] || wineSurface.red;
  return (
    <div style={{ background: "var(--bg)", paddingBottom: 12 }}>
      {/* Poster */}
      <div style={{
        background: surf.bg, color: surf.fg,
        borderBottom: "var(--border-hard)", padding: "16px 16px 24px",
        position: "relative", overflow: "hidden",
      }}>
        <Watermark color={surf.fg} opacity={0.18}>{surf.label}</Watermark>
        {/* Back / heart */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
          <button onClick={onBack} style={{
            background: "none", border: "none", padding: 0, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            fontFamily: "var(--font-hand)", fontStyle: "var(--hand-style)", fontSize: 17, color: surf.fg,
          }}><IcBack size={18} stroke={surf.fg} /> Retour</button>
          <button style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: surf.fg }}>
            <IcHeart size={22} stroke={surf.fg} />
          </button>
        </div>

        {/* Big millésime */}
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
          fontSize: 86, lineHeight: 0.95, marginTop: 18, color: surf.fg, position: "relative", zIndex: 1,
          fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em",
        }}>{wine.millesime}</div>

        <div className="label-tracked" style={{ color: surf.fg, opacity: 0.85, marginTop: 8, position: "relative", zIndex: 1 }}>
          {wine.appellation} · {wine.region}
        </div>
        <h1 style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
          fontSize: 28, lineHeight: 1.05, marginTop: 4, color: surf.fg, position: "relative", zIndex: 1,
          textWrap: "balance",
        }}>{wine.name}</h1>
        <div style={{ fontSize: 12, color: surf.fg, opacity: 0.85, marginTop: 4, position: "relative", zIndex: 1 }}>
          {wine.domain}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ padding: "16px 16px 0", display: "flex", gap: 10 }}>
        <StatPill label="EN CAVE" big={wine.qty} sub="bouteilles" />
        <StatPill label="NOTÉ" big={wine.note ? `${wine.note}/5` : "—"} sub={wine.note ? "★".repeat(wine.note) : "pas encore"} />
        <StatPill label="GARDE" big={`${Math.max(0, wine.endYear - 2026)}a`} sub={`jusqu'en ${wine.endYear}`} />
      </div>

      {/* CYCLE DE VIE */}
      <div style={{ padding: "16px 16px 0" }}>
        <BigTile bg="var(--bg)" fg="var(--ink)" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div className="label-tracked">CYCLE DE VIE</div>
              <div style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
                fontSize: 36, lineHeight: 1, marginTop: 4,
              }}>{wine.cyclePct}%</div>
              <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
                Pic de dégustation : <span style={{ color: "var(--ink)", fontWeight: 600 }}>{wine.peakYear}</span>
              </div>
            </div>
            <span style={{
              fontFamily: "var(--font-sans)", fontSize: 10, fontWeight: 700, letterSpacing: "0.15em",
              padding: "5px 10px", border: "1.5px solid var(--ink)", borderRadius: 999,
              background: statusMeta[wine.status].color, color: "var(--rouge-fg)",
            }}>{statusMeta[wine.status].label}</span>
          </div>
          <div style={{ marginTop: 14 }}>
            <CycleChart wine={wine} fg="var(--ink)" accent={surf.bg} />
          </div>
          <div style={{ marginTop: 6 }}>
            <ApogeeBar wine={wine} fg="var(--ink)" />
          </div>
        </BigTile>
      </div>

      {/* Recommandation */}
      <div style={{ padding: "12px 16px 0" }}>
        <BigTile bg="var(--blanc)" fg="var(--blanc-fg)" style={{ padding: 14 }}>
          <Watermark color="var(--blanc-fg)" opacity={0.16}>conseil</Watermark>
          <div style={{ position: "relative", zIndex: 1 }}>
            <span className="hand-mini" style={{ fontSize: 17, color: "var(--blanc-fg)" }}>↗ recommandation</span>
            <p style={{
              fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
              fontSize: 18, lineHeight: 1.3, marginTop: 6, color: "var(--blanc-fg)", textWrap: "pretty",
            }}>
              {wine.status === "urgent"
                ? "À ouvrir au plus vite — la fenêtre se referme."
                : wine.status === "apogee"
                  ? `À ouvrir d'ici ${Math.max(1, wine.endYear - 2026)} ans pour un pic de dégustation.`
                  : wine.yearsToPeak > 0
                    ? `Attendre encore ${wine.yearsToPeak} an${wine.yearsToPeak>1?"s":""}. La patience paie.`
                    : "À surveiller cette année."}
            </p>
          </div>
        </BigTile>
      </div>

      {/* Note */}
      {wine.note > 0 && (
        <div style={{ padding: "10px 16px 0" }}>
          <BigTile bg="var(--paper-2)" fg="var(--ink)" style={{ padding: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="label-tracked">VOTRE NOTE</span>
              <Stars n={wine.note} size={14} color="var(--apogee)" />
            </div>
            {wine.quote && (
              <p style={{
                fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
                fontSize: 17, lineHeight: 1.3, marginTop: 8, color: "var(--ink)", textWrap: "pretty",
              }}>« {wine.quote} »</p>
            )}
          </BigTile>
        </div>
      )}

      {/* CTA */}
      <div style={{ padding: "16px 16px 24px" }}>
        <button style={{
          width: "100%", padding: "14px 18px",
          background: "var(--ink)", color: "var(--bg)",
          border: "var(--border-hard)", borderRadius: 999,
          boxShadow: "var(--shadow-accent)",
          fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 14, letterSpacing: "0.02em",
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer",
        }} className="press">
          J'ouvre une bouteille <IcArrow size={16} sw={2.4} stroke="var(--bg)" />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════
   CARNET
════════════════════════════════════════════ */
function ScreenCarnet({ wines, onOpenWine }) {
  const tastings = window.TASTINGS;
  const avg = (tastings.reduce((s,t)=>s+t.note,0) / tastings.length).toFixed(1);
  const tastedWines = tastings.map(t => ({ tasting: t, wine: wines.find(w => w.id === t.wineId) }));

  return (
    <div className="screen-pad">
      <div style={{ paddingTop: 8 }}>
        <div className="kicker">CARNET DE DÉGUSTATION</div>
        <h1 className="h1" style={{ marginTop: 4 }}>Ce que j'ai goûté.</h1>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 14 }}>
        <BigTile bg="var(--rouge)" fg="var(--rouge-fg)" label="DÉGUSTÉS" big={tastings.length} sub="bouteilles ouvertes" watermark="carnet" accent />
        <BigTile bg="var(--paper-2)" fg="var(--ink)" label="NOTE MOYENNE" big={avg}
          sub={<Stars n={Math.round(avg)} size={11} color="var(--apogee)" />} />
      </div>

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {tastedWines.map(({tasting, wine}) => wine && (
          <TastingTile key={tasting.id} tasting={tasting} wine={wine} onClick={() => onOpenWine(wine)} />
        ))}
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function TastingTile({ tasting, wine, onClick }) {
  const surf = wineSurface[wine.type] || wineSurface.red;
  // Bg = wine surface tinted; we'll use a 'note color' too based on stars
  const noteColors = {
    5: "var(--apogee)", 4: "var(--blanc)", 3: "var(--paper-2)", 2: "var(--paper-2)", 1: "var(--paper-2)",
  };
  const date = new Date(tasting.date);
  const dateStr = date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: surf.bg, color: surf.fg,
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: 14,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", gap: 8,
      containerType: "inline-size",
    }}>
      <Watermark color={surf.fg} opacity={0.16}>{surf.label}</Watermark>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative", zIndex: 1 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="kicker" style={{ color: surf.fg, opacity: 0.7 }}>
            {dateStr.toUpperCase()} · {tasting.occasion.toUpperCase()}
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
            fontSize: 19, lineHeight: 1.1, marginTop: 3, color: surf.fg, textWrap: "balance",
          }}>{wine.name}</div>
          <div style={{ fontSize: 10, opacity: 0.75, marginTop: 3, fontFamily: "var(--font-sans)" }}>
            {wine.appellation} · <span style={{fontWeight: 700}}>{wine.millesime}</span>
          </div>
        </div>
        <Stars n={tasting.note} size={13} color={surf.fg} />
      </div>
      <p style={{
        position: "relative", zIndex: 1,
        fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 14,
        lineHeight: 1.3, color: surf.fg, opacity: 0.95, textWrap: "pretty",
        borderTop: `1px solid ${surf.fg}`, paddingTop: 8, marginTop: 4,
      }}>« {tasting.quote} »</p>
    </button>
  );
}

/* ════════════════════════════════════════════
   ACCORDS
════════════════════════════════════════════ */
function ScreenAccords({ wines, onOpenWine }) {
  const [q, setQ] = useS("");
  const pairings = window.PAIRINGS.map(p => ({...p, wine: wines.find(w => w.id === p.wineId)})).filter(p => p.wine);

  const suggestions = ["Côte de bœuf", "Saumon grillé", "Plateau de fromages", "Apéritif", "Risotto", "Volaille rôtie"];

  return (
    <div className="screen-pad">
      <div style={{ paddingTop: 8 }}>
        <div className="kicker">ACCORDS METS & VINS</div>
        <h1 className="h1" style={{ marginTop: 4 }}>Quel plat cuisinez-vous ?</h1>
      </div>

      <div style={{ marginTop: 14, display: "flex", gap: 8, alignItems: "stretch" }}>
        <div style={{
          flex: 1, display: "flex", alignItems: "center", gap: 8,
          background: "var(--paper-2)", color: "var(--ink)",
          border: "var(--border-hard)", borderRadius: 12, padding: "10px 12px",
          boxShadow: "var(--shadow-hard)",
        }}>
          <IcSearch size={16} stroke="var(--ink-soft)" />
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Ex. côte de bœuf, saumon…"
            style={{ flex: 1, border: "none", background: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--ink)" }} />
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, overflowX: "auto", marginTop: 12, marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16 }} className="no-scroll">
        {suggestions.map(s => <FilterPill key={s} label={s} active={q===s} onClick={() => setQ(s)} />)}
      </div>

      <div style={{ marginTop: 16 }}>
        <h2 className="h2" style={{ marginBottom: 8 }}>Sélection du sommelier</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {pairings.map(p => <PairingTile key={p.wineId} pairing={p} onClick={() => onOpenWine(p.wine)} />)}
        </div>
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function PairingTile({ pairing, onClick }) {
  const surf = wineSurface[pairing.wine.type] || wineSurface.red;
  return (
    <button onClick={onClick} style={{
      width: "100%", textAlign: "left", cursor: "pointer",
      background: surf.bg, color: surf.fg,
      border: "var(--border-hard)", borderRadius: "var(--radius-card)",
      boxShadow: "var(--shadow-hard)", padding: 14, position: "relative", overflow: "hidden",
      display: "flex", alignItems: "center", gap: 12,
      containerType: "inline-size",
    }}>
      <Watermark color={surf.fg} opacity={0.15}>{surf.label}</Watermark>
      <div style={{
        width: 56, height: 56, flexShrink: 0,
        border: `1.5px solid ${surf.fg}`, borderRadius: 12,
        display: "grid", placeItems: "center", position: "relative", zIndex: 1,
      }}>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 600,
          fontSize: 22, color: surf.fg, lineHeight: 1,
        }}>{pairing.score}</div>
        <div style={{ fontSize: 8, color: surf.fg, opacity: 0.8, letterSpacing: "0.1em", fontWeight: 600 }}>/ 100</div>
      </div>
      <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 1 }}>
        <div className="kicker" style={{ color: surf.fg, opacity: 0.75 }}>POUR : {pairing.dish.toUpperCase()}</div>
        <div style={{
          fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 500,
          fontSize: 19, lineHeight: 1.1, marginTop: 3, color: surf.fg, textWrap: "balance",
        }}>{pairing.wine.name}</div>
        <div style={{ fontSize: 10, opacity: 0.8, marginTop: 3, fontFamily: "var(--font-sans)" }}>
          {pairing.wine.appellation} · <span style={{fontWeight:700}}>{pairing.wine.millesime}</span>
        </div>
      </div>
      <IcArrow size={18} stroke={surf.fg} sw={2} />
    </button>
  );
}

/* ════════════════════════════════════════════
   RÉGLAGES
════════════════════════════════════════════ */
function ScreenReglages() {
  const rows = [
    { sec: "COMPTE", items: [
      { icon: "user", label: "Profil", sub: "Antoine R.", color: "var(--rouge)" },
      { icon: "crown", label: "Abonnement", sub: "Collectionneur · 6,99€/mois", color: "var(--blanc)" },
      { icon: "cave", label: "Mes caves", sub: "2 caves · synchronisées", color: "var(--bulle)" },
    ]},
    { sec: "DONNÉES", items: [
      { icon: "export", label: "Exporter (CSV)", sub: "Téléchargez votre cave", color: "var(--optimal)" },
      { icon: "import", label: "Importer", sub: "CSV, Excel", color: "var(--paper-2)" },
    ]},
    { sec: "PRÉFÉRENCES", items: [
      { icon: "bell", label: "Notifications", sub: "Pic de dégustation", color: "var(--rouge)", toggle: true },
      { icon: "lang", label: "Langue", sub: "Français", color: "var(--paper-2)" },
    ]},
  ];

  return (
    <div className="screen-pad">
      <div style={{ paddingTop: 8 }}>
        <div className="kicker">PARAMÈTRES</div>
        <h1 className="h1" style={{ marginTop: 4 }}>Votre cave, vos règles.</h1>
      </div>

      {rows.map((r, i) => (
        <div key={i} style={{ marginTop: 18 }}>
          <h2 className="label-tracked" style={{ marginBottom: 8 }}>{r.sec}</h2>
          <div style={{
            background: "var(--paper-2)", border: "var(--border-hard)", borderRadius: "var(--radius-card)",
            boxShadow: "var(--shadow-hard)", overflow: "hidden",
          }}>
            {r.items.map((it, j) => (
              <div key={j} style={{
                display: "flex", alignItems: "center", gap: 12, padding: 12,
                borderBottom: j < r.items.length - 1 ? "1.5px solid var(--ink)" : "none",
                cursor: "pointer",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                  background: it.color, border: "1.5px solid var(--ink)",
                  display: "grid", placeItems: "center",
                }}>
                  <SettingIcon name={it.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{it.label}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-soft)", marginTop: 1 }}>{it.sub}</div>
                </div>
                {it.toggle ? <Toggle on /> : <IcArrow size={16} stroke="var(--ink-soft)" />}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Zone de danger */}
      <div style={{ marginTop: 22 }}>
        <h2 className="label-tracked" style={{ color: "var(--urgent)", marginBottom: 8 }}>ZONE DE DANGER</h2>
        <button style={{
          width: "100%", padding: "12px 14px",
          background: "var(--paper-2)", color: "var(--urgent)",
          border: "var(--border-hard)", borderRadius: "var(--radius-card)",
          boxShadow: "3px 3px 0 0 var(--urgent)",
          fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600,
          textAlign: "left", cursor: "pointer",
        }}>Supprimer mon compte</button>
      </div>

      <div style={{ marginTop: 18, textAlign: "center", color: "var(--ink-faint)", fontSize: 11, fontFamily: "var(--font-display)", fontStyle: "italic" }}>
        Ma Cave à Vins · v1.0 — Synthèse
      </div>
      <div style={{ height: 24 }} />
    </div>
  );
}

function SettingIcon({ name }) {
  const s = { size: 16, sw: 1.8, stroke: "var(--ink)" };
  if (name === "user") return <Icon {...s}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7"/></Icon>;
  if (name === "crown") return <Icon {...s}><path d="M3 17l2-10 5 4 2-6 2 6 5-4 2 10z"/></Icon>;
  if (name === "cave") return <Icon {...s}><path d="M3 21V8l9-5 9 5v13"/><rect x="9" y="13" width="6" height="8"/></Icon>;
  if (name === "export") return <Icon {...s}><path d="M12 3v14"/><polyline points="6 9 12 3 18 9"/><line x1="3" y1="21" x2="21" y2="21"/></Icon>;
  if (name === "import") return <Icon {...s}><path d="M12 17V3"/><polyline points="6 11 12 17 18 11"/><line x1="3" y1="21" x2="21" y2="21"/></Icon>;
  if (name === "bell") return <Icon {...s}><path d="M18 16l-2-3V9a4 4 0 1 0-8 0v4l-2 3z"/><path d="M10 20a2 2 0 0 0 4 0"/></Icon>;
  if (name === "lang") return <Icon {...s}><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/></Icon>;
  return null;
}

function Toggle({ on }) {
  return (
    <span style={{
      width: 36, height: 20, borderRadius: 999,
      border: "1.5px solid var(--ink)",
      background: on ? "var(--ink)" : "var(--bg)",
      position: "relative", flexShrink: 0,
      transition: "background .15s",
    }}>
      <span style={{
        position: "absolute", top: 1, left: on ? 17 : 1,
        width: 14, height: 14, borderRadius: "50%",
        background: on ? "var(--bg)" : "var(--ink)",
        transition: "left .15s",
      }}/>
    </span>
  );
}

/* expose */
Object.assign(window, { ScreenCave, ScreenListe, ScreenDetail, ScreenCarnet, ScreenAccords, ScreenReglages });
