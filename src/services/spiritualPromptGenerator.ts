import type { SpiritualPromptConfig, PromptLanguage } from '../types/spiritualPrompt';

// Translation mappings for prompt generation
const translations = {
  de: {
    // Mood
    mood: {
      kontemplativ: 'still, kontemplativ, nach innen gerichtet',
      kraftvoll: 'kraftvoll, energetisch, ausstrahlend',
    },
    // Energy
    energy: {
      erdend: 'erdend, geerdet, naturverbunden, verwurzelt',
      transzendent: 'transzendent, kosmisch, aufsteigend, lichtvoll',
    },
    // Style
    style: {
      archaisch: 'zeitlos-alt, archaisch, sakral, mit historischer Tiefe',
      modern: 'zeitgenössisch-spirituell, modern, reduziert, klar',
    },
    // Sources
    sources: {
      natur: 'Naturspiritualität, Erdzyklen, Elemente, organische Formen',
      bewusstsein: 'Achtsamkeit, Präsenz, Bewusstseinsarbeit, meditative Qualität',
      alchemie: 'Alchemie, Transformation, Wandlung, Metamorphose',
      kosmisch: 'kosmische Ordnung, Sterne, heilige Geometrie, universelle Muster',
      mystik: 'Mystik, das Unsagbare, Geheimnis, ohne religiöse Zuordnung',
      verbundenheit: 'menschliche Verbundenheit, Herzqualität, Beziehung, Mitgefühl',
    },
    // Central Motif
    centralMotif: {
      silhouette: 'eine stilisierte menschliche Silhouette oder Aura als zentrales Element, abstrakt und lichtvoll',
      licht: 'ein strahlendes Licht, Kreis oder Mandala als zentrales Gestaltungselement',
      symbol: 'ein abstraktes Symbol wie Spirale, Samen, Lebensknoten oder heilige Geometrie im Zentrum',
      natur: 'ein abstrahiertes Naturmotiv wie Baum des Lebens, fließendes Wasser oder Himmelskörper',
      reduziert: 'sehr reduzierte Gestaltung, nur Form und Raum, minimalistisch und meditativ',
      portrait: 'ein Porträt der Person, spirituell interpretiert, mit Aura oder Lichtelementen, basierend auf dem beigefügten Referenzbild',
    },
    // Text Style
    textStyle: {
      'sakral-poetisch': 'sakral-poetisch, ehrfürchtig, feierlich',
      'neutral-meditativ': 'neutral-meditativ, ruhig, gelassen',
      nuechtern: 'nüchtern, klar, sachlich',
    },
    // Text Clarity
    textClarity: {
      raetselhaft: 'leicht rätselhaft, offen für Interpretation',
      klar: 'klar verständlich, eindeutig',
    },
    // Back Side Style
    backSideStyle: {
      erklaerung: 'erklärend, beschreibend, was dieser Schein bedeutet',
      einladung: 'einladend, ein Versprechen, eine Zusage an den Empfänger',
      mantra: 'wie ein Mantra, meditativ, ein Satz zum Verweilen',
    },
    // Feelings
    feelings: {
      vertrauen: 'Vertrauen',
      dankbarkeit: 'Dankbarkeit',
      ruhe: 'Ruhe',
      wertschaetzung: 'Wertschätzung',
      verbundenheit: 'Verbundenheit',
      verantwortung: 'Verantwortung',
    },
    // Value Display
    valueDisplay: {
      explizit: 'Der Wert wird klar und dominant auf der Vorderseite angezeigt',
      symbolisch: 'Der Wert wird nur symbolisch angedeutet, nicht explizit geschrieben',
      beides: 'Symbolische Darstellung auf der Vorderseite, explizite Erklärung auf der Rückseite',
    },
    // Value Position
    valuePosition: {
      ecken: 'Der Wert ist in den Ecken platziert, wie bei klassischen Banknoten',
      zentral: 'Der Wert ist zentral und prominent im Design integriert',
      beides: 'Der Wert erscheint sowohl in den Ecken als auch zentral',
    },
  },
  en: {
    // Mood
    mood: {
      kontemplativ: 'quiet, contemplative, inward-focused',
      kraftvoll: 'powerful, energetic, radiating',
    },
    // Energy
    energy: {
      erdend: 'grounding, rooted, connected to nature',
      transzendent: 'transcendent, cosmic, ascending, light-filled',
    },
    // Style
    style: {
      archaisch: 'timeless-ancient, archaic, sacred, with historical depth',
      modern: 'contemporary-spiritual, modern, reduced, clear',
    },
    // Sources
    sources: {
      natur: 'nature spirituality, earth cycles, elements, organic forms',
      bewusstsein: 'mindfulness, presence, consciousness work, meditative quality',
      alchemie: 'alchemy, transformation, metamorphosis',
      kosmisch: 'cosmic order, stars, sacred geometry, universal patterns',
      mystik: 'mysticism, the ineffable, mystery, without religious affiliation',
      verbundenheit: 'human connection, heart quality, relationship, compassion',
    },
    // Central Motif
    centralMotif: {
      silhouette: 'a stylized human silhouette or aura as central element, abstract and luminous',
      licht: 'a radiant light, circle or mandala as central design element',
      symbol: 'an abstract symbol like spiral, seed, life knot or sacred geometry at center',
      natur: 'an abstracted nature motif like tree of life, flowing water or celestial body',
      reduziert: 'very reduced design, only form and space, minimalist and meditative',
      portrait: 'a portrait of the person, spiritually interpreted, with aura or light elements, based on the attached reference image',
    },
    // Text Style
    textStyle: {
      'sakral-poetisch': 'sacred-poetic, reverent, ceremonial',
      'neutral-meditativ': 'neutral-meditative, calm, serene',
      nuechtern: 'sober, clear, matter-of-fact',
    },
    // Text Clarity
    textClarity: {
      raetselhaft: 'slightly enigmatic, open to interpretation',
      klar: 'clearly understandable, unambiguous',
    },
    // Back Side Style
    backSideStyle: {
      erklaerung: 'explanatory, descriptive, what this voucher means',
      einladung: 'inviting, a promise, a pledge to the recipient',
      mantra: 'like a mantra, meditative, a phrase to linger on',
    },
    // Feelings
    feelings: {
      vertrauen: 'trust',
      dankbarkeit: 'gratitude',
      ruhe: 'peace',
      wertschaetzung: 'appreciation',
      verbundenheit: 'connection',
      verantwortung: 'responsibility',
    },
    // Value Display
    valueDisplay: {
      explizit: 'The value is clearly and dominantly displayed on the front',
      symbolisch: 'The value is only symbolically hinted at, not explicitly written',
      beides: 'Symbolic representation on front, explicit explanation on back',
    },
    // Value Position
    valuePosition: {
      ecken: 'The value is placed in the corners, like classic banknotes',
      zentral: 'The value is centrally and prominently integrated in the design',
      beides: 'The value appears both in the corners and centrally',
    },
  },
};

