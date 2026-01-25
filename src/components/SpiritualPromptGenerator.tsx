import { useSpiritualPromptStore } from '../stores/spiritualPromptStore';
import { useBillStore } from '../stores/billStore';
import {
  VOUCHER_VALUE_PRESETS,
  type Mood,
  type Energy,
  type Style,
  type SpiritualSource,
  type ValueDisplay,
  type ValuePosition,
  type CentralMotif,
  type TextStyle,
  type TextClarity,
  type BackSideStyle,
  type Feeling,
  type PromptLanguage,
  type ColorScheme,
} from '../types/spiritualPrompt';

// UI Labels for options
const labels = {
  de: {
    sections: {
      grundhaltung: 'Grundhaltung & Wirkung',
      quellen: 'Spirituelle Quellen',
      wert: 'Wertdarstellung',
      motiv: 'Zentrales Motiv',
      text: 'Sprache & Textgefühl',
      rueckseite: 'Rückseite',
      gefuehl: 'Gefühl beim Anfassen',
      personalisierung: 'Personalisierung',
      kontakt: 'Kontaktdaten',
      qrCode: 'QR-Code',
      sprache: 'Prompt-Sprache',
      farben: 'Farbschema',
    },
    sectionInfo: {
      grundhaltung: 'Bestimmt die emotionale Grundstimmung des Designs',
      quellen: 'Welche spirituellen Traditionen sollen das Design inspirieren?',
      wert: 'Wie soll der Wert des Gutscheins dargestellt werden?',
      motiv: 'Das zentrale visuelle Element des Scheins',
      text: 'Wie soll die Sprache auf dem Schein wirken?',
      rueckseite: 'Der Stil des Textes auf der Rückseite',
      gefuehl: 'Welche Gefühle soll der Schein vermitteln?',
      farben: 'Die Farbpalette für das Design',
    },
    mood: {
      kontemplativ: 'Still & Kontemplativ',
      kraftvoll: 'Kraftvoll & Energetisch',
    },
    moodTooltip: {
      kontemplativ: '→ still, kontemplativ, nach innen gerichtet',
      kraftvoll: '→ kraftvoll, energetisch, ausstrahlend',
    },
    energy: {
      erdend: 'Erdend',
      transzendent: 'Transzendent',
    },
    energyTooltip: {
      erdend: '→ erdend, geerdet, naturverbunden, verwurzelt',
      transzendent: '→ transzendent, kosmisch, aufsteigend, lichtvoll',
    },
    style: {
      archaisch: 'Archaisch / Sakral',
      modern: 'Modern / Reduziert',
    },
    styleTooltip: {
      archaisch: '→ zeitlos-alt, archaisch, sakral, mit historischer Tiefe',
      modern: '→ zeitgenössisch-spirituell, modern, reduziert, klar',
    },
    sources: {
      natur: 'Natur',
      bewusstsein: 'Bewusstsein',
      alchemie: 'Alchemie',
      kosmisch: 'Kosmisch',
      mystik: 'Mystik',
      verbundenheit: 'Verbundenheit',
    },
    sourcesTooltip: {
      natur: '→ Naturspiritualität, Erdzyklen, Elemente, organische Formen',
      bewusstsein: '→ Achtsamkeit, Präsenz, Bewusstseinsarbeit, meditative Qualität',
      alchemie: '→ Alchemie, Transformation, Wandlung, Metamorphose',
      kosmisch: '→ kosmische Ordnung, Sterne, heilige Geometrie, universelle Muster',
      mystik: '→ Mystik, das Unsagbare, Geheimnis, ohne religiöse Zuordnung',
      verbundenheit: '→ menschliche Verbundenheit, Herzqualität, Beziehung, Mitgefühl',
    },
    valueDisplay: {
      explizit: 'Explizit',
      symbolisch: 'Symbolisch',
      beides: 'Beides',
    },
    valueDisplayTooltip: {
      explizit: '→ Der Wert wird klar und dominant auf der Vorderseite angezeigt',
      symbolisch: '→ Der Wert wird nur symbolisch angedeutet, nicht explizit geschrieben',
      beides: '→ Symbolische Darstellung auf der Vorderseite, explizite Erklärung auf der Rückseite',
    },
    valuePosition: {
      ecken: 'In den Ecken',
      zentral: 'Zentral',
      beides: 'Beides',
    },
    valuePositionTooltip: {
      ecken: '→ Der Wert ist in den Ecken platziert, wie bei klassischen Banknoten',
      zentral: '→ Der Wert ist zentral und prominent im Design integriert',
      beides: '→ Der Wert erscheint sowohl in den Ecken als auch zentral',
    },
    centralMotif: {
      silhouette: 'Silhouette / Aura',
      licht: 'Licht / Mandala',
      symbol: 'Symbol / Spirale',
      natur: 'Naturmotiv',
      reduziert: 'Minimalistisch',
      portrait: 'Portrait',
    },
    centralMotifTooltip: {
      silhouette: '→ eine stilisierte menschliche Silhouette oder Aura als zentrales Element, abstrakt und lichtvoll',
      licht: '→ ein strahlendes Licht, Kreis oder Mandala als zentrales Gestaltungselement',
      symbol: '→ ein abstraktes Symbol wie Spirale, Samen, Lebensknoten oder heilige Geometrie im Zentrum',
      natur: '→ ein abstrahiertes Naturmotiv wie Baum des Lebens, fließendes Wasser oder Himmelskörper',
      reduziert: '→ sehr reduzierte Gestaltung, nur Form und Raum, minimalistisch und meditativ',
      portrait: '→ ein Porträt der Person, spirituell interpretiert, mit Aura oder Lichtelementen',
    },
    textStyle: {
      'sakral-poetisch': 'Sakral-Poetisch',
      'neutral-meditativ': 'Neutral-Meditativ',
      nuechtern: 'Nüchtern',
    },
    textStyleTooltip: {
      'sakral-poetisch': '→ sakral-poetisch, ehrfürchtig, feierlich',
      'neutral-meditativ': '→ neutral-meditativ, ruhig, gelassen',
      nuechtern: '→ nüchtern, klar, sachlich',
    },
    textClarity: {
      raetselhaft: 'Rätselhaft',
      klar: 'Klar',
    },
    textClarityTooltip: {
      raetselhaft: '→ leicht rätselhaft, offen für Interpretation',
      klar: '→ klar verständlich, eindeutig',
    },
    backSideStyle: {
      erklaerung: 'Erklärung',
      einladung: 'Einladung',
      mantra: 'Mantra',
    },
    backSideStyleTooltip: {
      erklaerung: '→ erklärend, beschreibend, was dieser Schein bedeutet',
      einladung: '→ einladend, ein Versprechen, eine Zusage an den Empfänger',
      mantra: '→ wie ein Mantra, meditativ, ein Satz zum Verweilen',
    },
    feelings: {
      vertrauen: 'Vertrauen',
      dankbarkeit: 'Dankbarkeit',
      ruhe: 'Ruhe',
      wertschaetzung: 'Wertschätzung',
      verbundenheit: 'Verbundenheit',
      verantwortung: 'Verantwortung',
    },
    feelingsTooltip: {
      vertrauen: '→ Vertrauen',
      dankbarkeit: '→ Dankbarkeit',
      ruhe: '→ Ruhe',
      wertschaetzung: '→ Wertschätzung',
      verbundenheit: '→ Verbundenheit',
      verantwortung: '→ Verantwortung',
    },
    promptLanguage: {
      de: 'Deutsch',
      en: 'English',
    },
    colorScheme: {
      'gold-gruen': 'Gold & Grün',
      'blau-silber': 'Blau & Silber',
      erdtoene: 'Erdtöne',
      'violett-weiss': 'Violett & Weiß',
      'schwarz-gold': 'Schwarz & Gold',
      pastell: 'Pastell',
    },
    colorSchemeTooltip: {
      'gold-gruen': '→ Gold und gedämpftes Grün: Warmes Gold, Olivgrün, Moos, Champagner',
      'blau-silber': '→ Tiefblau und Silber: Nachtblau, Silber, Eisblau, Mondweiß',
      erdtoene: '→ Warme Erdtöne: Ocker, Terrakotta, Sandstein, warmes Braun, Kupfer',
      'violett-weiss': '→ Violett und Weiß: Zartes Lavendel, Purpur, Perlmutt, Cremeweiß',
      'schwarz-gold': '→ Schwarz und Gold: Tiefes Schwarz, glänzendes Gold, Anthrazit',
      pastell: '→ Sanfte Pastelltöne: Zartes Rosa, Hellblau, Mintgrün, Pfirsich, Lavendel',
    },
    placeholders: {
      name: 'Name der Person',
      value: 'Wert eingeben...',
      customValue: 'Eigener symbolischer Text...',
      email: 'E-Mail-Adresse',
      phone: 'Telefonnummer',
      website: 'Webseite',
      social: 'Social Media (@handle)',
      qrCodeUrl: 'URL für QR-Code (z.B. https://example.com)',
    },
    qrCode: {
      enabled: 'QR-Code aktivieren',
      description: 'Ein QR-Code wird dezent auf der Rückseite des Scheins integriert',
      invalidUrl: 'Bitte gib eine gültige URL ein',
    },
    reset: 'Zurücksetzen',
  },
  en: {
    sections: {
      grundhaltung: 'Attitude & Effect',
      quellen: 'Spiritual Sources',
      wert: 'Value Display',
      motiv: 'Central Motif',
      text: 'Language & Text Feel',
      rueckseite: 'Back Side',
      gefuehl: 'Feeling When Held',
      personalisierung: 'Personalization',
      kontakt: 'Contact Details',
      qrCode: 'QR Code',
      sprache: 'Prompt Language',
      farben: 'Color Scheme',
    },
    sectionInfo: {
      grundhaltung: 'Determines the emotional mood of the design',
      quellen: 'Which spiritual traditions should inspire the design?',
      wert: 'How should the voucher value be displayed?',
      motiv: 'The central visual element of the voucher',
      text: 'How should the language on the voucher feel?',
      rueckseite: 'The style of the text on the back',
      gefuehl: 'What feelings should the voucher convey?',
      farben: 'The color palette for the design',
    },
    mood: {
      kontemplativ: 'Quiet & Contemplative',
      kraftvoll: 'Powerful & Energetic',
    },
    moodTooltip: {
      kontemplativ: '→ quiet, contemplative, inward-focused',
      kraftvoll: '→ powerful, energetic, radiating',
    },
    energy: {
      erdend: 'Grounding',
      transzendent: 'Transcendent',
    },
    energyTooltip: {
      erdend: '→ grounding, rooted, connected to nature',
      transzendent: '→ transcendent, cosmic, ascending, light-filled',
    },
    style: {
      archaisch: 'Archaic / Sacred',
      modern: 'Modern / Reduced',
    },
    styleTooltip: {
      archaisch: '→ timeless-ancient, archaic, sacred, with historical depth',
      modern: '→ contemporary-spiritual, modern, reduced, clear',
    },
    sources: {
      natur: 'Nature',
      bewusstsein: 'Consciousness',
      alchemie: 'Alchemy',
      kosmisch: 'Cosmic',
      mystik: 'Mysticism',
      verbundenheit: 'Connection',
    },
    sourcesTooltip: {
      natur: '→ nature spirituality, earth cycles, elements, organic forms',
      bewusstsein: '→ mindfulness, presence, consciousness work, meditative quality',
      alchemie: '→ alchemy, transformation, metamorphosis',
      kosmisch: '→ cosmic order, stars, sacred geometry, universal patterns',
      mystik: '→ mysticism, the ineffable, mystery, without religious affiliation',
      verbundenheit: '→ human connection, heart quality, relationship, compassion',
    },
    valueDisplay: {
      explizit: 'Explicit',
      symbolisch: 'Symbolic',
      beides: 'Both',
    },
    valueDisplayTooltip: {
      explizit: '→ The value is clearly and dominantly displayed on the front',
      symbolisch: '→ The value is only symbolically hinted at, not explicitly written',
      beides: '→ Symbolic representation on front, explicit explanation on back',
    },
    valuePosition: {
      ecken: 'In Corners',
      zentral: 'Central',
      beides: 'Both',
    },
    valuePositionTooltip: {
      ecken: '→ The value is placed in the corners, like classic banknotes',
      zentral: '→ The value is centrally and prominently integrated in the design',
      beides: '→ The value appears both in the corners and centrally',
    },
    centralMotif: {
      silhouette: 'Silhouette / Aura',
      licht: 'Light / Mandala',
      symbol: 'Symbol / Spiral',
      natur: 'Nature Motif',
      reduziert: 'Minimalist',
      portrait: 'Portrait',
    },
    centralMotifTooltip: {
      silhouette: '→ a stylized human silhouette or aura as central element, abstract and luminous',
      licht: '→ a radiant light, circle or mandala as central design element',
      symbol: '→ an abstract symbol like spiral, seed, life knot or sacred geometry at center',
      natur: '→ an abstracted nature motif like tree of life, flowing water or celestial body',
      reduziert: '→ very reduced design, only form and space, minimalist and meditative',
      portrait: '→ a portrait of the person, spiritually interpreted, with aura or light elements',
    },
    textStyle: {
      'sakral-poetisch': 'Sacred-Poetic',
      'neutral-meditativ': 'Neutral-Meditative',
      nuechtern: 'Sober',
    },
    textStyleTooltip: {
      'sakral-poetisch': '→ sacred-poetic, reverent, ceremonial',
      'neutral-meditativ': '→ neutral-meditative, calm, serene',
      nuechtern: '→ sober, clear, matter-of-fact',
    },
    textClarity: {
      raetselhaft: 'Enigmatic',
      klar: 'Clear',
    },
    textClarityTooltip: {
      raetselhaft: '→ slightly enigmatic, open to interpretation',
      klar: '→ clearly understandable, unambiguous',
    },
    backSideStyle: {
      erklaerung: 'Explanation',
      einladung: 'Invitation',
      mantra: 'Mantra',
    },
    backSideStyleTooltip: {
      erklaerung: '→ explanatory, descriptive, what this voucher means',
      einladung: '→ inviting, a promise, a pledge to the recipient',
      mantra: '→ like a mantra, meditative, a phrase to linger on',
    },
    feelings: {
      vertrauen: 'Trust',
      dankbarkeit: 'Gratitude',
      ruhe: 'Peace',
      wertschaetzung: 'Appreciation',
      verbundenheit: 'Connection',
      verantwortung: 'Responsibility',
    },
    feelingsTooltip: {
      vertrauen: '→ trust',
      dankbarkeit: '→ gratitude',
      ruhe: '→ peace',
      wertschaetzung: '→ appreciation',
      verbundenheit: '→ connection',
      verantwortung: '→ responsibility',
    },
    promptLanguage: {
      de: 'Deutsch',
      en: 'English',
    },
    colorScheme: {
      'gold-gruen': 'Gold & Green',
      'blau-silber': 'Blue & Silver',
      erdtoene: 'Earth Tones',
      'violett-weiss': 'Violet & White',
      'schwarz-gold': 'Black & Gold',
      pastell: 'Pastel',
    },
    colorSchemeTooltip: {
      'gold-gruen': '→ Gold and muted green: warm gold, olive green, moss, champagne',
      'blau-silber': '→ Deep blue and silver: night blue, silver, ice blue, moon white',
      erdtoene: '→ Warm earth tones: ochre, terracotta, sandstone, warm brown, copper',
      'violett-weiss': '→ Violet and white: soft lavender, purple, mother-of-pearl, cream white',
      'schwarz-gold': '→ Black and gold: deep black, shining gold, anthracite',
      pastell: '→ Soft pastel tones: delicate pink, light blue, mint green, peach, lavender',
    },
    placeholders: {
      name: 'Person name',
      value: 'Enter value...',
      customValue: 'Custom symbolic text...',
      email: 'Email address',
      phone: 'Phone number',
      website: 'Website',
      social: 'Social media (@handle)',
      qrCodeUrl: 'URL for QR code (e.g. https://example.com)',
    },
    qrCode: {
      enabled: 'Enable QR code',
      description: 'A QR code will be subtly integrated on the back of the voucher',
      invalidUrl: 'Please enter a valid URL',
    },
    reset: 'Reset',
  },
};

