export interface Accord {
  /** Keywords that trigger this pairing (lowercase, with accent variants) */
  k: string[]
  /** Recommended wine_type values, in priority order */
  t: string[]
  /** Preferred wine_region keys */
  r: string[]
  /** Detailed sommelier explanation of the pairing */
  reason: string
  /** Ideal serving temperature */
  temperature: string
  /** Service advice */
  serving: string
}

export const ACCORDS: Accord[] = [
  // ──────────────────────── Poissons & fruits de mer ────────────────────────
  {
    k: ["huitre", "huitres", "huître", "huîtres", "coquillage", "coquillages", "moule", "moules"],
    t: ["wine_white", "wine_white_sparkling"],
    r: ["champagne", "vallee_de_la_loire"],
    reason:
      "Les coquillages et huitres demandent un vin d'une grande fraicheur minerale. Un Muscadet sur lie ou un Champagne Blanc de Blancs subliment l'iode sans l'ecraser, tandis que l'acidite vive nettoie le palais entre chaque bouchee.",
    temperature: "Blanc : 8-10\u00B0C \u00B7 Champagne : 6-8\u00B0C",
    serving: "Servir bien frais, pas de carafage",
  },
  {
    k: ["saumon grille", "saumon grillé", "saumon grill\u00e9"],
    t: ["wine_white"],
    r: ["bourgogne", "vallee_de_la_loire"],
    reason:
      "Le saumon grille developpe des notes caramelisees qui appellent un blanc avec du gras et de la rondeur. Un Sancerre ou un Chablis premier cru apportera la mineralite necessaire pour equilibrer le cote huileux du poisson.",
    temperature: "10-12\u00B0C",
    serving: "Sortir du frais 10 min avant",
  },
  {
    k: ["saumon fume", "saumon fumé", "saumon fum\u00e9", "truite fumee", "truite fum\u00e9e"],
    t: ["wine_white"],
    r: ["vallee_de_la_loire", "bourgogne"],
    reason:
      "Le fume du saumon exige un blanc sec et vif pour contrebalancer le sel et les aromes toastes. Un Pouilly-Fume de Loire est l'alliance ideale : sa mineralite silex fait echo au caractere fume du poisson.",
    temperature: "8-10\u00B0C",
    serving: "Servir bien frais sans carafage",
  },
  {
    k: ["saumon en sauce", "saumon creme", "saumon crème", "saumon cr\u00e8me"],
    t: ["wine_white"],
    r: ["bourgogne"],
    reason:
      "La creme appelle un blanc gras capable de soutenir l'onctuosite de la sauce. Un Meursault ou un Saint-Veran de Bourgogne offrent cette rondeur beurrée tout en conservant suffisamment de fraicheur pour ne pas alourdir l'accord.",
    temperature: "12-14\u00B0C",
    serving: "Sortir du frais 15 min avant",
  },
  {
    k: ["poisson grille", "poisson grillé", "poisson grill\u00e9", "bar", "daurade", "dorade", "loup"],
    t: ["wine_white"],
    r: ["vallee_de_la_loire", "provence_et_corse"],
    reason:
      "Un poisson blanc grille revele des chairs delicates qui se marient idealement avec un blanc sec et mineral. Un Sancerre, un Cassis de Provence ou un Vermentino corse epousent la finesse du poisson sans la masquer.",
    temperature: "8-10\u00B0C",
    serving: "Servir frais, direct de la glaciere",
  },
  {
    k: ["poisson en sauce", "sole meuniere", "sole meunière", "sole meuni\u00e8re"],
    t: ["wine_white"],
    r: ["bourgogne"],
    reason:
      "La sauce au beurre de la sole meuniere demande un blanc charpente de Bourgogne. Un Puligny-Montrachet ou un Chassagne-Montrachet offre la structure et le gras necessaires pour enrober la sauce tout en respectant la finesse de la sole.",
    temperature: "12-13\u00B0C",
    serving: "Sortir du frais 10 min avant",
  },
  {
    k: ["fruits de mer", "homard", "langoustine", "langoustines", "saint-jacques", "crevette", "crevettes"],
    t: ["wine_white_sparkling", "wine_white"],
    r: ["champagne", "bourgogne"],
    reason:
      "Les fruits de mer nobles comme le homard ou les Saint-Jacques meritent un Champagne millesime ou un grand blanc de Bourgogne. L'effervescence et la mineralite subliment la douceur iodee des crustaces.",
    temperature: "Champagne : 8\u00B0C \u00B7 Blanc : 10-12\u00B0C",
    serving: "Champagne : ouvrir 5 min avant \u00B7 Blanc : pas de carafage",
  },
  {
    k: ["saumon", "truite", "poisson fume"],
    t: ["wine_white"],
    r: ["bourgogne", "vallee_de_la_loire"],
    reason:
      "Le saumon et la truite, qu'ils soient crus, grilles ou fumes, se marient a merveille avec les blancs secs de la Loire ou de Bourgogne. La vivacite du vin compense le gras naturel de ces poissons.",
    temperature: "10-12\u00B0C",
    serving: "Servir frais sans carafage",
  },

  // ──────────────────────── Viandes blanches ────────────────────────
  {
    k: ["poulet roti", "poulet rôti", "poulet r\u00f4ti", "poulet grille", "poulet grillé", "poulet grill\u00e9"],
    t: ["wine_red", "wine_white"],
    r: ["bourgogne", "vallee_de_la_loire"],
    reason:
      "Le poulet roti, avec ses notes grillees et sa chair juteuse, s'epanouit avec un Pinot Noir de Bourgogne aux tanins soyeux, ou un Chardonnay charpente de la Loire. Evitez les rouges trop tanniques qui ecraseraient la delicatesse de la volaille.",
    temperature: "Rouge : 16\u00B0C \u00B7 Blanc : 12\u00B0C",
    serving: "Rouge : carafer 20 min",
  },
  {
    k: ["poulet en sauce", "poulet creme", "poulet crème", "poulet cr\u00e8me", "poulet curry"],
    t: ["wine_white", "wine_red"],
    r: ["vallee_de_la_loire", "bourgogne"],
    reason:
      "La sauce creme du poulet appelle un blanc gras et enveloppant. Un Vouvray demi-sec ou un Meursault accompagne l'onctuosite du plat, tandis qu'un rouge leger de Bourgogne peut aussi convenir si la sauce n'est pas trop riche.",
    temperature: "Blanc : 11-13\u00B0C \u00B7 Rouge : 15\u00B0C",
    serving: "Blanc : pas de carafage \u00B7 Rouge : ouvrir 15 min avant",
  },
  {
    k: ["veau", "escalope", "blanquette", "ris de veau"],
    t: ["wine_white", "wine_red"],
    r: ["vallee_de_la_loire", "bourgogne"],
    reason:
      "Le veau, viande delicate par excellence, se marie aussi bien avec un blanc sec structure qu'un rouge leger. Un Chinon rouge ou un Savennieres blanc subliment la tendrete de la chair sans la dominer.",
    temperature: "Blanc : 11\u00B0C \u00B7 Rouge : 15\u00B0C",
    serving: "Rouge : ouvrir 15 min avant",
  },
  {
    k: ["porc", "cote de porc", "côte de porc", "roti de porc", "travers"],
    t: ["wine_red"],
    r: ["vallee_du_rhone", "vallee_de_la_loire"],
    reason:
      "Le porc, avec son gras fondant et ses saveurs douces, appelle un rouge fruité et souple. Un Cotes-du-Rhone villages ou un Chinon de Loire offrent des tanins ronds qui enveloppent la viande sans l'alourdir.",
    temperature: "15-16\u00B0C",
    serving: "Ouvrir 15 min avant, pas de carafage necessaire",
  },
  {
    k: ["pintade", "dinde", "chapon"],
    t: ["wine_red", "wine_white"],
    r: ["bourgogne"],
    reason:
      "La pintade et la dinde, volailles a la chair ferme et savoureuse, meritent un Pinot Noir elegant de Bourgogne. Un Gevrey-Chambertin ou un Volnay apportent la finesse aromatique qui magnifie ces volailles de caractere.",
    temperature: "Rouge : 16\u00B0C \u00B7 Blanc : 12\u00B0C",
    serving: "Carafer 20 min pour un rouge de garde",
  },
  {
    k: ["poulet", "volaille"],
    t: ["wine_red", "wine_white"],
    r: ["bourgogne", "vallee_de_la_loire"],
    reason:
      "La volaille se prete a de nombreux accords. Un rouge souple de Bourgogne ou un blanc charpente de Loire accompagnent aussi bien un poulet simple qu'une preparation plus elaboree.",
    temperature: "Rouge : 15-16\u00B0C \u00B7 Blanc : 11-12\u00B0C",
    serving: "Rouge : ouvrir 10 min avant",
  },

  // ──────────────────────── Viandes rouges ────────────────────────
  {
    k: ["boeuf grille", "bœuf grillé", "boeuf grillé", "entrecote", "entrecôte", "steak", "cote de boeuf", "côte de boeuf"],
    t: ["wine_red"],
    r: ["bordeaux", "vallee_du_rhone", "toscane", "rioja", "napa"],
    reason:
      "La viande de boeuf grillee, avec ses sucs caramelises et sa mache genereuse, exige un rouge puissant et tannique. Un Saint-Emilion ou un Chateauneuf-du-Pape, avec leurs tanins murs et leur profondeur, sont des compagnons ideaux.",
    temperature: "16-18\u00B0C",
    serving: "Carafer 30 min avant pour un vin jeune",
  },
  {
    k: ["boeuf bourguignon", "bœuf bourguignon", "boeuf en sauce", "bœuf en sauce", "daube"],
    t: ["wine_red"],
    r: ["bourgogne"],
    reason:
      "Le boeuf bourguignon est ne pour etre marie avec un Pinot Noir de Bourgogne. La finesse du vin fait echo a la cuisson longue qui a attendri la viande, et les aromes de sous-bois du vin completent les notes du plat mijote.",
    temperature: "16\u00B0C",
    serving: "Carafer 30 min, ou ouvrir 1h avant",
  },
  {
    k: ["boeuf", "bœuf", "rosbif"],
    t: ["wine_red"],
    r: ["bordeaux", "bourgogne", "vallee_du_rhone", "toscane", "rioja", "napa", "piemont"],
    reason:
      "Le boeuf, quelle que soit sa preparation, appelle un rouge structure. Les tanins d'un grand rouge de Bordeaux, Bourgogne ou du Rhone s'accordent avec la mache et le gout prononce de la viande rouge.",
    temperature: "16-18\u00B0C",
    serving: "Carafer 30 min avant",
  },
  {
    k: ["agneau roti", "agneau rôti", "gigot", "carre d agneau", "carré d'agneau"],
    t: ["wine_red"],
    r: ["bordeaux", "vallee_du_rhone", "toscane", "rioja"],
    reason:
      "L'agneau roti developpe des saveurs intenses qui s'accordent parfaitement avec un Pauillac ou un Hermitage. Les tanins fermes et les notes epices du vin enveloppent la viande et prolongent ses aromes en bouche.",
    temperature: "17-18\u00B0C",
    serving: "Carafer 45 min pour un vin de 10+ ans",
  },
  {
    k: ["agneau en sauce", "navarin", "tajine agneau", "tagine"],
    t: ["wine_red"],
    r: ["languedoc_et_roussillon", "vallee_du_rhone"],
    reason:
      "L'agneau en sauce, souvent releve d'epices douces, appelle un rouge du sud genereux et chaud. Un Minervois ou un Corbieres du Languedoc, avec leurs notes de garrigue, completent les aromes du plat mijote.",
    temperature: "16\u00B0C",
    serving: "Carafer 20 min",
  },
  {
    k: ["agneau"],
    t: ["wine_red"],
    r: ["bordeaux", "vallee_du_rhone", "toscane", "rioja"],
    reason:
      "L'agneau merite un rouge elegant et epice qui sublime la tendrete de la viande. Un Bordeaux de qualite ou un Cotes-du-Rhone villages feront toujours un bel accord.",
    temperature: "16-18\u00B0C",
    serving: "Carafer 30 min avant",
  },
  {
    k: ["canard", "magret", "confit de canard", "confit"],
    t: ["wine_red"],
    r: ["bordeaux", "sud_ouest"],
    reason:
      "Le canard, qu'il soit en magret ou en confit, possede une richesse aromatique qui demande un rouge puissant. Un Cahors aux tanins sombres ou un Madiran structurent l'accord, tandis qu'un Saint-Emilion apporte de l'elegance.",
    temperature: "16-17\u00B0C",
    serving: "Carafer 30 min pour un Cahors jeune",
  },

  // ──────────────────────── Cuisine italienne ────────────────────────
  {
    k: ["pizza", "pasta", "pates", "pâtes", "p\u00e2tes", "lasagne", "lasagnes", "bolognaise"],
    t: ["wine_red"],
    r: ["vallee_du_rhone", "languedoc_et_roussillon"],
    reason:
      "La cuisine italienne tomate appelle un rouge fruité et peu tannique. A defaut de Chianti, un Cotes-du-Rhone souple ou un rouge du Languedoc aux notes de fruits rouges feront un accord genereux et simple, comme le plat lui-meme.",
    temperature: "15-16\u00B0C",
    serving: "Pas de carafage necessaire",
  },
  {
    k: ["risotto", "risotto champignon", "risotto champignons"],
    t: ["wine_white", "wine_red"],
    r: ["bourgogne"],
    reason:
      "Le risotto, cremeux et delicat, se marie aussi bien avec un blanc charpente qu'un rouge leger. Un Meursault ou un Bourgogne rouge accompagnent la texture onctueuse du riz et les aromes de parmesan.",
    temperature: "Blanc : 12\u00B0C \u00B7 Rouge : 15\u00B0C",
    serving: "Blanc : pas de carafage \u00B7 Rouge : ouvrir 10 min avant",
  },
  {
    k: ["osso buco"],
    t: ["wine_red"],
    r: ["vallee_du_rhone", "bordeaux"],
    reason:
      "L'osso buco, braise longuement avec des legumes et du vin blanc, developpe des saveurs profondes qui appellent un rouge structure et genereux. Un Chateauneuf-du-Pape ou un Pomerol sont des accords magistraux.",
    temperature: "17\u00B0C",
    serving: "Carafer 30 min",
  },

  // ──────────────────────── Cuisine asiatique ────────────────────────
  {
    k: ["sushi", "sashimi", "japonais", "maki", "makis"],
    t: ["wine_white", "wine_white_sparkling"],
    r: ["champagne", "vallee_de_la_loire", "alsace"],
    reason:
      "La cuisine japonaise, tout en subtilite, exige un vin delicat et mineral. Un Champagne extra-brut ou un Riesling sec d'Alsace respectent la purete du poisson cru, tandis que leur acidite equilibre le vinaigre du riz.",
    temperature: "Champagne : 7\u00B0C \u00B7 Blanc : 8-10\u00B0C",
    serving: "Servir bien frais, aucun carafage",
  },
  {
    k: ["thai", "thaï", "tha\u00ef", "curry", "epice", "épicé", "\u00e9pic\u00e9", "pad thai"],
    t: ["wine_white"],
    r: ["alsace", "vallee_de_la_loire"],
    reason:
      "Les plats epices et sucres-sales de la cuisine thai appellent un blanc aromatique avec une touche de sucre residuel. Un Gewurztraminer vendanges tardives ou un Vouvray demi-sec calment le feu des epices tout en accompagnant les saveurs complexes.",
    temperature: "8-10\u00B0C",
    serving: "Servir bien frais",
  },
  {
    k: ["chinois", "wok", "cantonais", "dim sum"],
    t: ["wine_white"],
    r: ["alsace"],
    reason:
      "La cuisine chinoise au wok, avec ses saveurs umami et ses sauces soja, se marie etonnamment bien avec les blancs aromatiques d'Alsace. Un Pinot Gris offre le gras et la rondeur necessaires pour accompagner les textures variees.",
    temperature: "10-12\u00B0C",
    serving: "Servir frais sans carafage",
  },

  // ──────────────────────── Vegetarien ────────────────────────
  {
    k: ["legumes grilles", "légumes grillés", "ratatouille", "legumes", "légumes"],
    t: ["wine_red", "wine_white"],
    r: ["vallee_du_rhone", "provence_et_corse"],
    reason:
      "Les legumes grilles ou en ratatouille appellent un rose de Provence genereux ou un rouge leger du Rhone. Les notes herbacees et poivrees du vin font echo aux saveurs caramelisees des legumes, creant un accord estival et gourmand.",
    temperature: "Rose : 10\u00B0C \u00B7 Rouge : 14-15\u00B0C",
    serving: "Servir frais, pas de carafage",
  },
  {
    k: ["champignon", "champignons", "cepe", "cèpe", "c\u00e8pe", "cepes", "cèpes", "morille", "morilles"],
    t: ["wine_red", "wine_white"],
    r: ["bourgogne"],
    reason:
      "Les champignons, avec leurs aromes terreux et boisés, trouvent leur echo parfait dans un Pinot Noir de Bourgogne. Les notes de sous-bois du vin et celles du champignon se repondent dans un accord d'une grande harmonie. Un blanc charpenté convient aussi.",
    temperature: "Rouge : 16\u00B0C \u00B7 Blanc : 12\u00B0C",
    serving: "Rouge : ouvrir 15 min avant",
  },
  {
    k: ["quiche", "tarte salee", "tarte salée", "tarte sal\u00e9e", "tourte"],
    t: ["wine_white"],
    r: ["vallee_de_la_loire", "alsace"],
    reason:
      "Une quiche ou tarte salee, avec son appareil a base d'oeufs et de creme, demande un blanc sec et frais. Un Muscadet ou un Sylvaner d'Alsace nettoient le palais et accompagnent la richesse de la garniture sans la concurrencer.",
    temperature: "10-11\u00B0C",
    serving: "Servir frais, pas de carafage",
  },

  // ──────────────────────── Fromages ────────────────────────
  {
    k: ["fromage de chevre", "fromage de chèvre", "chevre", "chèvre", "ch\u00e8vre", "crottin"],
    t: ["wine_white"],
    r: ["vallee_de_la_loire"],
    reason:
      "Le fromage de chevre et le Sauvignon de Loire forment l'un des accords les plus celebres de la gastronomie francaise. Le Sancerre ou le Pouilly-Fume, avec leur vivacite et leurs notes d'agrumes, tranchent dans le gras du chevre frais.",
    temperature: "10\u00B0C",
    serving: "Servir frais sans carafage",
  },
  {
    k: ["comte", "comté", "comt\u00e9", "gruyere", "gruyère", "beaufort"],
    t: ["wine_white"],
    r: ["bourgogne", "alsace"],
    reason:
      "Les fromages a pate pressee cuite comme le Comte developpent des aromes de noisette qui s'accordent a merveille avec un Chardonnay de Bourgogne ou un Riesling d'Alsace. La tension du vin equilibre le cote sale et umami du fromage.",
    temperature: "11-12\u00B0C",
    serving: "Servir frais",
  },
  {
    k: ["camembert", "brie", "coulommiers", "pate molle", "pâte molle"],
    t: ["wine_red", "wine_white"],
    r: ["vallee_de_la_loire", "bourgogne"],
    reason:
      "Les fromages a pate molle et croute fleurie appellent un rouge leger et fruité ou un blanc frais. Un Bourgueil rouge ou un Vouvray sec apportent la fraicheur necessaire pour trancher dans la cremosité du camembert sans ecraser ses aromes delicats.",
    temperature: "Rouge : 14\u00B0C \u00B7 Blanc : 10\u00B0C",
    serving: "Pas de carafage",
  },
  {
    k: ["roquefort", "bleu", "bleu d auvergne", "fourme", "gorgonzola"],
    t: ["wine_white"],
    r: ["vallee_de_la_loire", "bordeaux"],
    reason:
      "Les fromages bleus, intenses et sales, trouvent leur equilibre dans un vin blanc liquoreux. Un Sauternes ou un Quarts-de-Chaume offrent la douceur et l'amplitude necessaires pour dompter la puissance du roquefort. Un accord mythique.",
    temperature: "8-10\u00B0C",
    serving: "Servir bien frais",
  },
  {
    k: ["fromage", "plateau de fromage", "plateau fromage", "plateau"],
    t: ["wine_red", "wine_white"],
    r: ["bourgogne", "vallee_de_la_loire", "napa", "barossa"],
    reason:
      "Pour un plateau de fromages varies, misez sur un rouge souple et fruité de Bourgogne ou un blanc sec de Loire. Leur polyvalence permet d'accompagner aussi bien les pates pressees que les pates molles.",
    temperature: "Rouge : 15\u00B0C \u00B7 Blanc : 10\u00B0C",
    serving: "Ouvrir le rouge 10 min avant",
  },

  // ──────────────────────── Desserts & occasions ────────────────────────
  {
    k: ["chocolat", "dessert chocolat", "fondant", "moelleux chocolat"],
    t: ["wine_red"],
    r: ["vallee_du_rhone", "languedoc_et_roussillon"],
    reason:
      "Le chocolat noir, amer et intense, s'accorde avec un rouge puissant et suave. Un Banyuls ou un Maury du Roussillon, vins doux naturels aux aromes de cacao, creent un accord en miroir. Un Rasteau est aussi une belle option.",
    temperature: "14-16\u00B0C",
    serving: "Pas de carafage, servir a temperature de cave",
  },
  {
    k: ["aperitif", "apéritif", "ap\u00e9ritif", "apero", "apéro", "ap\u00e9ro"],
    t: ["wine_white_sparkling", "wine_white"],
    r: ["champagne", "vallee_de_la_loire", "alsace"],
    reason:
      "L'aperitif est le moment du petillant par excellence. Un Champagne Brut, un Cremant de Loire ou d'Alsace ouvrent les papilles avec elegance. Pour un aperitif plus decontracte, un Sancerre frais fait aussi merveille.",
    temperature: "Petillant : 7-8\u00B0C \u00B7 Blanc : 9-10\u00B0C",
    serving: "Ouvrir le champagne juste avant de servir",
  },
  {
    k: ["fete", "fête", "f\u00eate", "anniversaire", "mariage", "celebration", "célébration"],
    t: ["wine_white_sparkling"],
    r: ["champagne"],
    reason:
      "Les grandes occasions appellent le Champagne. Choisissez un Brut millesime pour impressionner, ou un Blanc de Blancs pour l'elegance pure. Les bulles fines et la longueur en bouche en font le compagnon festif incontournable.",
    temperature: "7-8\u00B0C",
    serving: "Mettre au frais 3h avant, ouvrir au dernier moment",
  },
  {
    k: ["foie gras"],
    t: ["wine_white", "wine_white_sparkling"],
    r: ["vallee_de_la_loire", "bordeaux", "champagne"],
    reason:
      "Le foie gras, avec son onctuosite et ses aromes complexes, appelle un blanc liquoreux ou un Champagne millesime. Un Sauternes ou un Quarts-de-Chaume offrent la douceur qui enrobe le gras, tandis qu'un Champagne Brut joue sur le contraste.",
    temperature: "Liquoreux : 8-10\u00B0C \u00B7 Champagne : 7\u00B0C",
    serving: "Servir bien frais, surtout le liquoreux",
  },
]

