export interface WineExpert {
  aromes: string
  bouche: string
  finale: string
  temperature: string
  carafage: string
  gardeMin: number
  gardeMax: number
  potentiel: 'wait' | 'apogee' | 'drink' | 'urgent'
  potentielLabel: string
  apogeeRange: string
}

interface ExpertRule {
  aromes: string
  bouche: string
  finale: string
  temperature: string
  carafage: string
  gardeMin: number
  gardeMax: number
}

const RULES: { match: (region: string, cepage: string) => boolean; rule: ExpertRule }[] = [
  {
    match: (r) => r.includes('bordeaux'),
    rule: {
      aromes: 'Cassis, mure, cedre, tabac blond',
      bouche: 'Tanins fermes et soyeux, belle structure, fruit noir profond',
      finale: 'Longue, boisee, legere amertume noble',
      temperature: '16-18\u00B0C',
      carafage: '1-2h recommande',
      gardeMin: 8,
      gardeMax: 15,
    },
  },
  {
    match: (r, c) => r.includes('bourgogne') || c.includes('pinot noir'),
    rule: {
      aromes: 'Cerise, framboise, sous-bois, rose fanee',
      bouche: 'Elegante, tanins fins, acidite vive et equilibree',
      finale: 'Delicate, fruitee, legere note terreuse',
      temperature: '14-16\u00B0C',
      carafage: '30 min en carafe',
      gardeMin: 5,
      gardeMax: 12,
    },
  },
  {
    match: (r, c) => r.includes('rhone') || c.includes('syrah') || c.includes('grenache'),
    rule: {
      aromes: 'Epices, garrigue, olive noire, poivre',
      bouche: 'Charnue et genereuse, tanins ronds, fruit concentre',
      finale: 'Chaude, epicee, reglisse',
      temperature: '16-18\u00B0C',
      carafage: '45 min en carafe',
      gardeMin: 4,
      gardeMax: 10,
    },
  },
  {
    match: (r, c) =>
      r.includes('champagne') || c.includes('champagne') || c.includes('cremant'),
    rule: {
      aromes: 'Brioche, agrumes, grille, fleurs blanches',
      bouche: 'Bulles fines et persistantes, fraicheur vive',
      finale: 'Nette, tonique, notes de noisette',
      temperature: '8-10\u00B0C',
      carafage: 'Pas de carafage',
      gardeMin: 3,
      gardeMax: 5,
    },
  },
  {
    match: (r, c) =>
      r.includes('loire') || c.includes('chenin') || c.includes('muscadet'),
    rule: {
      aromes: 'Pomme verte, fleurs blanches, miel, mineral',
      bouche: 'Frais et vif, belle mineralite, fruité delicat',
      finale: 'Croquante, saline, agrumes',
      temperature: '10-12\u00B0C',
      carafage: 'Pas de carafage',
      gardeMin: 2,
      gardeMax: 8,
    },
  },
  {
    match: (_r, c) =>
      c.includes('chardonnay') || c.includes('sauvignon') || c.includes('viognier'),
    rule: {
      aromes: 'Agrumes, fleurs blanches, mineral, peche',
      bouche: 'Ronde et equilibree, belle tension, fruit frais',
      finale: 'Minerale, rafraichissante, notes d\'amande',
      temperature: '10-12\u00B0C',
      carafage: 'Pas de carafage',
      gardeMin: 2,
      gardeMax: 6,
    },
  },
  {
    match: (r) => r.includes('alsace'),
    rule: {
      aromes: 'Litchi, rose, epices douces, miel',
      bouche: 'Aromatique et genereux, douceur maitrisee',
      finale: 'Longue, florale, pointe d\'amertume',
      temperature: '10-12\u00B0C',
      carafage: 'Pas de carafage',
      gardeMin: 3,
      gardeMax: 10,
    },
  },
]

const FALLBACK: ExpertRule = {
  aromes: 'Fruits frais, floral, notes minerales',
  bouche: 'Equilibree, tanins souples, bonne longueur',
  finale: 'Agreable, fruitee, nette',
  temperature: '14-16\u00B0C',
  carafage: '30 min si rouge',
  gardeMin: 2,
  gardeMax: 5,
}

function computePotentiel(
  millesime: number | undefined,
  gardeMin: number,
  gardeMax: number
): { potentiel: WineExpert['potentiel']; potentielLabel: string } {
  if (!millesime) {
    return { potentiel: 'apogee', potentielLabel: 'A son apogee' }
  }
  const now = new Date().getFullYear()
  const age = now - millesime

  if (age < gardeMin) return { potentiel: 'wait', potentielLabel: 'A attendre' }
  if (age <= gardeMax) return { potentiel: 'apogee', potentielLabel: 'A son apogee' }
  if (age <= gardeMax + 3) return { potentiel: 'drink', potentielLabel: 'A boire' }
  return { potentiel: 'urgent', potentielLabel: 'A boire rapidement' }
}

export function getWineExpert(
  region?: string,
  cepage?: string,
  millesime?: number
): WineExpert {
  const r = (region || '').toLowerCase()
  const c = (cepage || '').toLowerCase()

  const matched = RULES.find((entry) => entry.match(r, c))
  const rule = matched?.rule ?? FALLBACK

  const { potentiel, potentielLabel } = computePotentiel(millesime, rule.gardeMin, rule.gardeMax)

  const fromYear = millesime ? millesime + rule.gardeMin : undefined
  const untilYear = millesime ? millesime + rule.gardeMax : undefined
  const apogeeRange = fromYear && untilYear ? `${fromYear} — ${untilYear}` : 'Non disponible'

  return {
    aromes: rule.aromes,
    bouche: rule.bouche,
    finale: rule.finale,
    temperature: rule.temperature,
    carafage: rule.carafage,
    gardeMin: rule.gardeMin,
    gardeMax: rule.gardeMax,
    potentiel,
    potentielLabel,
    apogeeRange,
  }
}