// Color swatches for color schemes
const colorSwatches: Record<string, string[]> = {
  'gold-gruen': ['#D4AF37', '#8B9A46', '#6B8E23', '#F7E7CE'],
  'blau-silber': ['#191970', '#C0C0C0', '#B0E0E6', '#F5F5F5'],
  erdtoene: ['#CC7722', '#CD853F', '#D2B48C', '#8B4513', '#B87333'],
  'violett-weiss': ['#E6E6FA', '#800080', '#F5F5F5', '#FFFDD0'],
  'schwarz-gold': ['#1C1C1C', '#FFD700', '#2F4F4F'],
  pastell: ['#FFB6C1', '#ADD8E6', '#98FB98', '#FFDAB9', '#E6E6FA'],
};

// Color scheme card with swatches
interface ColorSchemeCardProps {
  title: string;
  info?: string;
  options: { value: string; label: string }[];
  tooltips?: Record<string, string>;
  currentValue: ColorScheme;
  onChange: (value: ColorScheme) => void;
}

function ColorSchemeCard({ title, info, options, tooltips, currentValue, onChange }: ColorSchemeCardProps) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-sm">{title}</h3>
        {info && <p className="text-xs text-base-content/60 -mt-1">{info}</p>}
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => (
            <div key={opt.value} className="tooltip" data-tip={tooltips?.[opt.value]}>
              <button
                className={`btn btn-sm gap-2 ${currentValue === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => onChange(opt.value as ColorScheme)}
              >
                <div className="flex gap-0.5">
                  {colorSwatches[opt.value]?.slice(0, 4).map((color, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                {opt.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Reusable card component for single-select options
interface SingleSelectCardProps<T extends string> {
  title: string;
  info?: string;
  options: { value: T; label: string }[];
  tooltips?: Record<string, string>;
  currentValue: T;
  onChange: (value: T) => void;
  children?: React.ReactNode;
}

function SingleSelectCard<T extends string>({
  title,
  info,
  options,
  tooltips,
  currentValue,
  onChange,
  children,
}: SingleSelectCardProps<T>) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h3 className="card-title text-sm">{title}</h3>
        {info && <p className="text-xs text-base-content/60 -mt-1">{info}</p>}
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const tooltip = tooltips?.[opt.value];
            const button = (
              <button
                key={opt.value}
                className={`btn btn-sm ${currentValue === opt.value ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </button>
            );
            return tooltip ? (
              <div key={opt.value} className="tooltip" data-tip={tooltip}>
                {button}
              </div>
            ) : (
              button
            );
          })}
        </div>
        {children}
      </div>
    </div>
  );
}

