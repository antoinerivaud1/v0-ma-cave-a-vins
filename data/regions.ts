export const REGIONS: Record<
  string,
  { label: string; cx: number; cy: number; appellations: string[] }
> = {
  champagne: {
    label: 'Champagne',
    cx: 342,
    cy: 93,
    appellations: ['Champagne AOC', 'Coteaux Champenois', 'Rose des Riceys'],
  },
  alsace: {
    label: 'Alsace',
    cx: 424,
    cy: 125,
    appellations: ['Riesling', 'Gewurztraminer', 'Pinot Gris', "Cremant d'Alsace"],
  },
  bourgogne: {
    label: 'Bourgogne',
    cx: 348,
    cy: 240,
    appellations: [
      'Gevrey-Chambertin',
      'Nuits-Saint-Georges',
      'Meursault',
      'Puligny-Montrachet',
      'Macon',
      'Chablis',
      'Mercurey',
    ],
  },
  savoie_et_bugey: {
    label: 'Savoie',
    cx: 424,
    cy: 290,
    appellations: ['Apremont', 'Abymes', 'Chignin', 'Roussette de Savoie'],
  },
  vallee_du_rhone: {
    label: 'Vallee du Rhone',
    cx: 340,
    cy: 370,
    appellations: [
      'Hermitage',
      'Crozes-Hermitage',
      'Chateauneuf-du-Pape',
      'Gigondas',
      'Cotes du Rhone',
    ],
  },
  vallee_de_la_loire: {
    label: 'Val de Loire',
    cx: 186,
    cy: 230,
    appellations: ['Muscadet', 'Vouvray', 'Sancerre', 'Chinon', 'Anjou', 'Reuilly', 'Touraine'],
  },
  bordeaux: {
    label: 'Bordeaux',
    cx: 134,
    cy: 364,
    appellations: [
      'Pomerol',
      'Saint-Emilion',
      'Pauillac',
      'Margaux',
      'Medoc',
      'Pessac-Leognan',
    ],
  },
}
