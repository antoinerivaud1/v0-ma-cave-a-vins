/* Synthèse v1 — App orchestrator */
const { useState: useSt, useEffect: useEf } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#B33A2E",
  "fontSystem": "classique",
  "density": "regular",
  "showWatermarks": true,
  "handwritten": false
}/*EDITMODE-END*/;

const ACCENT_OPTIONS = [
  ["#B33A2E", "#F5EFE2", "#1A1411"],
  ["#7A1F1F", "#F5EFE2", "#1A1411"],
  ["#C1452A", "#F5EFE2", "#1A1411"],
  ["#5B2C5F", "#F5EFE2", "#1A1411"],
];

/* Curated font pairs (display + sans) */
const FONT_SYSTEMS = {
  classique:  { label: "Classique",  display: "Cormorant Garamond", sans: "Inter",         note: "équilibré, intemporel" },
  editorial:  { label: "Éditorial",  display: "Instrument Serif",   sans: "Inter Tight",   note: "magazine, mono-poids" },
  papier:     { label: "Papier",     display: "EB Garamond",        sans: "Manrope",       note: "doux, livresque" },
  moderne:    { label: "Moderne",    display: "Fraunces",           sans: "DM Sans",       note: "expressif, géométrique" },
  contemporain: { label: "Contemporain", display: "Playfair Display", sans: "Space Grotesk", note: "high-contrast, vif" },
};
const FONT_SYSTEM_KEYS = Object.keys(FONT_SYSTEMS);

const DENSITY_OPTIONS = ["compact", "regular", "comfy"];

function App() {
  const [tweaks, setTweak] = window.useTweaks(TWEAK_DEFAULTS);
  const [tab, setTab] = useSt("cave");
  const [detail, setDetail] = useSt(null); // wine id when open

  // Apply tweaks → CSS vars
  useEf(() => {
    const r = document.documentElement;
    const accent = Array.isArray(tweaks.accent) ? tweaks.accent[0] : tweaks.accent;
    r.style.setProperty("--rouge", accent);
    r.style.setProperty("--apogee", accent);
    r.style.setProperty("--shadow-accent", `3px 3px 0 0 ${accent}`);

    const sys = FONT_SYSTEMS[tweaks.fontSystem] || FONT_SYSTEMS.classique;
    r.style.setProperty("--font-display", `"${sys.display}", serif`);
    r.style.setProperty("--font-sans", `"${sys.sans}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`);
    // Annotations manuscrites : Caveat si activé, sinon italic du display
    r.style.setProperty("--font-hand", tweaks.handwritten
      ? `"Caveat", cursive`
      : `"${sys.display}", serif`);
    r.style.setProperty("--hand-style", tweaks.handwritten ? "normal" : "italic");

    r.style.setProperty("--watermark-opacity", tweaks.showWatermarks ? "0.22" : "0");
  }, [tweaks]);

  const wines = window.WINES;
  const openWine = (w) => setDetail(w.id);
  const closeDetail = () => setDetail(null);
  const wineOpen = detail ? wines.find(w => w.id === detail) : null;

  // when on detail, dim bottom nav slightly; tap nav exits detail
  const handleTab = (id) => {
    setDetail(null);
    setTab(id);
  };

  const screen = wineOpen
    ? <ScreenDetail wine={wineOpen} onBack={closeDetail} />
    : tab === "cave"     ? <ScreenCave wines={wines} onOpenWine={openWine} onFab={() => {}} />
    : tab === "liste"    ? <ScreenListe wines={wines} onOpenWine={openWine} density={tweaks.density} />
    : tab === "carnet"   ? <ScreenCarnet wines={wines} onOpenWine={openWine} />
    : tab === "accords"  ? <ScreenAccords wines={wines} onOpenWine={openWine} />
    : tab === "reglages" ? <ScreenReglages />
    : null;

  return (
    <>
      <div className="phone-shell" data-screen-label={
        wineOpen ? "Détail" :
        tab === "cave" ? "01 Cave" :
        tab === "liste" ? "02 Liste" :
        tab === "carnet" ? "03 Carnet" :
        tab === "accords" ? "04 Accords" : "05 Réglages"
      }>
        <div className="phone">
          {/* status bar */}
          <div className="status-bar">
            <span>9:41</span>
            <div className="status-icons">
              <svg width="16" height="10" viewBox="0 0 16 10" fill="none"><path d="M1 7h2v2H1zM5 5h2v4H5zM9 3h2v6H9zM13 1h2v8h-2z" fill="currentColor"/></svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none"><path d="M7 1.5C5 1.5 3.4 2.2 2 3.5l1 1c1.1-1 2.5-1.5 4-1.5s2.9.5 4 1.5l1-1C10.6 2.2 9 1.5 7 1.5z M7 4.5C6 4.5 5 4.9 4.3 5.7l1 1c.5-.5 1.1-.7 1.7-.7s1.2.2 1.7.7l1-1C8.9 4.9 8 4.5 7 4.5z M7 7.5c-.5 0-.9.2-1.3.5L7 9.5l1.3-1.5C7.9 7.7 7.5 7.5 7 7.5z" fill="currentColor"/></svg>
              <span className="battery"><span className="battery-fill"/></span>
            </div>
          </div>
          <div className="screen" key={wineOpen ? "detail-"+wineOpen.id : tab}>
            {screen}
          </div>
          {!wineOpen && tab !== "reglages" && <FAB onClick={() => alert("Ajouter une bouteille")} />}
          <BottomNav tab={wineOpen ? null : tab} onTab={handleTab} />
        </div>
      </div>

      {/* Tweaks panel */}
      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection title="Accent">
            <window.TweakColor
              label="Couleur du rouge"
              value={tweaks.accent}
              onChange={(v) => setTweak("accent", v)}
              options={ACCENT_OPTIONS}
            />
          </window.TweakSection>
          <window.TweakSection title="Typographie">
            <window.TweakSelect
              label="Système typographique"
              value={tweaks.fontSystem}
              onChange={(v) => setTweak("fontSystem", v)}
              options={FONT_SYSTEM_KEYS.map(k => ({ value: k, label: `${FONT_SYSTEMS[k].label} — ${FONT_SYSTEMS[k].display} + ${FONT_SYSTEMS[k].sans}` }))}
            />
            <window.TweakToggle
              label="Annotations manuscrites (Caveat)"
              value={tweaks.handwritten}
              onChange={(v) => setTweak("handwritten", v)}
            />
          </window.TweakSection>
          <window.TweakSection title="Cartes">
            <window.TweakRadio
              label="Densité"
              value={tweaks.density}
              onChange={(v) => setTweak("density", v)}
              options={DENSITY_OPTIONS}
            />
            <window.TweakToggle
              label="Filigrane typographique"
              value={tweaks.showWatermarks}
              onChange={(v) => setTweak("showWatermarks", v)}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