// Reusable card component for multi-select options
interface MultiSelectCardProps<T extends string> {
  title: string;
  info?: string;
  options: { value: T; label: string }[];
  tooltips?: Record<string, string>;
  selected: T[];
  onToggle: (value: T) => void;
}

function MultiSelectCard<T extends string>({
  title,
  info,
  options,
  tooltips,
  selected,
  onToggle,
}: MultiSelectCardProps<T>) {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <h3 className="card-title text-sm">{title}</h3>
          <span className="badge badge-sm badge-outline opacity-60">
            {selected.length}/{options.length}
          </span>
        </div>
        {info && <p className="text-xs text-base-content/60 -mt-1">{info}</p>}
        <div className="flex flex-wrap gap-2">
          {options.map((opt) => {
            const tooltip = tooltips?.[opt.value];
            const button = (
              <button
                key={opt.value}
                className={`btn btn-sm ${selected.includes(opt.value) ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => onToggle(opt.value)}
              >
                {opt.label}
              </button>
            );
            return tooltip ? (
              <div key={opt.value} className="tooltip" data-tip={tooltip}>
                {button}
              </div>
            ) : (
              button
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function SpiritualPromptGenerator() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];

  // Store selectors
  const mood = useSpiritualPromptStore((state) => state.mood);
  const energy = useSpiritualPromptStore((state) => state.energy);
  const style = useSpiritualPromptStore((state) => state.style);
  const sources = useSpiritualPromptStore((state) => state.sources);
  const valueDisplay = useSpiritualPromptStore((state) => state.valueDisplay);
  const valuePosition = useSpiritualPromptStore((state) => state.valuePosition);
  const customValueText = useSpiritualPromptStore((state) => state.customValueText);
  const centralMotif = useSpiritualPromptStore((state) => state.centralMotif);
  const textStyle = useSpiritualPromptStore((state) => state.textStyle);
  const textClarity = useSpiritualPromptStore((state) => state.textClarity);
  const backSideStyle = useSpiritualPromptStore((state) => state.backSideStyle);
  const feelings = useSpiritualPromptStore((state) => state.feelings);
  const personName = useSpiritualPromptStore((state) => state.personName);
  const voucherValue = useSpiritualPromptStore((state) => state.voucherValue);
  const promptLanguage = useSpiritualPromptStore((state) => state.promptLanguage);
  const colorScheme = useSpiritualPromptStore((state) => state.colorScheme);
  const contactEmail = useSpiritualPromptStore((state) => state.contactEmail);
  const contactPhone = useSpiritualPromptStore((state) => state.contactPhone);
  const contactWebsite = useSpiritualPromptStore((state) => state.contactWebsite);
  const contactSocial = useSpiritualPromptStore((state) => state.contactSocial);
  const qrCodeEnabled = useSpiritualPromptStore((state) => state.qrCodeEnabled);
  const qrCodeUrl = useSpiritualPromptStore((state) => state.qrCodeUrl);

  // Store actions
  const setMood = useSpiritualPromptStore((state) => state.setMood);
  const setEnergy = useSpiritualPromptStore((state) => state.setEnergy);
  const setStyle = useSpiritualPromptStore((state) => state.setStyle);
  const toggleSource = useSpiritualPromptStore((state) => state.toggleSource);
  const setValueDisplay = useSpiritualPromptStore((state) => state.setValueDisplay);
  const setValuePosition = useSpiritualPromptStore((state) => state.setValuePosition);
  const setCustomValueText = useSpiritualPromptStore((state) => state.setCustomValueText);
  const setCentralMotif = useSpiritualPromptStore((state) => state.setCentralMotif);
  const setTextStyle = useSpiritualPromptStore((state) => state.setTextStyle);
  const setTextClarity = useSpiritualPromptStore((state) => state.setTextClarity);
  const setBackSideStyle = useSpiritualPromptStore((state) => state.setBackSideStyle);
  const toggleFeeling = useSpiritualPromptStore((state) => state.toggleFeeling);
  const setPersonName = useSpiritualPromptStore((state) => state.setPersonName);
  const setVoucherValue = useSpiritualPromptStore((state) => state.setVoucherValue);
  const setPromptLanguage = useSpiritualPromptStore((state) => state.setPromptLanguage);
  const setColorScheme = useSpiritualPromptStore((state) => state.setColorScheme);
  const setContactEmail = useSpiritualPromptStore((state) => state.setContactEmail);
  const setContactPhone = useSpiritualPromptStore((state) => state.setContactPhone);
  const setContactWebsite = useSpiritualPromptStore((state) => state.setContactWebsite);
  const setContactSocial = useSpiritualPromptStore((state) => state.setContactSocial);
  const setQrCodeEnabled = useSpiritualPromptStore((state) => state.setQrCodeEnabled);
  const setQrCodeUrl = useSpiritualPromptStore((state) => state.setQrCodeUrl);
  const reset = useSpiritualPromptStore((state) => state.reset);

  // Helper to convert label objects to option arrays
  const toOptions = <T extends string>(labelObj: Record<T, string>) =>
    (Object.entries(labelObj) as [T, string][]).map(([value, label]) => ({ value, label }));

  // Helper to validate QR code URL
  const isValidQrUrl = (url: string): boolean => {
    if (!url.trim()) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Prompt Language */}
      <SingleSelectCard<PromptLanguage>
        title={t.sections.sprache}
        options={toOptions(t.promptLanguage)}
        currentValue={promptLanguage}
        onChange={setPromptLanguage}
      />

      {/* Color Scheme */}
      <ColorSchemeCard
        title={t.sections.farben}
        info={t.sectionInfo.farben}
        options={toOptions(t.colorScheme)}
        tooltips={t.colorSchemeTooltip}
        currentValue={colorScheme}
        onChange={setColorScheme}
      />

      {/* 1. Grundhaltung & Wirkung - Mood */}
      <SingleSelectCard<Mood>
        title={t.sections.grundhaltung}
        info={t.sectionInfo.grundhaltung}
        options={toOptions(t.mood)}
        tooltips={t.moodTooltip}
        currentValue={mood}
        onChange={setMood}
      />

      {/* 1. Grundhaltung & Wirkung - Energy */}
      <SingleSelectCard<Energy>
        title={t.sections.grundhaltung}
        options={toOptions(t.energy)}
        tooltips={t.energyTooltip}
        currentValue={energy}
        onChange={setEnergy}
      />

      {/* 1. Grundhaltung & Wirkung - Style */}
      <SingleSelectCard<Style>
        title={t.sections.grundhaltung}
        options={toOptions(t.style)}
        tooltips={t.styleTooltip}
        currentValue={style}
        onChange={setStyle}
      />

      {/* 2. Spirituelle Quellen */}
      <MultiSelectCard<SpiritualSource>
        title={t.sections.quellen}
        info={t.sectionInfo.quellen}
        options={toOptions(t.sources)}
        tooltips={t.sourcesTooltip}
        selected={sources}
        onToggle={toggleSource}
      />

      {/* 3. Wertdarstellung */}
      <SingleSelectCard<ValueDisplay>
        title={t.sections.wert}
        info={t.sectionInfo.wert}
        options={toOptions(t.valueDisplay)}
        tooltips={t.valueDisplayTooltip}
        currentValue={valueDisplay}
        onChange={setValueDisplay}
      >
        {valueDisplay === 'symbolisch' && (
          <input
            type="text"
            className="input input-bordered w-full mt-3"
            placeholder={t.placeholders.customValue}
            value={customValueText}
            onChange={(e) => setCustomValueText(e.target.value)}
          />
        )}
      </SingleSelectCard>

      {/* 3b. Wertpositionierung */}
      <SingleSelectCard<ValuePosition>
        title={t.sections.wert}
        options={toOptions(t.valuePosition)}
        tooltips={t.valuePositionTooltip}
        currentValue={valuePosition}
        onChange={setValuePosition}
      />

      {/* 4. Zentrales Motiv */}
      <SingleSelectCard<CentralMotif>
        title={t.sections.motiv}
        info={t.sectionInfo.motiv}
        options={toOptions(t.centralMotif)}
        tooltips={t.centralMotifTooltip}
        currentValue={centralMotif}
        onChange={setCentralMotif}
      />

      {/* 5. Sprache & Textgefühl - Text Style */}
      <SingleSelectCard<TextStyle>
        title={t.sections.text}
        info={t.sectionInfo.text}
        options={toOptions(t.textStyle)}
        tooltips={t.textStyleTooltip}
        currentValue={textStyle}
        onChange={setTextStyle}
      />

      {/* 5. Sprache & Textgefühl - Text Clarity */}
      <SingleSelectCard<TextClarity>
        title={t.sections.text}
        options={toOptions(t.textClarity)}
        tooltips={t.textClarityTooltip}
        currentValue={textClarity}
        onChange={setTextClarity}
      />

      {/* 6. Rückseite */}
      <SingleSelectCard<BackSideStyle>
        title={t.sections.rueckseite}
        info={t.sectionInfo.rueckseite}
        options={toOptions(t.backSideStyle)}
        tooltips={t.backSideStyleTooltip}
        currentValue={backSideStyle}
        onChange={setBackSideStyle}
      />

      {/* 7. Gefühl beim Anfassen */}
      <MultiSelectCard<Feeling>
        title={t.sections.gefuehl}
        info={t.sectionInfo.gefuehl}
        options={toOptions(t.feelings)}
        tooltips={t.feelingsTooltip}
        selected={feelings}
        onToggle={toggleFeeling}
      />

      {/* 8. Personalisierung */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-sm">{t.sections.personalisierung}</h3>

          <div className="space-y-3">
            {/* Person Name */}
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={t.placeholders.name}
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
            />

            {/* Voucher Value */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {VOUCHER_VALUE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    className={`btn btn-sm ${voucherValue === preset ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setVoucherValue(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder={t.placeholders.value}
                value={voucherValue}
                onChange={(e) => setVoucherValue(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 9. Kontaktdaten */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-sm">{t.sections.kontakt}</h3>

          <div className="space-y-3">
            <input
              type="email"
              className="input input-bordered w-full"
              placeholder={t.placeholders.email}
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
            <input
              type="tel"
              className="input input-bordered w-full"
              placeholder={t.placeholders.phone}
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
            <input
              type="url"
              className="input input-bordered w-full"
              placeholder={t.placeholders.website}
              value={contactWebsite}
              onChange={(e) => setContactWebsite(e.target.value)}
            />
            <input
              type="text"
              className="input input-bordered w-full"
              placeholder={t.placeholders.social}
              value={contactSocial}
              onChange={(e) => setContactSocial(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 10. QR-Code */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h3 className="card-title text-sm">{t.sections.qrCode}</h3>
          <p className="text-xs text-base-content/60 -mt-1">{t.qrCode.description}</p>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={qrCodeEnabled === 'yes'}
                onChange={(e) => setQrCodeEnabled(e.target.checked ? 'yes' : 'no')}
              />
              <span className="label-text">{t.qrCode.enabled}</span>
            </label>
          </div>

          {qrCodeEnabled === 'yes' && (
            <div className="space-y-2">
              <input
                type="url"
                className={`input input-bordered w-full ${qrCodeUrl && !isValidQrUrl(qrCodeUrl) ? 'input-error' : ''}`}
                placeholder={t.placeholders.qrCodeUrl}
                value={qrCodeUrl}
                onChange={(e) => setQrCodeUrl(e.target.value)}
              />
              {qrCodeUrl && !isValidQrUrl(qrCodeUrl) && (
                <p className="text-xs text-error">{t.qrCode.invalidUrl}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <button className="btn btn-ghost text-error" onClick={reset}>
          {t.reset}
        </button>
      </div>
    </div>
  );
}