/** Fallback accords by detected cuisine category */
export const FALLBACK_ACCORDS: Record<string, Accord> = {
  italian: {
    k: [],
    t: ["wine_red"],
    r: ["vallee_du_rhone", "languedoc_et_roussillon"],
    reason:
      "La cuisine italienne se marie bien avec les rouges fruités et souples du sud de la France. Un Cotes-du-Rhone ou un vin du Languedoc offrent des aromes de fruits rouges qui accompagnent sauces tomate et gratins.",
    temperature: "15-16\u00B0C",
    serving: "Pas de carafage necessaire",
  },
  asian: {
    k: [],
    t: ["wine_white"],
    r: ["alsace", "vallee_de_la_loire"],
    reason:
      "Les cuisines asiatiques, riches en umami et en epices, appellent des blancs aromatiques. Un Gewurztraminer d'Alsace ou un Vouvray offrent le gras et la douceur necessaires pour contrebalancer les saveurs relevees.",
    temperature: "8-10\u00B0C",
    serving: "Servir bien frais",
  },
  spanish: {
    k: [],
    t: ["wine_red"],
    r: ["rioja", "ribera_del_duero", "priorat"],
    reason:
      "La cuisine espagnole, riche en saveurs mediteraneennes et en charcuteries, se marie idealement avec les rouges de la Rioja ou du Priorat. Leurs tanins fondus et leurs notes de vanille et de fruits rouges accompagnent parfaitement tapas, paella et plats a base de chorizo.",
    temperature: "16-17\u00B0C",
    serving: "Carafer 30 min pour un Reserva",
  },
  american: {
    k: [],
    t: ["wine_red"],
    r: ["napa", "sonoma"],
    reason:
      "Les plats americains genereux — burgers, BBQ, cotes de boeuf — appellent les grands Cabernet Sauvignon de Napa Valley. Leur fruit mur, leurs tanins fondus et leur boise enveloppant font echo aux saveurs caramelisees et fumees de la cuisine au grill.",
    temperature: "17-18\u00B0C",
    serving: "Carafer 1h recommande",
  },
  default: {
    k: [],
    t: ["wine_red", "wine_white"],
    r: [],
    reason:
      "Pour ce plat, un rouge souple et fruité ou un blanc sec et mineral feront un bel accord. Privilegiez les vins proches de leur apogee pour un maximum de plaisir.",
    temperature: "Rouge : 16\u00B0C \u00B7 Blanc : 10\u00B0C",
    serving: "Rouge : ouvrir 15 min avant",
  },
}
