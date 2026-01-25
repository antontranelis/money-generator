/**
 * Print Prompt Generator Service
 *
 * Generates prompts for both spiritual and business vouchers
 * based on the PrintGeneratorConfig.
 */

import type {
  PrintGeneratorConfig,
  PromptLanguage,
  SpiritualColorScheme,
  BusinessColorScheme,
  SpiritualMotif,
  BusinessMotif,
} from '../types/printGenerator';

// ============================================
// SPIRITUAL TRANSLATIONS
// ============================================

const spiritualTranslations = {
  de: {
    mood: {
      kontemplativ: 'still, kontemplativ, nach innen gerichtet',
      kraftvoll: 'kraftvoll, energetisch, ausstrahlend',
    },
    energy: {
      erdend: 'erdend, geerdet, naturverbunden, verwurzelt',
      transzendent: 'transzendent, kosmisch, aufsteigend, lichtvoll',
    },
    visualStyle: {
      archaisch: 'zeitlos-alt, archaisch, sakral, mit historischer Tiefe',
      modern: 'zeitgenössisch-spirituell, modern, reduziert, klar',
    },
    sources: {
      natur: 'Naturspiritualität, Erdzyklen, Elemente, organische Formen',
      bewusstsein: 'Achtsamkeit, Präsenz, Bewusstseinsarbeit, meditative Qualität',
      alchemie: 'Alchemie, Transformation, Wandlung, Metamorphose',
      kosmisch: 'kosmische Ordnung, Sterne, heilige Geometrie, universelle Muster',
      mystik: 'Mystik, das Unsagbare, Geheimnis, ohne religiöse Zuordnung',
      verbundenheit: 'menschliche Verbundenheit, Herzqualität, Beziehung, Mitgefühl',
    },
    motif: {
      silhouette: 'eine stilisierte menschliche Silhouette oder Aura als zentrales Element, abstrakt und lichtvoll',
      licht: 'ein strahlendes Licht, Kreis oder Mandala als zentrales Gestaltungselement',
      symbol: 'ein abstraktes Symbol wie Spirale, Samen, Lebensknoten oder heilige Geometrie im Zentrum',
      natur: 'ein abstrahiertes Naturmotiv wie Baum des Lebens, fließendes Wasser oder Himmelskörper',
      reduziert: 'sehr reduzierte Gestaltung, nur Form und Raum, minimalistisch und meditativ',
      portrait: 'ein Porträt der Person, spirituell interpretiert, mit Aura oder Lichtelementen, basierend auf dem beigefügten Referenzbild',
    },
    textStyle: {
      'sakral-poetisch': 'sakral-poetisch, ehrfürchtig, feierlich',
      'neutral-meditativ': 'neutral-meditativ, ruhig, gelassen',
      nuechtern: 'nüchtern, klar, sachlich',
    },
    textClarity: {
      raetselhaft: 'leicht rätselhaft, offen für Interpretation',
      klar: 'klar verständlich, eindeutig',
    },
    feelings: {
      vertrauen: 'Vertrauen',
      dankbarkeit: 'Dankbarkeit',
      ruhe: 'Ruhe',
      wertschaetzung: 'Wertschätzung',
      verbundenheit: 'Verbundenheit',
      verantwortung: 'Verantwortung',
    },
    colorScheme: {
      'gold-gruen': 'Gold und gedämpftes Grün: Warmes Gold, Olivgrün, Moos, Champagner',
      'blau-silber': 'Tiefblau und Silber: Nachtblau, Silber, Eisblau, Mondweiß',
      erdtoene: 'Warme Erdtöne: Ocker, Terrakotta, Sandstein, warmes Braun, Kupfer',
      'violett-weiss': 'Violett und Weiß: Zartes Lavendel, Purpur, Perlmutt, Cremeweiß',
      'schwarz-gold': 'Schwarz und Gold: Tiefes Schwarz, glänzendes Gold, Anthrazit',
      pastell: 'Sanfte Pastelltöne: Zartes Rosa, Hellblau, Mintgrün, Pfirsich, Lavendel',
    },
  },
  en: {
    mood: {
      kontemplativ: 'quiet, contemplative, inward-focused',
      kraftvoll: 'powerful, energetic, radiating',
    },
    energy: {
      erdend: 'grounding, rooted, connected to nature',
      transzendent: 'transcendent, cosmic, ascending, light-filled',
    },
    visualStyle: {
      archaisch: 'timeless-ancient, archaic, sacred, with historical depth',
      modern: 'contemporary-spiritual, modern, reduced, clear',
    },
    sources: {
      natur: 'nature spirituality, earth cycles, elements, organic forms',
      bewusstsein: 'mindfulness, presence, consciousness work, meditative quality',
      alchemie: 'alchemy, transformation, metamorphosis',
      kosmisch: 'cosmic order, stars, sacred geometry, universal patterns',
      mystik: 'mysticism, the ineffable, mystery, without religious affiliation',
      verbundenheit: 'human connection, heart quality, relationship, compassion',
    },
    motif: {
      silhouette: 'a stylized human silhouette or aura as central element, abstract and luminous',
      licht: 'a radiant light, circle or mandala as central design element',
      symbol: 'an abstract symbol like spiral, seed, life knot or sacred geometry at center',
      natur: 'an abstracted nature motif like tree of life, flowing water or celestial body',
      reduziert: 'very reduced design, only form and space, minimalist and meditative',
      portrait: 'a portrait of the person, spiritually interpreted, with aura or light elements, based on the attached reference image',
    },
    textStyle: {
      'sakral-poetisch': 'sacred-poetic, reverent, ceremonial',
      'neutral-meditativ': 'neutral-meditative, calm, serene',
      nuechtern: 'sober, clear, matter-of-fact',
    },
    textClarity: {
      raetselhaft: 'slightly enigmatic, open to interpretation',
      klar: 'clearly understandable, unambiguous',
    },
    feelings: {
      vertrauen: 'trust',
      dankbarkeit: 'gratitude',
      ruhe: 'peace',
      wertschaetzung: 'appreciation',
      verbundenheit: 'connection',
      verantwortung: 'responsibility',
    },
    colorScheme: {
      'gold-gruen': 'Gold and muted green: warm gold, olive green, moss, champagne',
      'blau-silber': 'Deep blue and silver: night blue, silver, ice blue, moon white',
      erdtoene: 'Warm earth tones: ochre, terracotta, sandstone, warm brown, copper',
      'violett-weiss': 'Violet and white: soft lavender, purple, mother-of-pearl, cream white',
      'schwarz-gold': 'Black and gold: deep black, shining gold, anthracite',
      pastell: 'Soft pastel tones: delicate pink, light blue, mint green, peach, lavender',
    },
  },
};

