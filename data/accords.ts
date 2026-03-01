export interface Accord {
  /** Keywords that trigger this pairing (lowercase, accented) */
  k: string[]
  /** Recommended wine_type values, in priority order */
  t: string[]
  /** Preferred wine_region keys */
  r: string[]
  /** Human explanation of the pairing */
  reason: string
}

export const ACCORDS: Accord[] = [
  {
    k: ['huitre', 'huitres', 'huître', 'huîtres'],
    t: ['wine_white_sparkling', 'wine_white'],
    r: ['champagne', 'vallee_de_la_loire'],
    reason: "L'acidite et les bulles subliment l'iode des huitres.",
  },
  {
    k: ['saumon', 'truite', 'poisson fume'],
    t: ['wine_white'],
    r: ['bourgogne', 'vallee_de_la_loire'],
    reason: "Un blanc sec et frais s'accorde parfaitement avec le saumon.",
  },
  {
    k: ['poisson', 'sole', 'cabillaud', 'bar', 'daurade'],
    t: ['wine_white'],
    r: ['vallee_de_la_loire', 'bourgogne'],
    reason: 'Les blancs secs accompagnent les chairs delicates.',
  },
  {
    k: ['fruits de mer', 'homard', 'langoustine', 'saint-jacques'],
    t: ['wine_white_sparkling', 'wine_white'],
    r: ['champagne', 'bourgogne'],
    reason: "La finesse d'un blanc met en valeur les fruits de mer.",
  },
  {
    k: ['poulet', 'pintade', 'dinde', 'canard', 'magret'],
    t: ['wine_red', 'wine_white'],
    r: ['bourgogne', 'vallee_du_rhone'],
    reason: 'La volaille appelle un blanc charpente ou un rouge souple.',
  },
  {
    k: ['foie gras'],
    t: ['wine_white_sparkling', 'wine_white'],
    r: ['champagne', 'vallee_de_la_loire'],
    reason: "L'effervescence contraste avec l'onctuosite du foie gras.",
  },
  {
    k: ['boeuf', 'bœuf', 'entrecote', 'entrecôte', 'steak', 'rosbif'],
    t: ['wine_red'],
    r: ['bordeaux', 'bourgogne', 'vallee_du_rhone'],
    reason: "Les tanins d'un grand rouge s'accordent avec la viande rouge.",
  },
  {
    k: ['agneau', 'gigot', 'carre', 'carré'],
    t: ['wine_red'],
    r: ['bordeaux', 'vallee_du_rhone'],
    reason: "Un rouge elegant et epice sublime l'agneau.",
  },
  {
    k: ['fromage', 'chevre', 'chèvre', 'camembert', 'comte', 'comté', 'roquefort'],
    t: ['wine_red', 'wine_white'],
    r: ['bourgogne', 'vallee_de_la_loire'],
    reason: 'Le chenin de Loire est polyvalent avec les fromages.',
  },
  {
    k: ['aperitif', 'apéritif', 'apero', 'apéro', 'fete', 'fête', 'anniversaire', 'mariage'],
    t: ['wine_white_sparkling'],
    r: ['champagne'],
    reason: "Un petillant s'impose pour celebrer !",
  },
]

/** Fallback when no keyword matches */
export const FALLBACK_ACCORD: Accord = {
  k: [],
  t: ['wine_red', 'wine_white'],
  r: [],
  reason: 'Pour ce plat, un rouge souple ou un blanc sec feront un bel accord.',
}
