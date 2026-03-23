export interface Wine {
  wine_type?: string
  wine_region?: string
  millesime_year?: string | number
  bottle_quantity?: number
  wine_name?: string
  wine_color?: string
  wine_appellation?: string
  wine_domain?: string
  wine_classification?: string
  wine_notes?: string
  _manual?: boolean
  [key: string]: unknown
}

export interface ApogeeResult {
  st: 'urgent' | 'late' | 'wait' | 'ok'
  label: string
  cls: string
}

type ApogeeRule = { min: number; max: number }

const APOGEE: Record<string, Record<string, ApogeeRule>> = {
  wine_white_sparkling: {
    champagne: { min: 3, max: 10 },
    veneto: { min: 1, max: 3 },
    default: { min: 1, max: 4 },
  },
  wine_white: {
    bourgogne: { min: 3, max: 12 },
    vallee_de_la_loire: { min: 2, max: 10 },
    alsace: { min: 2, max: 8 },
    savoie_et_bugey: { min: 1, max: 4 },
    moselle: { min: 3, max: 15 },
    rheingau: { min: 3, max: 12 },
    autriche: { min: 2, max: 8 },
    marlborough: { min: 1, max: 5 },
    rias_baixas: { min: 1, max: 4 },
    default: { min: 1, max: 5 },
  },
  wine_red: {
    bordeaux: { min: 5, max: 20 },
    bourgogne: { min: 4, max: 15 },
    vallee_du_rhone: { min: 4, max: 15 },
    vallee_de_la_loire: { min: 2, max: 8 },
    toscane: { min: 4, max: 15 },
    piemont: { min: 5, max: 20 },
    veneto: { min: 3, max: 12 },
    rioja: { min: 3, max: 12 },
    ribera_del_duero: { min: 4, max: 15 },
    priorat: { min: 4, max: 15 },
    douro: { min: 3, max: 10 },
    napa: { min: 4, max: 15 },
    sonoma: { min: 3, max: 12 },
    oregon: { min: 3, max: 10 },
    mendoza: { min: 2, max: 8 },
    chili: { min: 2, max: 8 },
    barossa: { min: 4, max: 15 },
    mclaren: { min: 3, max: 12 },
    stellenbosch: { min: 3, max: 10 },
    default: { min: 2, max: 7 },
  },
  wine_unknown: {
    default: { min: 1, max: 5 },
  },
}

export function getApogee(wine: Wine): ApogeeResult | null {
  const y = parseInt(String(wine.millesime_year))
  if (!y || isNaN(y)) return null

  const typeRules = APOGEE[wine.wine_type || ''] || APOGEE.wine_unknown
  const rule = typeRules[wine.wine_region || ''] || typeRules.default

  const now = new Date().getFullYear()
  const age = now - y
  const from = y + rule.min
  const until = y + rule.max

  if (age > rule.max) {
    return {
      st: 'urgent',
      label: `Apogee depassee (${from}-${until})`,
      cls: 'apogee-urgent',
    }
  }

  if (age < rule.min) {
    const l = from - now
    return {
      st: 'wait',
      label: `Attendre ~${l} an${l > 1 ? 's' : ''}`,
      cls: 'apogee-wait',
    }
  }

  if (until - now <= 2) {
    return {
      st: 'late',
      label: `A boire bientot (avant ${until})`,
      cls: 'apogee-late',
    }
  }

  return {
    st: 'ok',
    label: `Apogee jusqu'en ${until}`,
    cls: 'apogee-ok',
  }
}