// ============================================
// BUSINESS TRANSLATIONS
// ============================================

const businessTranslations = {
  de: {
    industry: {
      consulting: 'Beratung und Management',
      tech: 'Technologie und IT',
      creative: 'Kreativ- und Designbranche',
      health: 'Gesundheit und Wellness',
      finance: 'Finanz- und Versicherungswesen',
      legal: 'Rechts- und Notarwesen',
      education: 'Bildung und Training',
      retail: 'Handel und E-Commerce',
      service: 'Dienstleistungssektor',
      other: 'allgemeiner Geschäftsbereich',
    },
    tone: {
      formal: 'sehr professionell und traditionell',
      professional: 'seriös aber zugänglich',
      friendly: 'warm und einladend',
      casual: 'entspannt und modern',
    },
    ctaStyle: {
      action: 'aktiv und handlungsorientiert (z.B. "Jetzt einlösen")',
      invitation: 'einladend und offen (z.B. "Wir freuen uns auf Sie")',
      statement: 'als Statement formuliert (z.B. "Ihr Gutschein")',
    },
    businessValues: {
      professionalitaet: 'Professionalität',
      vertrauen: 'Vertrauen',
      qualitaet: 'Qualität',
      wertschaetzung: 'Wertschätzung',
      innovation: 'Innovation',
      zuverlaessigkeit: 'Zuverlässigkeit',
    },
    motif: {
      'logo-zentral': 'das Firmenlogo prominent im Zentrum des Designs, professionell eingebettet',
      geometrisch: 'klare geometrische Formen und Strukturen, professionell und modern',
      linien: 'elegante Linien und Guilloche-Muster wie bei hochwertigen Wertpapieren',
      emblem: 'ein wappenartiges Emblem, traditionell und vertrauenswürdig',
      minimal: 'sehr reduziertes Design mit viel Weißraum, modern und elegant',
      rahmen: 'ein dekorativer Rahmen um das Design, klassisch und wertig',
      portrait: 'ein professionelles Portrait der Person basierend auf dem beigefügten Referenzbild, seriös und vertrauenswürdig in das Design integriert',
    },
    colorScheme: {
      'navy-gold': 'Tiefes Navy und warmes Gold: klassisch, vertrauenswürdig, traditionell',
      'grau-blau': 'Elegantes Grau mit Akzentblau: modern, professionell, zeitgemäß',
      'weiss-schwarz': 'Klares Weiß und tiefes Schwarz: minimalistisch, elegant, prägnant',
      'gruen-weiss': 'Naturgrün mit reinem Weiß: frisch, nachhaltig, vertrauenswürdig',
      'bordeaux-gold': 'Edles Bordeaux mit Gold: luxuriös, exklusiv, hochwertig',
      'petrol-silber': 'Modernes Petrol mit Silber: innovativ, technisch, zukunftsorientiert',
    },
  },
  en: {
    industry: {
      consulting: 'consulting and management',
      tech: 'technology and IT',
      creative: 'creative and design industry',
      health: 'health and wellness',
      finance: 'finance and insurance',
      legal: 'legal and notary',
      education: 'education and training',
      retail: 'retail and e-commerce',
      service: 'service sector',
      other: 'general business',
    },
    tone: {
      formal: 'very professional and traditional',
      professional: 'serious but approachable',
      friendly: 'warm and inviting',
      casual: 'relaxed and modern',
    },
    ctaStyle: {
      action: 'active and action-oriented (e.g. "Redeem now")',
      invitation: 'inviting and open (e.g. "We look forward to seeing you")',
      statement: 'formulated as statement (e.g. "Your voucher")',
    },
    businessValues: {
      professionalitaet: 'professionalism',
      vertrauen: 'trust',
      qualitaet: 'quality',
      wertschaetzung: 'appreciation',
      innovation: 'innovation',
      zuverlaessigkeit: 'reliability',
    },
    motif: {
      'logo-zentral': 'the company logo prominently in the center of the design, professionally embedded',
      geometrisch: 'clear geometric shapes and structures, professional and modern',
      linien: 'elegant lines and guilloche patterns like high-quality securities',
      emblem: 'a crest-like emblem, traditional and trustworthy',
      minimal: 'very reduced design with lots of whitespace, modern and elegant',
      rahmen: 'a decorative frame around the design, classic and valuable',
      portrait: 'a professional portrait of the person based on the attached reference image, seriously and trustworthily integrated into the design',
    },
    colorScheme: {
      'navy-gold': 'Deep navy and warm gold: classic, trustworthy, traditional',
      'grau-blau': 'Elegant gray with accent blue: modern, professional, contemporary',
      'weiss-schwarz': 'Clear white and deep black: minimalist, elegant, striking',
      'gruen-weiss': 'Nature green with pure white: fresh, sustainable, trustworthy',
      'bordeaux-gold': 'Noble bordeaux with gold: luxurious, exclusive, high-quality',
      'petrol-silber': 'Modern teal with silver: innovative, technical, future-oriented',
    },
  },
};

