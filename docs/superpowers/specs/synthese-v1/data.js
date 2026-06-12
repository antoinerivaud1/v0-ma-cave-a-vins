/* Mock cave — Synthèse v1 */
/* Cycle de vie: birthYear → peakYear → endYear. Pct actuel calculé runtime. */
const CURRENT_YEAR = 2026;

const RAW_WINES = [
  {
    id: "w1",
    name: "Château Margaux",
    domain: "Premier Cru Classé",
    appellation: "Margaux",
    region: "Bordeaux",
    millesime: 2008,
    type: "red",
    qty: 2,
    birthYear: 2008, peakYear: 2028, endYear: 2040,
    note: 4,
    quote: "Cassis mûr, tannins fondus. Décanté 2h.",
    cellar: "Cave principale",
  },
  {
    id: "w2",
    name: "Pétrus",
    domain: "Pomerol",
    appellation: "Pomerol",
    region: "Bordeaux",
    millesime: 1998,
    type: "red",
    qty: 1,
    birthYear: 1998, peakYear: 2018, endYear: 2028,
    note: 5,
    quote: "Truffe, sous-bois, soyeux. À ouvrir vite.",
    cellar: "Cave principale",
  },
  {
    id: "w3",
    name: "Chablis Grand Cru Les Clos",
    domain: "Domaine William Fèvre",
    appellation: "Chablis",
    region: "Bourgogne",
    millesime: 2019,
    type: "white",
    qty: 3,
    birthYear: 2019, peakYear: 2026, endYear: 2032,
    note: 4,
    quote: "Minéral, tension citronnée, finale crayeuse.",
    cellar: "Cave principale",
  },
  {
    id: "w4",
    name: "Pol Roger Cuvée Sir Winston",
    domain: "Pol Roger",
    appellation: "Champagne",
    region: "Champagne",
    millesime: 2013,
    type: "sparkling",
    qty: 4,
    birthYear: 2013, peakYear: 2024, endYear: 2032,
    note: 4,
    quote: "Bulles fines, brioche, longueur.",
    cellar: "Cave principale",
  },
  {
    id: "w5",
    name: "Hermitage La Chapelle",
    domain: "Paul Jaboulet Aîné",
    appellation: "Hermitage",
    region: "Vallée du Rhône",
    millesime: 2015,
    type: "red",
    qty: 2,
    birthYear: 2015, peakYear: 2032, endYear: 2045,
    note: 4,
    quote: "Olive noire, garrigue, encore jeune.",
    cellar: "Cave secondaire",
  },
  {
    id: "w6",
    name: "Sancerre Les Monts Damnés",
    domain: "Henri Bourgeois",
    appellation: "Sancerre",
    region: "Vallée de la Loire",
    millesime: 2022,
    type: "white",
    qty: 6,
    birthYear: 2022, peakYear: 2026, endYear: 2030,
    note: 3,
    quote: "Fruit blanc, salin, gourmand.",
    cellar: "Cave principale",
  },
  {
    id: "w7",
    name: "Côte-Rôtie La Mouline",
    domain: "Guigal",
    appellation: "Côte-Rôtie",
    region: "Vallée du Rhône",
    millesime: 2011,
    type: "red",
    qty: 1,
    birthYear: 2011, peakYear: 2025, endYear: 2035,
    note: 5,
    quote: "Violette, lard, soyeux. Pic atteint.",
    cellar: "Cave principale",
  },
  {
    id: "w8",
    name: "Meursault Les Charmes",
    domain: "Coche-Dury",
    appellation: "Meursault",
    region: "Bourgogne",
    millesime: 2018,
    type: "white",
    qty: 2,
    birthYear: 2018, peakYear: 2028, endYear: 2035,
    note: 5,
    quote: "Noisette, beurré, droit.",
    cellar: "Cave principale",
  },
  {
    id: "w9",
    name: "Bandol Rouge",
    domain: "Domaine Tempier",
    appellation: "Bandol",
    region: "Provence",
    millesime: 2017,
    type: "red",
    qty: 3,
    birthYear: 2017, peakYear: 2027, endYear: 2037,
    note: 4,
    quote: "Mourvèdre dense, fruits noirs, structurel.",
    cellar: "Cave secondaire",
  },
  {
    id: "w10",
    name: "Krug Grande Cuvée",
    domain: "Krug",
    appellation: "Champagne",
    region: "Champagne",
    millesime: 2016,
    type: "sparkling",
    qty: 2,
    birthYear: 2016, peakYear: 2028, endYear: 2036,
    note: 0,
    quote: "",
    cellar: "Cave principale",
  },
  {
    id: "w11",
    name: "Saint-Émilion Grand Cru",
    domain: "Château Pavie",
    appellation: "Saint-Émilion",
    region: "Bordeaux",
    millesime: 2014,
    type: "red",
    qty: 4,
    birthYear: 2014, peakYear: 2028, endYear: 2040,
    note: 3,
    quote: "Concentré, boisé, à attendre encore.",
    cellar: "Cave principale",
  },
  {
    id: "w12",
    name: "Vouvray Le Mont",
    domain: "Domaine Huet",
    appellation: "Vouvray",
    region: "Vallée de la Loire",
    millesime: 2020,
    type: "white",
    qty: 5,
    birthYear: 2020, peakYear: 2030, endYear: 2050,
    note: 0,
    quote: "",
    cellar: "Cave secondaire",
  },
];