const colorSchemeDescriptions = {
  de: {
    'gold-gruen': 'Gold und gedämpftes Grün: Warmes Gold, Olivgrün, Moos, Champagner',
    'blau-silber': 'Tiefblau und Silber: Nachtblau, Silber, Eisblau, Mondweiß',
    erdtoene: 'Warme Erdtöne: Ocker, Terrakotta, Sandstein, warmes Braun, Kupfer',
    'violett-weiss': 'Violett und Weiß: Zartes Lavendel, Purpur, Perlmutt, Cremeweiß',
    'schwarz-gold': 'Schwarz und Gold: Tiefes Schwarz, glänzendes Gold, Anthrazit',
    pastell: 'Sanfte Pastelltöne: Zartes Rosa, Hellblau, Mintgrün, Pfirsich, Lavendel',
  },
  en: {
    'gold-gruen': 'Gold and muted green: warm gold, olive green, moss, champagne',
    'blau-silber': 'Deep blue and silver: night blue, silver, ice blue, moon white',
    erdtoene: 'Warm earth tones: ochre, terracotta, sandstone, warm brown, copper',
    'violett-weiss': 'Violet and white: soft lavender, purple, mother-of-pearl, cream white',
    'schwarz-gold': 'Black and gold: deep black, shining gold, anthracite',
    pastell: 'Soft pastel tones: delicate pink, light blue, mint green, peach, lavender',
  },
};

function getColorPalette(config: SpiritualPromptConfig, lang: PromptLanguage): string {
  return colorSchemeDescriptions[lang][config.colorScheme];
}

function getBackSideText(config: SpiritualPromptConfig, lang: PromptLanguage): string {
  const value = config.voucherValue || (lang === 'de' ? '1 Stunde' : '1 hour');
  const name = config.personName?.trim();

  if (lang === 'de') {
    switch (config.backSideStyle) {
      case 'erklaerung':
        return name
          ? `Dieser Schein berechtigt zum Empfang von ${value}. Einzulösen bei ${name}.`
          : `Dieser Schein berechtigt zum Empfang von ${value}.`;
      case 'einladung':
        return `Für diesen Schein erhältst du ${value} oder ein gleichwertiges Dankeschön.`;
      case 'mantra':
        return `${value}. In Verbundenheit. In Dankbarkeit.`;
    }
  } else {
    switch (config.backSideStyle) {
      case 'erklaerung':
        return name
          ? `This voucher entitles you to receive ${value}. Redeemable with ${name}.`
          : `This voucher entitles you to receive ${value}.`;
      case 'einladung':
        return `For this voucher you will receive ${value} or an equivalent token of gratitude.`;
      case 'mantra':
        return `${value}. In connection. In gratitude.`;
    }
  }
}

