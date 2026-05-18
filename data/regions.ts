export const REGIONS: Record<
  string,
  { label: string; cx: number; cy: number; appellations: string[] }
> = {
  champagne: {
    label: "Champagne",
    cx: 342,
    cy: 93,
    appellations: ["Champagne AOC", "Coteaux Champenois", "Rose des Riceys"],
  },
  alsace: {
    label: "Alsace",
    cx: 424,
    cy: 125,
    appellations: ["Riesling", "Gewurztraminer", "Pinot Gris", "Cremant d'Alsace"],
  },
  bourgogne: {
    label: "Bourgogne",
    cx: 348,
    cy: 240,
    appellations: [
      "Gevrey-Chambertin",
      "Nuits-Saint-Georges",
      "Meursault",
      "Puligny-Montrachet",
      "Macon",
      "Chablis",
      "Mercurey",
    ],
  },
  savoie_et_bugey: {
    label: "Savoie",
    cx: 424,
    cy: 290,
    appellations: ["Apremont", "Abymes", "Chignin", "Roussette de Savoie"],
  },
  vallee_du_rhone: {
    label: "Vallee du Rhone",
    cx: 340,
    cy: 370,
    appellations: [
      "Hermitage",
      "Crozes-Hermitage",
      "Chateauneuf-du-Pape",
      "Gigondas",
      "Cotes du Rhone",
    ],
  },
  vallee_de_la_loire: {
    label: "Val de Loire",
    cx: 186,
    cy: 230,
    appellations: ["Muscadet", "Vouvray", "Sancerre", "Chinon", "Anjou", "Reuilly", "Touraine"],
  },
  bordeaux: {
    label: "Bordeaux",
    cx: 134,
    cy: 364,
    appellations: [
      "Pomerol",
      "Saint-Emilion",
      "Pauillac",
      "Margaux",
      "Medoc",
      "Pessac-Leognan",
    ],
  },

  // ── Italie ───────────────────────────────────────────────────────────────
  toscane: {
    label: "Toscane",
    cx: 0,
    cy: 0,
    appellations: ["Chianti", "Brunello di Montalcino", "Bolgheri", "Vino Nobile di Montepulciano"],
  },
  piemont: {
    label: "Piémont",
    cx: 0,
    cy: 0,
    appellations: ["Barolo", "Barbaresco", "Barbera d'Asti", "Moscato d'Asti"],
  },
  veneto: {
    label: "Véneto",
    cx: 0,
    cy: 0,
    appellations: ["Amarone", "Valpolicella", "Soave", "Prosecco"],
  },
  sicile: {
    label: "Sicile",
    cx: 0,
    cy: 0,
    appellations: ["Nero d'Avola", "Marsala", "Etna Rosso"],
  },

  // ── Espagne ──────────────────────────────────────────────────────────────
  rioja: {
    label: "Rioja",
    cx: 0,
    cy: 0,
    appellations: ["Rioja Reserva", "Rioja Gran Reserva", "Rioja Crianza"],
  },
  ribera_del_duero: {
    label: "Ribera del Duero",
    cx: 0,
    cy: 0,
    appellations: ["Ribera del Duero Reserva", "Tempranillo"],
  },
  priorat: {
    label: "Priorat",
    cx: 0,
    cy: 0,
    appellations: ["Priorat DOCa", "Grenache", "Carignan"],
  },
  rias_baixas: {
    label: "Rías Baixas",
    cx: 0,
    cy: 0,
    appellations: ["Albariño"],
  },

  // ── Portugal ─────────────────────────────────────────────────────────────
  douro: {
    label: "Douro",
    cx: 0,
    cy: 0,
    appellations: ["Porto", "Douro Rouge", "Douro Blanc"],
  },
  alentejo: {
    label: "Alentejo",
    cx: 0,
    cy: 0,
    appellations: ["Alentejo Rouge", "Alentejo Blanc"],
  },
  vinho_verde: {
    label: "Vinho Verde",
    cx: 0,
    cy: 0,
    appellations: ["Vinho Verde Blanc", "Vinho Verde Rouge"],
  },

  // ── Allemagne & Autriche ─────────────────────────────────────────────────
  moselle: {
    label: "Moselle",
    cx: 0,
    cy: 0,
    appellations: ["Riesling Spätlese", "Riesling Auslese", "Riesling Kabinett"],
  },
  rheingau: {
    label: "Rheingau",
    cx: 0,
    cy: 0,
    appellations: ["Riesling", "Spätburgunder"],
  },
  autriche: {
    label: "Autriche",
    cx: 0,
    cy: 0,
    appellations: ["Grüner Veltliner", "Riesling Wachau", "Blaufränkisch"],
  },

  // ── États-Unis ───────────────────────────────────────────────────────────
  napa: {
    label: "Napa Valley",
    cx: 0,
    cy: 0,
    appellations: ["Cabernet Sauvignon", "Merlot", "Chardonnay"],
  },
  sonoma: {
    label: "Sonoma",
    cx: 0,
    cy: 0,
    appellations: ["Pinot Noir", "Zinfandel", "Chardonnay"],
  },
  oregon: {
    label: "Oregon",
    cx: 0,
    cy: 0,
    appellations: ["Pinot Noir Willamette", "Pinot Gris"],
  },

  // ── Amérique du Sud ──────────────────────────────────────────────────────
  mendoza: {
    label: "Mendoza",
    cx: 0,
    cy: 0,
    appellations: ["Malbec", "Cabernet Sauvignon", "Torrontés"],
  },
  chili: {
    label: "Chili",
    cx: 0,
    cy: 0,
    appellations: ["Carmenère", "Cabernet Sauvignon Valle Central", "Sauvignon Blanc Casablanca"],
  },

  // ── Océanie ──────────────────────────────────────────────────────────────
  barossa: {
    label: "Barossa Valley",
    cx: 0,
    cy: 0,
    appellations: ["Shiraz", "Cabernet Sauvignon", "Grenache"],
  },
  mclaren: {
    label: "McLaren Vale",
    cx: 0,
    cy: 0,
    appellations: ["Shiraz", "Grenache", "Cabernet Sauvignon"],
  },
  marlborough: {
    label: "Marlborough",
    cx: 0,
    cy: 0,
    appellations: ["Sauvignon Blanc", "Pinot Noir", "Pinot Gris"],
  },

  // ── Afrique du Sud ───────────────────────────────────────────────────────
  stellenbosch: {
    label: "Stellenbosch",
    cx: 0,
    cy: 0,
    appellations: ["Chenin Blanc", "Pinotage", "Cabernet Sauvignon"],
  },
}
