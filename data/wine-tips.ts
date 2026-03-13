export type TipType = "generic" | "personal"

export interface WineTip {
  id: string
  type: TipType
  text: string
}

export const WINE_TIPS: WineTip[] = [
  {
    id: "t01",
    type: "generic",
    text: "Un vin rouge servi trop froid perd ses aromes. Sortez-le du cellier 30 minutes avant de le servir.",
  },
  {
    id: "t02",
    type: "generic",
    text: "Le millesime 2010 en Bordeaux est considere comme l'un des plus grands du siecle. Vos bouteilles de cette annee meritent encore quelques annees de patience.",
  },
  {
    id: "t03",
    type: "generic",
    text: "Un Bourgogne blanc de grande annee peut se garder 15 a 20 ans. La patience est souvent recompensee.",
  },
  {
    id: "t04",
    type: "generic",
    text: "Le carafage n'est pas reserve aux grands vins. Un vin jeune et tannique s'ouvre remarquablement apres 1h en carafe.",
  },
  {
    id: "t05",
    type: "generic",
    text: "En Champagne, les bulles ne sont pas un signe de qualite — c'est la finesse et la persistance de celles-ci qui comptent.",
  },
  {
    id: "t06",
    type: "generic",
    text: "Un Sancerre se boit idealement entre 3 et 5 ans apres sa recolte. Au-dela, il perd sa vivacite caracteristique.",
  },
  {
    id: "t07",
    type: "generic",
    text: "La temperature de service est le detail le plus neglige des amateurs. 16°C pour un rouge leger, 18°C pour un rouge puissant.",
  },
  {
    id: "t08",
    type: "generic",
    text: "Le Chenin Blanc de la Loire est l'un des cepages les plus polyvalents au monde — sec, demi-sec, moelleux ou effervescent.",
  },
  {
    id: "t09",
    type: "generic",
    text: "Un grand Hermitage rouge peut necessiter 10 a 15 ans de garde avant de reveler toute sa complexite.",
  },
  {
    id: "t10",
    type: "generic",
    text: "Les millesimes impairs en Bourgogne sont souvent sous-estimes. 2017 et 2019 reservent de belles surprises.",
  },
  {
    id: "t11",
    type: "generic",
    text: "Conserver vos bouteilles a l'horizontale n'est necessaire que pour les bouchons en liege — pour preserver leur elasticite.",
  },
  {
    id: "t12",
    type: "generic",
    text: "Le Riesling d'Alsace est l'un des rares vins blancs capables de rivaliser avec les grands rouges sur un gibier ou une volaille rotie.",
  },
  {
    id: "t13",
    type: "generic",
    text: "En degustation, la couleur d'un vin vous renseigne sur son age : un rouge qui vire a l'orange approche de sa maturite.",
  },
  {
    id: "t14",
    type: "generic",
    text: "Le Chateauneuf-du-Pape peut etre assemble jusqu'a 13 cepages differents. Sa complexite n'est jamais le fruit du hasard.",
  },
  {
    id: "t15",
    type: "generic",
    text: "Un vin conserve a plus de 20°C vieillit deux fois plus vite. La regularite de temperature compte plus que la temperature elle-meme.",
  },
]

/** Pick a tip for today — changes daily, stable within a day */
export function getDailyTip(extraTips: WineTip[] = []): WineTip {
  const all = [...WINE_TIPS, ...extraTips]
  const dayIndex = Math.floor(Date.now() / (1000 * 60 * 60 * 24))
  return all[dayIndex % all.length]
}