/**
 * Build the contact info section for the back side
 * Only includes fields that are actually filled in
 */
function buildContactInfoSection(config: SpiritualPromptConfig, lang: PromptLanguage): string {
  const lines: string[] = [];

  if (config.personName?.trim()) {
    lines.push(`  – ${config.personName.trim()}`);
  }
  if (config.contactEmail?.trim()) {
    lines.push(`  – ${config.contactEmail.trim()}`);
  }
  if (config.contactPhone?.trim()) {
    lines.push(`  – ${config.contactPhone.trim()}`);
  }
  if (config.contactWebsite?.trim()) {
    lines.push(`  – ${config.contactWebsite.trim()}`);
  }
  if (config.contactSocial?.trim()) {
    lines.push(`  – ${config.contactSocial.trim()}`);
  }

  if (lines.length === 0) {
    return lang === 'de'
      ? '– Linke Seite:\n  – Platz für persönliche Kontaktdaten\n  – Alle Angaben ohne erklärende Labels'
      : '– Left side:\n  – Space for personal contact details\n  – All information without explanatory labels';
  }

  const header = lang === 'de' ? '– Linke Seite:' : '– Left side:';
  const footer = lang === 'de'
    ? '  – Alle Angaben ohne erklärende Labels'
    : '  – All information without explanatory labels';

  return `${header}\n${lines.join('\n')}\n${footer}`;
}