/* Compute cycle pct + status from years */
function enrich(w) {
  const totalSpan = w.endYear - w.birthYear;
  const age = CURRENT_YEAR - w.birthYear;
  const cyclePct = Math.max(0, Math.min(100, Math.round((age / totalSpan) * 100)));
  // peak position in cycle (0–100)
  const peakSpan = w.peakYear - w.birthYear;
  const peakPct = Math.round((peakSpan / totalSpan) * 100);
  // status
  let status = "garde";
  if (cyclePct > 85) status = "urgent";
  else if (cyclePct >= 50) status = "apogee";
  else if (cyclePct >= 30) status = "optimal";
  return { ...w, cyclePct, peakPct, status, age, yearsToPeak: w.peakYear - CURRENT_YEAR };
}

window.WINES = RAW_WINES.map(enrich);
window.CURRENT_YEAR = CURRENT_YEAR;

/* Tasting notes for Carnet */
window.TASTINGS = [
  { id: "t1", wineId: "w7", date: "2026-04-12", note: 5, occasion: "Anniv mariage", quote: "Sublime. Pic atteint, équilibre parfait." },
  { id: "t2", wineId: "w2", date: "2026-03-28", note: 5, occasion: "Dîner Marc & Léa", quote: "Truffe, sous-bois. Bouleversant." },
  { id: "t3", wineId: "w4", date: "2026-03-15", note: 4, occasion: "Réveillon", quote: "Brioche, longueur. Très grand." },
  { id: "t4", wineId: "w1", date: "2026-02-08", note: 4, occasion: "Soirée intimiste", quote: "Cassis mûr, tannins fondus. Décanté 2h." },
  { id: "t5", wineId: "w8", date: "2026-01-22", note: 5, occasion: "Coquilles St-Jacques", quote: "Noisette, beurré, droit. Hypnotique." },
  { id: "t6", wineId: "w6", date: "2025-12-30", note: 3, occasion: "Apéro", quote: "Gourmand, simple, parfait pour l'occasion." },
];

/* Pairing suggestions */
window.PAIRINGS = [
  { dish: "Côte de bœuf", score: 96, wineId: "w5" },
  { dish: "Plateau de fromages", score: 91, wineId: "w11" },
  { dish: "Saumon grillé", score: 88, wineId: "w8" },
  { dish: "Apéritif", score: 94, wineId: "w4" },
];