// ============================================
// SHARED TRANSLATIONS
// ============================================

const sharedTranslations = {
  de: {
    backSideStyle: {
      erklaerung: 'erklärend, beschreibend',
      einladung: 'einladend, ein Versprechen',
      mantra: 'wie ein Mantra, meditativ',
    },
  },
  en: {
    backSideStyle: {
      erklaerung: 'explanatory, descriptive',
      einladung: 'inviting, a promise',
      mantra: 'like a mantra, meditative',
    },
  },
};

/**
 * Generate value display instructions based on config
 * Uses extracted numeric value for corners, full value explained subtly
 */
function getValueDisplayInstructions(config: PrintGeneratorConfig, lang: PromptLanguage): string {
  const numericValue = extractNumericValue(config.voucherValue);
  const valueUnit = extractValueUnit(config.voucherValue);
  const fullValue = config.voucherValue;

  if (lang === 'de') {
    const positionText = {
      ecken: `In den Ecken steht nur die Zahl „${numericValue}" (wie bei echten Banknoten), elegant und klassisch`,
      zentral: `Die Zahl „${numericValue}" erscheint zentral und prominent im Design`,
      beides: `Die Zahl „${numericValue}" erscheint sowohl in den Ecken als auch zentral`,
    }[config.valuePosition];

    const displayText = {
      explizit: `Der vollständige Wert „${fullValue}" wird dezent aber lesbar irgendwo auf der Vorderseite platziert (z.B. klein unter der zentralen Zahl oder am unteren Rand)`,
      symbolisch: `Der Wert wird nur durch die Zahl „${numericValue}" angedeutet - die Einheit „${valueUnit}" erscheint NICHT auf der Vorderseite`,
      beides: `Die Zahl „${numericValue}" dominiert, der vollständige Wert „${fullValue}" wird erst auf der Rückseite erklärt`,
    }[config.valueDisplay];

    return `– ${positionText}\n– ${displayText}`;
  } else {
    const positionText = {
      ecken: `In the corners only the number "${numericValue}" appears (like real banknotes), elegant and classic`,
      zentral: `The number "${numericValue}" appears centrally and prominently in the design`,
      beides: `The number "${numericValue}" appears both in the corners and centrally`,
    }[config.valuePosition];

    const displayText = {
      explizit: `The full value "${fullValue}" is placed subtly but readable somewhere on the front (e.g., small below the central number or at the bottom edge)`,
      symbolisch: `The value is only hinted at by the number "${numericValue}" - the unit "${valueUnit}" does NOT appear on the front`,
      beides: `The number "${numericValue}" dominates, the full value "${fullValue}" is only explained on the back`,
    }[config.valueDisplay];

    return `– ${positionText}\n– ${displayText}`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Extract numeric value from voucher value string for corner display
 * Examples: "1 Stunde" -> "1", "5 Brötchen" -> "5", "Eine Massage" -> "1"
 */
function extractNumericValue(voucherValue: string): string {
  // Try to find a leading number
  const match = voucherValue.match(/^(\d+)/);
  if (match) {
    return match[1];
  }

  // Map common words to numbers
  const wordToNumber: Record<string, string> = {
    // German
    'ein': '1', 'eine': '1', 'einen': '1', 'einer': '1', 'einem': '1',
    'zwei': '2', 'drei': '3', 'vier': '4', 'fünf': '5',
    'sechs': '6', 'sieben': '7', 'acht': '8', 'neun': '9', 'zehn': '10',
    // English
    'one': '1', 'a': '1', 'an': '1',
    'two': '2', 'three': '3', 'four': '4', 'five': '5',
    'six': '6', 'seven': '7', 'eight': '8', 'nine': '9', 'ten': '10',
  };

  const firstWord = voucherValue.toLowerCase().split(/\s+/)[0];
  if (wordToNumber[firstWord]) {
    return wordToNumber[firstWord];
  }

  // Default to "1" if no number found
  return '1';
}

/**
 * Get the unit/description from the voucher value (everything after the number)
 * Examples: "1 Stunde" -> "Stunde", "5 Brötchen" -> "Brötchen"
 */
function extractValueUnit(voucherValue: string): string {
  // Remove leading number and whitespace
  const withoutNumber = voucherValue.replace(/^\d+\s*/, '');
  if (withoutNumber && withoutNumber !== voucherValue) {
    return withoutNumber;
  }

  // Remove leading word-number and get rest
  const words = voucherValue.split(/\s+/);
  if (words.length > 1) {
    return words.slice(1).join(' ');
  }

  return voucherValue;
}

function getBackSideText(config: PrintGeneratorConfig, lang: PromptLanguage): string {
  // If custom backSideText is provided, use it directly
  if (config.backSideText?.trim()) {
    return config.backSideText.trim();
  }

  const value = config.voucherValue || (lang === 'de' ? '1 Stunde' : '1 hour');
  const name = config.personName?.trim();

  if (config.styleContext === 'spiritual') {
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
  } else {
    // Business style
    if (lang === 'de') {
      switch (config.backSideStyle) {
        case 'erklaerung':
          return name
            ? `Dieser Gutschein berechtigt zum Erhalt von ${value}. Einzulösen bei ${name}.`
            : `Dieser Gutschein berechtigt zum Erhalt von ${value}.`;
        case 'einladung':
          return `Wir freuen uns, Ihnen ${value} überreichen zu dürfen.`;
        case 'mantra':
          return `${value}. Für Sie. Mit Wertschätzung.`;
      }
    } else {
      switch (config.backSideStyle) {
        case 'erklaerung':
          return name
            ? `This voucher entitles you to ${value}. Redeemable at ${name}.`
            : `This voucher entitles you to ${value}.`;
        case 'einladung':
          return `We are pleased to present you with ${value}.`;
        case 'mantra':
          return `${value}. For you. With appreciation.`;
      }
    }
  }
  return '';
}

function buildContactInfoSection(config: PrintGeneratorConfig, lang: PromptLanguage): string {
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

  if (lines.length === 0) {
    return lang === 'de'
      ? '– Linke Seite:\n  – Platz für Kontaktdaten\n  – Alle Angaben ohne erklärende Labels'
      : '– Left side:\n  – Space for contact details\n  – All information without explanatory labels';
  }

  const header = lang === 'de' ? '– Linke Seite:' : '– Left side:';
  const footer = lang === 'de'
    ? '  – Alle Angaben ohne erklärende Labels'
    : '  – All information without explanatory labels';

  return `${header}\n${lines.join('\n')}\n${footer}`;
}

// ============================================
// SPIRITUAL PROMPT GENERATOR
// ============================================

function generateSpiritualPrompt(config: PrintGeneratorConfig): string {
  const lang = config.promptLanguage;
  const t = spiritualTranslations[lang];
  const shared = sharedTranslations[lang];

  const sourcesText = config.sources.map((s) => t.sources[s]).join(', ');
  const feelingsText = config.feelings.map((f) => t.feelings[f]).join(', ');
  const colorPalette = t.colorScheme[config.colorScheme as SpiritualColorScheme];
  const backSideText = getBackSideText(config, lang);
  const contactInfoSection = buildContactInfoSection(config, lang);
  const motif = t.motif[config.centralMotif as SpiritualMotif];

  const photoNote = config.centralMotif === 'portrait'
    ? (lang === 'de'
      ? '\n\nHINWEIS: Diesem Prompt ist ein Referenzfoto beigefügt. Nutze dieses Foto als Grundlage für das Portrait auf dem Schein.'
      : '\n\nNOTE: A reference photo is attached to this prompt. Use this photo as the basis for the portrait on the voucher.')
    : '';

  const qrCodeNote = config.qrCodeEnabled && config.qrCodeUrl
    ? (lang === 'de'
      ? `\n– Ein dezenter QR-Code wird auf der Rückseite integriert (URL: ${config.qrCodeUrl})`
      : `\n– A subtle QR code is integrated on the back (URL: ${config.qrCodeUrl})`)
    : '';

  if (lang === 'de') {
    return `Erzeuge einen spirituellen, rahmenlosen Gutschein als zwei zusammengehörige Bilder übereinander, dargestellt als vollständige, professionelle Druckvorlage.${photoNote}

Beide Bilder gehören eindeutig zum gleichen Gutschein und teilen Farbwelt, Typografie und grafische DNA. Der Gutschein soll beim Anfassen folgende Gefühle vermitteln: ${feelingsText}.

GRUNDHALTUNG & STIL:
– ${t.mood[config.mood]}
– ${t.energy[config.energy]}
– ${t.visualStyle[config.visualStyle]}

SPIRITUELLE QUELLEN & SYMBOLIK:
– Inspiriert von: ${sourcesText}
– Diese Einflüsse sollen subtil in Ornamenten, Mustern und Symbolen spürbar sein

OBERES BILD (zeigt den Wert):
– Querformat im Seitenverhältnis moderner Banknoten (ca. 2.5:1)
– Kein grafischer Rahmen
– SYMMETRISCHE RÄNDER: Der weiße/helle Rand muss an allen vier Seiten EXAKT GLEICH breit sein (ca. 3% der Bildbreite)
– Inhalt ist ZENTRIERT im Bild - gleicher Abstand links und rechts, gleicher Abstand oben und unten
– Gestaltung wirkt schwebend und wertig

Zentrales Motiv:
– ${motif}

Wertdarstellung (wie bei echten Banknoten):
${getValueDisplayInstructions(config, lang)}

Designmerkmale:
– Feine Linien, organische Muster, spirituelle Geometrie
– ${t.textStyle[config.textStyle]}
– ${t.textClarity[config.textClarity]}
– Seriennummer und Ausgabedatum optional

UNTERES BILD (zeigt Kontaktdaten, ${shared.backSideStyle[config.backSideStyle]}):
– Reduziertes Design im gleichen Stil wie das obere Bild
– EXAKT GLEICHE Abmessungen und Randbreiten wie das obere Bild
– SYMMETRISCHE RÄNDER: Gleiche Randbreite an allen vier Seiten
– Gleiche Farbwelt, Typografie und grafische Sprache
– Organisch, offen, funktional
– Keine Kästen, Panels oder umrahmten Flächen${qrCodeNote}

Layout des unteren Bildes:
${contactInfoSection}

– Rechte Seite:
  – Der Text: „${backSideText}"
  – Frei im Layout platziert, organisch eingebettet
  – UNTERSCHRIFTSBEREICH - KRITISCH:
    • Unter dem Text ein leerer Bereich für die Unterschrift
    • Das Wort „Unterschrift" in sehr kleiner, dezenter, heller Schrift als Label
    • Eine dezente horizontale Linie für die Unterschrift ist erlaubt und erwünscht
    • ABER: KEINE vorgedruckte Handschrift, KEINE Signatur, KEINE Schnörkel, KEINE Initialen
    • Der Empfänger wird auf dem GEDRUCKTEN PHYSISCHEN Schein selbst unterschreiben
    • Das Feld über/auf der Linie muss LEER bleiben - nur Linie + Label, sonst nichts

FARBWELT:
– ${colorPalette}
– Harmonisch, ruhig, meditativ
– Gute Lesbarkeit auf hellem Rand

FORMAT & DRUCK:
– Vertikales Layout: Wert-Bild oben, Kontakt-Bild unten
– Beide Bilder vollständig sichtbar und IDENTISCH in Größe und Form
– KRITISCH - SYMMETRIE: Beide Gutscheine müssen PERFEKT ZENTRIERT sein mit EXAKT GLEICHEN Rändern an allen vier Seiten
– Der Inhalt jedes Gutscheins ist mittig platziert - NICHT nach links, rechts, oben oder unten verschoben
– Keine abgeschnittenen Ränder
– Kein Rahmen
– Gestaltungselemente enden gleichmäßig vor dem Rand (nicht näher an einer Seite als an der anderen)
– WICHTIG: Der Hintergrund AUSSERHALB der Gutscheine muss rein schwarz sein (#000000) - kein Grau, kein Schatten, nur reines Schwarz
– ABSOLUT KEINE Beschriftungen oder Labels im Bild! Keine Texte wie "Vorderseite", "Rückseite", "Front", "Back", "Nennwert-Seite", "Kontakt-Seite" oder ähnliche Bezeichnungen irgendwo im Bild!

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
    return `Create a spiritual, frameless voucher as two connected images stacked vertically, displayed as a complete, professional print template.${photoNote}

Both images clearly belong to the same voucher and share color palette, typography and graphic DNA. The voucher should convey the following feelings when held: ${feelingsText}.

BASIC ATTITUDE & STYLE:
– ${t.mood[config.mood]}
– ${t.energy[config.energy]}
– ${t.visualStyle[config.visualStyle]}

SPIRITUAL SOURCES & SYMBOLISM:
– Inspired by: ${sourcesText}
– These influences should be subtly perceptible in ornaments, patterns and symbols

TOP IMAGE (shows the value):
– Landscape format in the aspect ratio of modern banknotes (approx. 2.5:1)
– No graphic frame
– SYMMETRICAL MARGINS: The white/light margin must be EXACTLY THE SAME width on all four sides (approx. 3% of image width)
– Content is CENTERED in the image - equal distance left and right, equal distance top and bottom
– Design appears floating and valuable

Central Motif:
– ${motif}

Value Display (like real banknotes):
${getValueDisplayInstructions(config, lang)}

Design Features:
– Fine lines, organic patterns, spiritual geometry
– ${t.textStyle[config.textStyle]}
– ${t.textClarity[config.textClarity]}
– Serial number and issue date optional

BOTTOM IMAGE (shows contact details, ${shared.backSideStyle[config.backSideStyle]}):
– Reduced design in the same style as the top image
– EXACTLY SAME dimensions and margin widths as the top image
– SYMMETRICAL MARGINS: Same margin width on all four sides
– Same color palette, typography and graphic language
– Organic, open, functional
– No boxes, panels or framed areas${qrCodeNote}

Bottom Image Layout:
${contactInfoSection}

– Right side:
  – The text: "${backSideText}"
  – Freely placed in layout, organically embedded
  – SIGNATURE AREA - CRITICAL:
    • Below the text an empty area for the signature
    • The word "Signature" in very small, subtle, light text as label
    • A subtle horizontal line for the signature is allowed and desired
    • BUT: NO pre-printed handwriting, NO signature, NO flourishes, NO initials
    • The recipient will sign on the PRINTED PHYSICAL voucher themselves
    • The area above/on the line must remain EMPTY - only line + label, nothing else

COLOR PALETTE:
– ${colorPalette}
– Harmonious, calm, meditative
– Good readability on light margin

FORMAT & PRINT:
– Vertical layout: Value image on top, contact image on bottom
– Both images fully visible and IDENTICAL in size and shape
– CRITICAL - SYMMETRY: Both vouchers must be PERFECTLY CENTERED with EXACTLY EQUAL margins on all four sides
– The content of each voucher is centered - NOT shifted to the left, right, top or bottom
– No cropped edges
– No frame
– Design elements end evenly before the margin (not closer to one side than another)
– IMPORTANT: The background OUTSIDE the vouchers must be pure black (#000000) - no gray, no shadows, only pure black
– ABSOLUTELY NO labels or text annotations in the image! No text like "Front", "Back", "Vorderseite", "Rückseite", "Value Side", "Contact Side" or similar labels anywhere in the image!

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
– 4K resolution, razor sharp`;
  }
}

// ============================================
// BUSINESS PROMPT GENERATOR
// ============================================

function generateBusinessPrompt(config: PrintGeneratorConfig): string {
  const lang = config.promptLanguage;
  const t = businessTranslations[lang];
  const shared = sharedTranslations[lang];

  const colorPalette = t.colorScheme[config.colorScheme as BusinessColorScheme];
  const backSideText = getBackSideText(config, lang);
  const contactInfoSection = buildContactInfoSection(config, lang);
  const motif = t.motif[config.centralMotif as BusinessMotif];

  // Photo note for portrait mode (like spiritual)
  const photoNote = config.centralMotif === 'portrait'
    ? (lang === 'de'
      ? '\n\nHINWEIS: Diesem Prompt ist ein Referenzfoto beigefügt. Nutze dieses Foto als Grundlage für das Portrait auf dem Gutschein.'
      : '\n\nNOTE: A reference photo is attached to this prompt. Use this photo as the basis for the portrait on the voucher.')
    : '';

  // Logo note - stronger emphasis when logo is central motif
  const logoNote = config.logoImage
    ? (config.centralMotif === 'logo-zentral'
      ? (lang === 'de'
        ? '\n\nHINWEIS: Diesem Prompt ist ein Firmenlogo beigefügt. Nutze dieses Logo als ZENTRALES ELEMENT des Designs – es soll prominent im Mittelpunkt des Gutscheins stehen und das visuelle Hauptelement sein.'
        : '\n\nNOTE: A company logo is attached to this prompt. Use this logo as the CENTRAL ELEMENT of the design – it should be prominently in the center of the voucher and be the main visual element.')
      : (lang === 'de'
        ? '\n\nHINWEIS: Ein Firmenlogo ist beigefügt und soll prominent im Design integriert werden.'
        : '\n\nNOTE: A company logo is attached and should be prominently integrated into the design.'))
    : '';

  const qrCodeNote = config.qrCodeEnabled && config.qrCodeUrl
    ? (lang === 'de'
      ? `\n– Ein dezenter QR-Code wird auf der Rückseite integriert (URL: ${config.qrCodeUrl})`
      : `\n– A subtle QR code is integrated on the back (URL: ${config.qrCodeUrl})`)
    : '';

  const businessValuesText = config.businessValues.map((v) => t.businessValues[v]).join(', ');

  if (lang === 'de') {
    return `Erzeuge einen professionellen, rahmenlosen Business-Gutschein als zwei zusammengehörige Bilder übereinander, dargestellt als vollständige, hochwertige Druckvorlage.${photoNote}${logoNote}

Beide Bilder gehören eindeutig zum gleichen Gutschein und teilen Farbwelt, Typografie und grafische DNA. Der Gutschein soll beim Anfassen folgende Werte vermitteln: ${businessValuesText}.

BRANCHE & TONALITÄT:
– Branche: ${t.industry[config.industry]}
– Tonalität: ${t.tone[config.tone]}
– Call-to-Action Stil: ${t.ctaStyle[config.ctaStyle]}

GESCHÄFTLICHE WERTE & AUSSTRAHLUNG:
– Inspiriert von: Hochwertigen Wertpapieren, Premium-Geschenkgutscheinen, Banknotendesign
– Diese Einflüsse sollen subtil in Guillochen, Linienmustern und Typografie spürbar sein

OBERES BILD (zeigt den Wert):
– Querformat im Seitenverhältnis moderner Banknoten (ca. 2.5:1)
– Kein grafischer Rahmen
– SYMMETRISCHE RÄNDER: Der weiße/helle Rand muss an allen vier Seiten EXAKT GLEICH breit sein (ca. 3% der Bildbreite)
– Inhalt ist ZENTRIERT im Bild - gleicher Abstand links und rechts, gleicher Abstand oben und unten
– Gestaltung wirkt schwebend und wertig

Zentrales Motiv:
– ${motif}

Wertdarstellung (wie bei echten Banknoten):
${getValueDisplayInstructions(config, lang)}

Designmerkmale:
– Klare Linien, professionelle Typografie
– ${t.tone[config.tone]}
– Hochwertig und vertrauenswürdig
– Seriennummer und Ausgabedatum optional

UNTERES BILD (zeigt Kontaktdaten, ${shared.backSideStyle[config.backSideStyle]}):
– Reduziertes Design im gleichen Stil wie das obere Bild
– EXAKT GLEICHE Abmessungen und Randbreiten wie das obere Bild
– SYMMETRISCHE RÄNDER: Gleiche Randbreite an allen vier Seiten
– Gleiche Farbwelt, Typografie und grafische Sprache
– Professionell, strukturiert, funktional
– Keine Kästen, Panels oder umrahmten Flächen${qrCodeNote}

Layout des unteren Bildes:
${contactInfoSection}

– Rechte Seite:
  – Der Text: „${backSideText}"
  – Frei im Layout platziert, professionell eingebettet
  – UNTERSCHRIFTSBEREICH - KRITISCH:
    • Unter dem Text ein leerer Bereich für die Unterschrift
    • Das Wort „Unterschrift" in sehr kleiner, dezenter, heller Schrift als Label
    • Eine dezente horizontale Linie für die Unterschrift ist erlaubt und erwünscht
    • ABER: KEINE vorgedruckte Handschrift, KEINE Signatur, KEINE Schnörkel, KEINE Initialen
    • Der Empfänger wird auf dem GEDRUCKTEN PHYSISCHEN Schein selbst unterschreiben
    • Das Feld über/auf der Linie muss LEER bleiben - nur Linie + Label, sonst nichts

FARBWELT:
– ${colorPalette}
– Professionell, vertrauenswürdig
– Gute Lesbarkeit auf hellem Rand

FORMAT & DRUCK:
– Vertikales Layout: Wert-Bild oben, Kontakt-Bild unten
– Beide Bilder vollständig sichtbar und IDENTISCH in Größe und Form
– KRITISCH - SYMMETRIE: Beide Gutscheine müssen PERFEKT ZENTRIERT sein mit EXAKT GLEICHEN Rändern an allen vier Seiten
– Der Inhalt jedes Gutscheins ist mittig platziert - NICHT nach links, rechts, oben oder unten verschoben
– Keine abgeschnittenen Ränder
– Kein Rahmen
– Gestaltungselemente enden gleichmäßig vor dem Rand (nicht näher an einer Seite als an der anderen)
– WICHTIG: Der Hintergrund AUSSERHALB der Gutscheine muss rein schwarz sein (#000000) - kein Grau, kein Schatten, nur reines Schwarz
– ABSOLUT KEINE Beschriftungen oder Labels im Bild! Keine Texte wie "Vorderseite", "Rückseite", "Front", "Back", "Nennwert-Seite", "Kontakt-Seite" oder ähnliche Bezeichnungen irgendwo im Bild!

WICHTIG – AUSSCHLÜSSE:
– Keine staatlichen Hoheitszeichen
– Keine offiziellen Siegel, Wappen oder Flaggen
– Keine Begriffe wie Zentralbank, Bundesbank, Staat, Republik
– Kein Bezug zu real existierenden Ländern oder Währungen

QUALITÄT:
– Sehr hohe Detailtiefe
– Hochwertige, professionelle Druckanmutung
– Professionelles, vertrauenswürdiges Erscheinungsbild
– 4K-Auflösung, gestochen scharf`;
  } else {
    return `Create a professional, frameless business voucher as two connected images stacked vertically, displayed as a complete, high-quality print template.${photoNote}${logoNote}

Both images clearly belong to the same voucher and share color palette, typography and graphic DNA. The voucher should convey the following values when held: ${businessValuesText}.

INDUSTRY & TONE:
– Industry: ${t.industry[config.industry]}
– Tone: ${t.tone[config.tone]}
– Call-to-Action style: ${t.ctaStyle[config.ctaStyle]}

BUSINESS VALUES & IMPRESSION:
– Inspired by: High-quality securities, premium gift vouchers, banknote design
– These influences should be subtly perceptible in guilloches, line patterns and typography

TOP IMAGE (shows the value):
– Landscape format in the aspect ratio of modern banknotes (approx. 2.5:1)
– No graphic frame
– SYMMETRICAL MARGINS: The white/light margin must be EXACTLY THE SAME width on all four sides (approx. 3% of image width)
– Content is CENTERED in the image - equal distance left and right, equal distance top and bottom
– Design appears floating and valuable

Central Motif:
– ${motif}

Value Display (like real banknotes):
${getValueDisplayInstructions(config, lang)}

Design Features:
– Clear lines, professional typography
– ${t.tone[config.tone]}
– High-quality and trustworthy
– Serial number and issue date optional

BOTTOM IMAGE (shows contact details, ${shared.backSideStyle[config.backSideStyle]}):
– Reduced design in the same style as the top image
– EXACTLY SAME dimensions and margin widths as the top image
– SYMMETRICAL MARGINS: Same margin width on all four sides
– Same color palette, typography and graphic language
– Professional, structured, functional
– No boxes, panels or framed areas${qrCodeNote}

Bottom Image Layout:
${contactInfoSection}

– Right side:
  – The text: "${backSideText}"
  – Freely placed in layout, professionally embedded
  – SIGNATURE AREA - CRITICAL:
    • Below the text an empty area for the signature
    • The word "Signature" in very small, subtle, light text as label
    • A subtle horizontal line for the signature is allowed and desired
    • BUT: NO pre-printed handwriting, NO signature, NO flourishes, NO initials
    • The recipient will sign on the PRINTED PHYSICAL voucher themselves
    • The area above/on the line must remain EMPTY - only line + label, nothing else

COLOR PALETTE:
– ${colorPalette}
– Professional, trustworthy
– Good readability on light margin

FORMAT & PRINT:
– Vertical layout: Value image on top, contact image on bottom
– Both images fully visible and IDENTICAL in size and shape
– CRITICAL - SYMMETRY: Both vouchers must be PERFECTLY CENTERED with EXACTLY EQUAL margins on all four sides
– The content of each voucher is centered - NOT shifted to the left, right, top or bottom
– No cropped edges
– No frame
– Design elements end evenly before the margin (not closer to one side than another)
– IMPORTANT: The background OUTSIDE the vouchers must be pure black (#000000) - no gray, no shadows, only pure black
– ABSOLUTELY NO labels or text annotations in the image! No text like "Front", "Back", "Vorderseite", "Rückseite", "Value Side", "Contact Side" or similar labels anywhere in the image!

IMPORTANT – EXCLUSIONS:
– No state emblems
– No official seals, coats of arms or flags
– No terms like central bank, federal bank, state, republic
– No reference to real existing countries or currencies

QUALITY:
– Very high level of detail
– High-quality, professional print appearance
– Professional, trustworthy look
– 4K resolution, razor sharp`;
  }
}

// ============================================
// MAIN EXPORT FUNCTIONS
// ============================================

export function generatePrintPrompt(config: PrintGeneratorConfig): string {
  if (config.styleContext === 'spiritual') {
    return generateSpiritualPrompt(config);
  } else {
    return generateBusinessPrompt(config);
  }
}

/**
 * Generate the default back side text based on config (without custom override)
 * This is useful for showing a preview/placeholder in the UI
 */
export function generateDefaultBackSideText(config: PrintGeneratorConfig): string {
  const lang = config.promptLanguage;
  const value = config.voucherValue || (lang === 'de' ? '1 Stunde' : '1 hour');
  const name = config.personName?.trim();

  if (config.styleContext === 'spiritual') {
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
  } else {
    // Business style
    if (lang === 'de') {
      switch (config.backSideStyle) {
        case 'erklaerung':
          return name
            ? `Dieser Gutschein berechtigt zum Erhalt von ${value}. Einzulösen bei ${name}.`
            : `Dieser Gutschein berechtigt zum Erhalt von ${value}.`;
        case 'einladung':
          return `Wir freuen uns, Ihnen ${value} überreichen zu dürfen.`;
        case 'mantra':
          return `${value}. Für Sie. Mit Wertschätzung.`;
      }
    } else {
      switch (config.backSideStyle) {
        case 'erklaerung':
          return name
            ? `This voucher entitles you to ${value}. Redeemable at ${name}.`
            : `This voucher entitles you to ${value}.`;
        case 'einladung':
          return `We are pleased to present you with ${value}.`;
        case 'mantra':
          return `${value}. For you. With appreciation.`;
      }
    }
  }
  return '';
}

export function generatePrintNegativePrompt(config: PrintGeneratorConfig): string {
  const lang = config.promptLanguage;

  const baseNegatives = lang === 'de'
    ? 'collage, gemischte Stile, inkonsistentes Design, verschiedene Farbschemata, unpassende Typografie, abgeschnittene Ränder, Kästen, Textboxen, Panels, UI-Elemente, Formularfelder, Labels, staatliche Symbole, Wappen, Flaggen, Münzen, echte Währungen, Euro, Dollar, fotorealistisch, Stockfoto-Ästhetik, Beschriftungen, Seitenbezeichnungen, "Vorderseite", "Rückseite", "Front", "Back", vorgedruckte Unterschrift, Handschrift im Unterschriftsfeld, Signatur-Schnörkel, ausgefüllte Unterschrift, Initialen im Unterschriftsfeld'
    : 'collage, mixed styles, inconsistent design, different color schemes, mismatched typography, cropped edges, boxes, text boxes, panels, UI elements, form fields, labels, state symbols, coats of arms, flags, coins, real currencies, Euro, Dollar, photorealistic, stock photo aesthetic, annotations, side labels, "Front", "Back", "Vorderseite", "Rückseite", pre-printed signature, handwriting in signature field, signature flourishes, filled signature, initials in signature field';

  if (config.styleContext === 'spiritual') {
    const spiritualNegatives = lang === 'de'
      ? ', religiöse Symbole, Kreuze, Davidsterne, Halbmonde'
      : ', religious symbols, crosses, Star of David, crescents';
    return lang === 'de'
      ? `Negativer Prompt:\n${baseNegatives}${spiritualNegatives}`
      : `Negative Prompt:\n${baseNegatives}${spiritualNegatives}`;
  } else {
    return lang === 'de'
      ? `Negativer Prompt:\n${baseNegatives}`
      : `Negative Prompt:\n${baseNegatives}`;
  }
}