export function generateSpiritualPrompt(config: SpiritualPromptConfig): string {
  const lang = config.promptLanguage;
  const t = translations[lang];

  const sourcesText = config.sources.map((s) => t.sources[s]).join(', ');
  const feelingsText = config.feelings.map((f) => t.feelings[f]).join(', ');
  const colorPalette = getColorPalette(config, lang);
  const backSideText = getBackSideText(config, lang);
  const contactInfoSection = buildContactInfoSection(config, lang);

  const photoNote = config.centralMotif === 'portrait'
    ? (lang === 'de'
      ? '\n\nHINWEIS: Diesem Prompt ist ein Referenzfoto beigefügt. Nutze dieses Foto als Grundlage für das Portrait auf dem Schein.'
      : '\n\nNOTE: A reference photo is attached to this prompt. Use this photo as the basis for the portrait on the voucher.')
    : '';

  if (lang === 'de') {
    return `Erzeuge einen spirituellen, rahmenlosen Schein als zusammengehörige Vorder- und Rückseite, dargestellt nebeneinander als vollständige, professionelle Druckvorlage.${photoNote}

Beide Seiten gehören eindeutig zum gleichen Schein und teilen Farbwelt, Typografie und grafische DNA. Der Schein soll beim Anfassen folgende Gefühle vermitteln: ${feelingsText}.

GRUNDHALTUNG & STIL:
– ${t.mood[config.mood]}
– ${t.energy[config.energy]}
– ${t.style[config.style]}

SPIRITUELLE QUELLEN & SYMBOLIK:
– Inspiriert von: ${sourcesText}
– Diese Einflüsse sollen subtil in Ornamenten, Mustern und Symbolen spürbar sein

VORDERSEITE (Nennwert-Seite):
– Querformat im Seitenverhältnis moderner Banknoten
– Kein grafischer Rahmen
– Außenbereich bewusst weiß / sehr hell als ruhiger Rand (Quiet Zone)
– Gestaltung wirkt schwebend und wertig

Zentrales Motiv:
– ${t.centralMotif[config.centralMotif]}

Wertdarstellung:
– ${t.valueDisplay[config.valueDisplay]}
– ${t.valuePosition[config.valuePosition]}
${config.valueDisplay !== 'symbolisch' ? `– Der Wert lautet: „${config.voucherValue}"` : '– Kein expliziter Werttext auf der Vorderseite'}

Designmerkmale:
– Feine Linien, organische Muster, spirituelle Geometrie
– ${t.textStyle[config.textStyle]}
– ${t.textClarity[config.textClarity]}
– Seriennummer und Ausgabedatum optional

RÜCKSEITE (${t.backSideStyle[config.backSideStyle]}):
– Reduziertes Design im gleichen Stil wie die Vorderseite
– Gleiche Farbwelt, Typografie und grafische Sprache
– Organisch, offen, funktional
– Keine Kästen, Panels oder umrahmten Flächen

Layout der Rückseite:
${contactInfoSection}

– Rechte Seite:
  – Der Text: „${backSideText}"
  – Frei im Layout platziert, organisch eingebettet
  – Darunter ein leeres Unterschriftenfeld (keine vorgedruckte Unterschrift, damit der Nutzer nach dem Druck selbst signieren kann)

FARBWELT:
– ${colorPalette}
– Harmonisch, ruhig, meditativ
– Gute Lesbarkeit auf hellem Rand

FORMAT & DRUCK:
– Beide Seiten vollständig sichtbar
– Keine abgeschnittenen Ränder
– Kein Rahmen
– Gestaltungselemente enden vor dem Rand
– Neutraler Hintergrund außerhalb der Scheine

WICHTIG – AUSSCHLÜSSE:
– Keine staatlichen Hoheitszeichen
– Keine offiziellen Siegel, Wappen oder Flaggen
– Keine religiösen Symbole spezifischer Religionen
– Keine Begriffe wie Zentralbank, Bundesbank, Staat, Republik
– Kein Bezug zu real existierenden Ländern oder Währungen

QUALITÄT:
– Sehr hohe Detailtiefe
– Hochwertige, spirituelle Druckanmutung
– Professionelles, vertrauenswürdiges Erscheinungsbild
– 4K-Auflösung, gestochen scharf`;
  } else {
    return `Create a spiritual, frameless voucher as a connected front and back side, displayed side by side as a complete, professional print template.

Both sides clearly belong to the same voucher and share color palette, typography and graphic DNA. The voucher should convey the following feelings when held: ${feelingsText}.

BASIC ATTITUDE & STYLE:
– ${t.mood[config.mood]}
– ${t.energy[config.energy]}
– ${t.style[config.style]}

SPIRITUAL SOURCES & SYMBOLISM:
– Inspired by: ${sourcesText}
– These influences should be subtly perceptible in ornaments, patterns and symbols

FRONT SIDE (Value Side):
– Landscape format in the aspect ratio of modern banknotes
– No graphic frame
– Outer area deliberately white / very light as a quiet margin (Quiet Zone)
– Design appears floating and valuable

Central Motif:
– ${t.centralMotif[config.centralMotif]}

Value Display:
– ${t.valueDisplay[config.valueDisplay]}
– ${t.valuePosition[config.valuePosition]}
${config.valueDisplay !== 'symbolisch' ? `– The value reads: "${config.voucherValue}"` : '– No explicit value text on front'}

Design Features:
– Fine lines, organic patterns, spiritual geometry
– ${t.textStyle[config.textStyle]}
– ${t.textClarity[config.textClarity]}
– Serial number and issue date optional

BACK SIDE (${t.backSideStyle[config.backSideStyle]}):
– Reduced design in the same style as the front
– Same color palette, typography and graphic language
– Organic, open, functional
– No boxes, panels or framed areas

Back Side Layout:
${contactInfoSection}

– Right side:
  – The text: "${backSideText}"
  – Freely placed in layout, organically embedded
  – Below: an empty signature field (no pre-printed signature, so the user can sign themselves after printing)

COLOR PALETTE:
– ${colorPalette}
– Harmonious, calm, meditative
– Good readability on light margin

FORMAT & PRINT:
– Both sides fully visible
– No cropped edges
– No frame
– Design elements end before the margin
– Neutral background outside the vouchers

IMPORTANT – EXCLUSIONS:
– No state emblems
– No official seals, coats of arms or flags
– No religious symbols of specific religions
– No terms like central bank, federal bank, state, republic
– No reference to real existing countries or currencies

QUALITY:
– Very high level of detail
– High-quality, spiritual print appearance
– Professional, trustworthy look
– 4K resolution, razor sharp${photoNote}`;
  }
}

export function generateNegativePrompt(config: SpiritualPromptConfig): string {
  const lang = config.promptLanguage;

  if (lang === 'de') {
    return `Negativer Prompt:
collage, gemischte Stile, inkonsistentes Design, verschiedene Farbschemata, unpassende Typografie, abgeschnittene Ränder, Kästen, Textboxen, Panels, UI-Elemente, Formularfelder, Labels, religiöse Symbole, Kreuze, Davidsterne, Halbmonde, staatliche Symbole, Wappen, Flaggen, Münzen, echte Währungen, Euro, Dollar, fotorealistisch, Stockfoto-Ästhetik`;
  } else {
    return `Negative Prompt:
collage, mixed styles, inconsistent design, different color schemes, mismatched typography, cropped edges, boxes, text boxes, panels, UI elements, form fields, labels, religious symbols, crosses, Star of David, crescents, state symbols, coats of arms, flags, coins, real currencies, Euro, Dollar, photorealistic, stock photo aesthetic`;
  }
}
