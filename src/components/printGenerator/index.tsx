/**
 * Print Generator Main Component
 *
 * Unified generator for spiritual and business vouchers.
 * Uses same UI patterns as original SpiritualPromptGenerator.
 */

import { Fragment, useCallback, useMemo, useRef, useState } from 'react';
import { usePrintGeneratorStore, useHasHydrated } from '../../stores/printGeneratorStore';
import { useBillStore } from '../../stores/billStore';
import { generateDefaultBackSideText } from '../../services/printPromptGenerator';
import { extractColorsFromImage } from '../../services/colorExtractor';
import {
  type StyleContext,
  type SpiritualColorScheme,
  type BusinessColorScheme,
  type SpiritualMotif,
  type BusinessMotif,
  type Mood,
  type Energy,
  type VisualStyle,
  type SpiritualSource,
  type Feeling,
  type BusinessDesignStyle,
  type BusinessValue,
  type ValuePosition,
  type PromptLanguage,
  SPIRITUAL_COLOR_SWATCHES,
  BUSINESS_COLOR_SWATCHES,
  VOUCHER_VALUE_PRESETS,
} from '../../types/printGenerator';

// ============================================
// LABELS
// ============================================

const labels = {
  de: {
    sections: {
      style: 'Stil wählen',
      farben: 'Farbschema',
      motiv: 'Zentrales Motiv',
      grundhaltung: 'Grundhaltung & Wirkung',
      quellen: 'Spirituelle Quellen',
      gefuehl: 'Gefühl beim Anfassen',
      business: 'Business-Einstellungen',
      wert: 'Gutschein-Konfiguration',
      rueckseite: 'Rückseite',
      kontakt: 'Kontaktdaten',
      qrCode: 'QR-Code',
      sprache: 'Prompt-Sprache',
    },
    sectionInfo: {
      style: 'Spirituell für meditative Designs, Business für professionelle Auftritte',
      farben: 'Die Farbpalette für das Design',
      motiv: 'Das zentrale visuelle Element des Scheins',
      grundhaltung: 'Bestimmt die emotionale Grundstimmung des Designs',
      quellen: 'Welche spirituellen Traditionen sollen das Design inspirieren?',
      wert: 'Wie soll der Wert des Gutscheins dargestellt werden?',
      rueckseite: 'Der Stil des Textes auf der Rückseite',
      gefuehl: 'Welche Gefühle soll der Schein vermitteln?',
      business: 'Branche und Tonalität für professionelle Auftritte',
    },
    styleContext: {
      spiritual: '✨ Spirituell',
      business: '💼 Business',
    },
    styleContextTooltip: {
      spiritual: '→ Meditativ, mystisch, organisch - für spirituelle Gutscheine',
      business: '→ Professionell, seriös, vertrauenswürdig - für geschäftliche Kontexte',
    },
    spiritualColorScheme: {
      'gold-gruen': 'Gold & Grün',
      'blau-silber': 'Blau & Silber',
      'erdtoene': 'Erdtöne',
      'violett-weiss': 'Violett & Weiß',
      'schwarz-gold': 'Schwarz & Gold',
      'pastell': 'Pastell',
    },
    spiritualColorSchemeTooltip: {
      'gold-gruen': '→ Gold und gedämpftes Grün: Warmes Gold, Olivgrün, Moos, Champagner',
      'blau-silber': '→ Tiefblau und Silber: Nachtblau, Silber, Eisblau, Mondweiß',
      'erdtoene': '→ Warme Erdtöne: Ocker, Terrakotta, Sandstein, warmes Braun, Kupfer',
      'violett-weiss': '→ Violett und Weiß: Zartes Lavendel, Purpur, Perlmutt, Cremeweiß',
      'schwarz-gold': '→ Schwarz und Gold: Tiefes Schwarz, glänzendes Gold, Anthrazit',
      'pastell': '→ Sanfte Pastelltöne: Zartes Rosa, Hellblau, Mintgrün, Pfirsich, Lavendel',
    },
    businessColorScheme: {
      'from-logo': 'Aus Logo',
      'navy-gold': 'Navy & Gold',
      'grau-blau': 'Grau & Blau',
      'weiss-schwarz': 'Weiß & Schwarz',
      'gruen-weiss': 'Grün & Weiß',
      'bordeaux-gold': 'Bordeaux & Gold',
      'petrol-silber': 'Petrol & Silber',
    },
    businessColorSchemeTooltip: {
      'from-logo': '→ Farben automatisch aus dem hochgeladenen Logo extrahieren',
      'navy-gold': '→ Klassisch, vertrauenswürdig: Tiefes Navy, warmes Gold',
      'grau-blau': '→ Modern, professionell: Elegantes Grau mit Akzentblau',
      'weiss-schwarz': '→ Minimalistisch, elegant: Klares Weiß, tiefes Schwarz',
      'gruen-weiss': '→ Frisch, nachhaltig: Naturgrün mit reinem Weiß',
      'bordeaux-gold': '→ Luxuriös, exklusiv: Edles Bordeaux mit Gold',
      'petrol-silber': '→ Innovativ, tech: Modernes Petrol mit Silber',
    },
    spiritualMotif: {
      silhouette: 'Silhouette / Aura',
      licht: 'Licht / Mandala',
      symbol: 'Symbol / Spirale',
      natur: 'Naturmotiv',
      reduziert: 'Minimalistisch',
      portrait: 'Portrait',
    },
    spiritualMotifTooltip: {
      silhouette: '→ eine stilisierte menschliche Silhouette oder Aura als zentrales Element',
      licht: '→ ein strahlendes Licht, Kreis oder Mandala als zentrales Gestaltungselement',
      symbol: '→ ein abstraktes Symbol wie Spirale, Samen, Lebensknoten oder heilige Geometrie',
      natur: '→ ein abstrahiertes Naturmotiv wie Baum des Lebens, fließendes Wasser',
      reduziert: '→ sehr reduzierte Gestaltung, nur Form und Raum, minimalistisch',
      portrait: '→ ein Porträt der Person, spirituell interpretiert, mit Aura oder Lichtelementen',
    },
    businessMotif: {
      'logo-zentral': 'Logo zentral',
      portrait: 'Portrait',
    },
    businessMotifTooltip: {
      'logo-zentral': '→ Das Firmenlogo prominent im Zentrum des Designs',
      portrait: '→ Ein professionelles Portrait, seriös und vertrauenswürdig gestaltet',
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
    visualStyle: {
      archaisch: 'Archaisch / Sakral',
      modern: 'Modern / Reduziert',
    },
    visualStyleTooltip: {
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
    businessDesignStyle: {
      klassisch: 'Klassisch',
      modern: 'Modern',
      premium: 'Premium',
      kreativ: 'Kreativ',
    },
    businessDesignStyleTooltip: {
      klassisch: '→ Zeitlos, seriös: Dezente Linien, klassische Typografie, zurückhaltende Eleganz',
      modern: '→ Frisch, dynamisch: Klare Geometrie, asymmetrische Balance, moderne Sans-Serif',
      premium: '→ Edel, hochwertig: Subtile Goldakzente, feine Linien, elegante Typografie',
      kreativ: '→ Einzigartig, mutig: Unkonventionelle Layouts, expressive Formen, überraschend',
    },
    businessValues: {
      professionalitaet: 'Professionalität',
      vertrauen: 'Vertrauen',
      qualitaet: 'Qualität',
      wertschaetzung: 'Wertschätzung',
      innovation: 'Innovation',
      zuverlaessigkeit: 'Zuverlässigkeit',
    },
    businessValuesTooltip: {
      professionalitaet: '→ Kompetenz und Expertise',
      vertrauen: '→ Verlässlichkeit und Glaubwürdigkeit',
      qualitaet: '→ Hochwertige Arbeit und Standards',
      wertschaetzung: '→ Anerkennung und Respekt',
      innovation: '→ Fortschritt und neue Ideen',
      zuverlaessigkeit: '→ Beständigkeit und Verlässlichkeit',
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
    promptLanguage: {
      de: 'Deutsch',
      en: 'English',
    },
    placeholders: {
      name: 'Name / Firma',
      value: 'Wert eingeben...',
      customValue: 'Eigener symbolischer Text...',
      email: 'E-Mail-Adresse',
      phone: 'Telefonnummer',
      website: 'Webseite',
      qrCodeUrl: 'URL für QR-Code (z.B. https://example.com)',
    },
    qrCode: {
      enabled: 'QR-Code aktivieren',
      description: 'Ein QR-Code wird dezent auf der Rückseite des Scheins integriert',
      invalidUrl: 'Bitte gib eine gültige URL ein',
    },
    logo: {
      title: 'Firmenlogo',
      upload: 'Logo hochladen',
      dragDrop: 'oder hierher ziehen',
      remove: 'Entfernen',
      hint: 'PNG oder JPG, transparent empfohlen',
    },
    portrait: {
      title: 'Portrait',
      upload: 'Portrait hochladen',
      dragDrop: 'oder hierher ziehen',
      remove: 'Entfernen',
      hint: 'Ein Foto der Person für das zentrale Motiv',
    },
    reset: 'Zurücksetzen',
  },
  en: {
    sections: {
      style: 'Choose Style',
      farben: 'Color Scheme',
      motiv: 'Central Motif',
      grundhaltung: 'Attitude & Effect',
      quellen: 'Spiritual Sources',
      gefuehl: 'Feeling When Held',
      business: 'Business Settings',
      wert: 'Voucher Configuration',
      rueckseite: 'Back Side',
      kontakt: 'Contact Details',
      qrCode: 'QR Code',
      sprache: 'Prompt Language',
    },
    sectionInfo: {
      style: 'Spiritual for meditative designs, Business for professional appearances',
      farben: 'The color palette for the design',
      motiv: 'The central visual element of the voucher',
      grundhaltung: 'Determines the emotional mood of the design',
      quellen: 'Which spiritual traditions should inspire the design?',
      wert: 'How should the voucher value be displayed?',
      rueckseite: 'The style of the text on the back',
      gefuehl: 'What feelings should the voucher convey?',
      business: 'Industry and tone for professional appearances',
    },
    styleContext: {
      spiritual: '✨ Spiritual',
      business: '💼 Business',
    },
    styleContextTooltip: {
      spiritual: '→ Meditative, mystical, organic - for spiritual vouchers',
      business: '→ Professional, serious, trustworthy - for business contexts',
    },
    spiritualColorScheme: {
      'gold-gruen': 'Gold & Green',
      'blau-silber': 'Blue & Silver',
      'erdtoene': 'Earth Tones',
      'violett-weiss': 'Violet & White',
      'schwarz-gold': 'Black & Gold',
      'pastell': 'Pastel',
    },
    spiritualColorSchemeTooltip: {
      'gold-gruen': '→ Gold and muted green: warm gold, olive green, moss, champagne',
      'blau-silber': '→ Deep blue and silver: night blue, silver, ice blue, moon white',
      'erdtoene': '→ Warm earth tones: ochre, terracotta, sandstone, warm brown, copper',
      'violett-weiss': '→ Violet and white: soft lavender, purple, mother-of-pearl, cream white',
      'schwarz-gold': '→ Black and gold: deep black, shining gold, anthracite',
      'pastell': '→ Soft pastel tones: delicate pink, light blue, mint green, peach, lavender',
    },
    businessColorScheme: {
      'from-logo': 'From Logo',
      'navy-gold': 'Navy & Gold',
      'grau-blau': 'Gray & Blue',
      'weiss-schwarz': 'White & Black',
      'gruen-weiss': 'Green & White',
      'bordeaux-gold': 'Bordeaux & Gold',
      'petrol-silber': 'Teal & Silver',
    },
    businessColorSchemeTooltip: {
      'from-logo': '→ Automatically extract colors from the uploaded logo',
      'navy-gold': '→ Classic, trustworthy: Deep navy, warm gold',
      'grau-blau': '→ Modern, professional: Elegant gray with accent blue',
      'weiss-schwarz': '→ Minimalist, elegant: Clear white, deep black',
      'gruen-weiss': '→ Fresh, sustainable: Nature green with pure white',
      'bordeaux-gold': '→ Luxurious, exclusive: Noble bordeaux with gold',
      'petrol-silber': '→ Innovative, tech: Modern teal with silver',
    },
    spiritualMotif: {
      silhouette: 'Silhouette / Aura',
      licht: 'Light / Mandala',
      symbol: 'Symbol / Spiral',
      natur: 'Nature Motif',
      reduziert: 'Minimalist',
      portrait: 'Portrait',
    },
    spiritualMotifTooltip: {
      silhouette: '→ a stylized human silhouette or aura as central element',
      licht: '→ a radiant light, circle or mandala as central design element',
      symbol: '→ an abstract symbol like spiral, seed, life knot or sacred geometry',
      natur: '→ an abstracted nature motif like tree of life, flowing water',
      reduziert: '→ very reduced design, only form and space, minimalist',
      portrait: '→ a portrait of the person, spiritually interpreted, with aura or light elements',
    },
    businessMotif: {
      'logo-zentral': 'Logo central',
      portrait: 'Portrait',
    },
    businessMotifTooltip: {
      'logo-zentral': '→ Company logo prominently in the center of the design',
      portrait: '→ A professional portrait, designed seriously and trustworthy',
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
    visualStyle: {
      archaisch: 'Archaic / Sacred',
      modern: 'Modern / Reduced',
    },
    visualStyleTooltip: {
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
    businessDesignStyle: {
      klassisch: 'Classic',
      modern: 'Modern',
      premium: 'Premium',
      kreativ: 'Creative',
    },
    businessDesignStyleTooltip: {
      klassisch: '→ Timeless, serious: Subtle lines, classic typography, understated elegance',
      modern: '→ Fresh, dynamic: Clear geometry, asymmetric balance, modern sans-serif',
      premium: '→ Refined, high-quality: Subtle gold accents, fine lines, elegant typography',
      kreativ: '→ Unique, bold: Unconventional layouts, expressive shapes, surprising',
    },
    businessValues: {
      professionalitaet: 'Professionalism',
      vertrauen: 'Trust',
      qualitaet: 'Quality',
      wertschaetzung: 'Appreciation',
      innovation: 'Innovation',
      zuverlaessigkeit: 'Reliability',
    },
    businessValuesTooltip: {
      professionalitaet: '→ Competence and expertise',
      vertrauen: '→ Reliability and credibility',
      qualitaet: '→ High-quality work and standards',
      wertschaetzung: '→ Recognition and respect',
      innovation: '→ Progress and new ideas',
      zuverlaessigkeit: '→ Consistency and dependability',
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
    promptLanguage: {
      de: 'Deutsch',
      en: 'English',
    },
    placeholders: {
      name: 'Name / Company',
      value: 'Enter value...',
      customValue: 'Custom symbolic text...',
      email: 'Email address',
      phone: 'Phone number',
      website: 'Website',
      qrCodeUrl: 'URL for QR code (e.g. https://example.com)',
    },
    qrCode: {
      enabled: 'Enable QR code',
      description: 'A QR code will be subtly integrated on the back of the voucher',
      invalidUrl: 'Please enter a valid URL',
    },
    logo: {
      title: 'Company Logo',
      upload: 'Upload logo',
      dragDrop: 'or drag here',
      remove: 'Remove',
      hint: 'PNG or JPG, transparent recommended',
    },
    portrait: {
      title: 'Portrait',
      upload: 'Upload portrait',
      dragDrop: 'or drag here',
      remove: 'Remove',
      hint: 'A photo of the person for the central motif',
    },
    reset: 'Reset',
  },
};

// ============================================
// REUSABLE BUTTON GROUP COMPONENTS (no Card wrapper)
// ============================================

interface SingleSelectProps<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  tooltips?: Record<string, string>;
  currentValue: T;
  onChange: (value: T) => void;
  showSeparator?: boolean;
}

function SingleSelect<T extends string>({
  label,
  options,
  tooltips,
  currentValue,
  onChange,
  showSeparator = false,
}: SingleSelectProps<T>) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-base-content/70 font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        {options.map((opt, index) => {
          const tooltip = tooltips?.[opt.value];
          const button = (
            <button
              key={opt.value}
              type="button"
              className={`btn btn-sm ${currentValue === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChange(opt.value)}
            >
              {opt.label}
            </button>
          );
          return (
            <Fragment key={opt.value}>
              {showSeparator && index > 0 && (
                <span className="text-xs text-base-content/40">oder</span>
              )}
              {tooltip ? (
                <div className="tooltip" data-tip={tooltip}>
                  {button}
                </div>
              ) : (
                button
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

interface MultiSelectProps<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  tooltips?: Record<string, string>;
  selected: T[];
  onToggle: (value: T) => void;
  showCount?: boolean;
}

function MultiSelect<T extends string>({
  label,
  options,
  tooltips,
  selected,
  onToggle,
  showCount = true,
}: MultiSelectProps<T>) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-base-content/70 font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        {options.map((opt) => {
          const tooltip = tooltips?.[opt.value];
          const button = (
            <button
              key={opt.value}
              type="button"
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
        {showCount && (
          <span className="badge badge-xs badge-outline opacity-60 ml-auto">
            {selected.length}/{options.length}
          </span>
        )}
      </div>
    </div>
  );
}

interface ColorSelectProps<T extends string> {
  label?: string;
  options: { value: T; label: string }[];
  tooltips?: Record<string, string>;
  swatches: Record<T, string[]>;
  currentValue: T;
  onChange: (value: T) => void;
}

function ColorSelect<T extends string>({ label, options, tooltips, swatches, currentValue, onChange }: ColorSelectProps<T>) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-base-content/70 font-medium">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <div key={opt.value} className="tooltip" data-tip={tooltips?.[opt.value]}>
            <button
              type="button"
              className={`btn btn-sm gap-2 ${currentValue === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onChange(opt.value)}
            >
              <div className="flex gap-0.5">
                {swatches[opt.value]?.slice(0, 4).map((color, i) => (
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
  );
}

// ============================================
// LOGO UPLOAD COMPONENT (no Card wrapper)
// ============================================

interface LogoUploadProps {
  label?: string;
  uploadLabel: string;
  dragDropLabel: string;
  removeLabel: string;
  hintLabel: string;
  logoImage: string | null;
  onLogoChange: (image: string | null) => void;
}

function LogoUpload({
  label,
  uploadLabel,
  dragDropLabel,
  removeLabel,
  hintLabel,
  logoImage,
  onLogoChange,
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;

      // SVG files need to be converted to PNG for Gemini API compatibility
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const svgDataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            // Use a high resolution for the PNG (1024px max dimension)
            const maxSize = 1024;
            let width = img.width || 512;
            let height = img.height || 512;

            // SVGs often report 0 dimensions, use default
            if (width === 0 || height === 0) {
              width = 512;
              height = 512;
            }

            // Scale to max size while maintaining aspect ratio
            if (width > height) {
              if (width > maxSize) {
                height = Math.round((height * maxSize) / width);
                width = maxSize;
              }
            } else {
              if (height > maxSize) {
                width = Math.round((width * maxSize) / height);
                height = maxSize;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Keep transparency - don't fill background
              ctx.drawImage(img, 0, 0, width, height);
              const pngDataUrl = canvas.toDataURL('image/png', 1.0);
              onLogoChange(pngDataUrl);
            }
          };
          img.onerror = () => {
            console.error('Failed to load SVG for conversion');
          };
          img.src = svgDataUrl;
        };
        reader.readAsDataURL(file);
      } else {
        // Non-SVG images: read directly
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          onLogoChange(dataUrl);
        };
        reader.readAsDataURL(file);
      }
    },
    [onLogoChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = () => fileInputRef.current?.click();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      {label && <p className="text-xs text-base-content/70 font-medium">{label}</p>}

      {!logoImage ? (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/10'
              : 'border-base-300 hover:border-primary hover:bg-base-200'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="font-medium text-sm">{uploadLabel}</p>
            <p className="text-xs text-base-content/60">{dragDropLabel}</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border border-base-300 flex items-center justify-center bg-base-200 p-2">
            <img
              src={logoImage}
              alt="Logo"
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={handleClick}
            >
              {uploadLabel}
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost text-error"
              onClick={() => onLogoChange(null)}
            >
              {removeLabel}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleInputChange}
            />
          </div>
        </div>
      )}

      <p className="text-xs text-base-content/60">{hintLabel}</p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PrintGenerator() {
  const appLanguage = useBillStore((state) => state.appLanguage);
  const t = labels[appLanguage];
  const hasHydrated = useHasHydrated();

  // Store selectors
  const styleContext = usePrintGeneratorStore((state) => state.styleContext);
  const promptLanguage = usePrintGeneratorStore((state) => state.promptLanguage);
  const colorScheme = usePrintGeneratorStore((state) => state.colorScheme);
  const centralMotif = usePrintGeneratorStore((state) => state.centralMotif);
  const mood = usePrintGeneratorStore((state) => state.mood);
  const energy = usePrintGeneratorStore((state) => state.energy);
  const visualStyle = usePrintGeneratorStore((state) => state.visualStyle);
  const sources = usePrintGeneratorStore((state) => state.sources);
  const feelings = usePrintGeneratorStore((state) => state.feelings);
  const businessDesignStyle = usePrintGeneratorStore((state) => state.businessDesignStyle);
  const businessValues = usePrintGeneratorStore((state) => state.businessValues);
  const logoImage = usePrintGeneratorStore((state) => state.logoImage);
  const portraitImage = usePrintGeneratorStore((state) => state.portraitImage);
  const valueDisplay = usePrintGeneratorStore((state) => state.valueDisplay);
  const valuePosition = usePrintGeneratorStore((state) => state.valuePosition);
  const customValueText = usePrintGeneratorStore((state) => state.customValueText);
  const voucherValue = usePrintGeneratorStore((state) => state.voucherValue);
  const backSideText = usePrintGeneratorStore((state) => state.backSideText);
  const personName = usePrintGeneratorStore((state) => state.personName);
  const contactEmail = usePrintGeneratorStore((state) => state.contactEmail);
  const contactPhone = usePrintGeneratorStore((state) => state.contactPhone);
  const contactWebsite = usePrintGeneratorStore((state) => state.contactWebsite);
  const qrCodeEnabled = usePrintGeneratorStore((state) => state.qrCodeEnabled);
  const qrCodeUrl = usePrintGeneratorStore((state) => state.qrCodeUrl);

  // Store actions
  const setStyleContext = usePrintGeneratorStore((state) => state.setStyleContext);
  const setPromptLanguage = usePrintGeneratorStore((state) => state.setPromptLanguage);
  const setColorScheme = usePrintGeneratorStore((state) => state.setColorScheme);
  const setCentralMotif = usePrintGeneratorStore((state) => state.setCentralMotif);
  const setMood = usePrintGeneratorStore((state) => state.setMood);
  const setEnergy = usePrintGeneratorStore((state) => state.setEnergy);
  const setVisualStyle = usePrintGeneratorStore((state) => state.setVisualStyle);
  const toggleSource = usePrintGeneratorStore((state) => state.toggleSource);
  const toggleFeeling = usePrintGeneratorStore((state) => state.toggleFeeling);
  const setBusinessDesignStyle = usePrintGeneratorStore((state) => state.setBusinessDesignStyle);
  const toggleBusinessValue = usePrintGeneratorStore((state) => state.toggleBusinessValue);
  const setLogoImage = usePrintGeneratorStore((state) => state.setLogoImage);
  const setLogoColors = usePrintGeneratorStore((state) => state.setLogoColors);
  const logoColors = usePrintGeneratorStore((state) => state.logoColors);
  const setPortraitImage = usePrintGeneratorStore((state) => state.setPortraitImage);
  const setValuePosition = usePrintGeneratorStore((state) => state.setValuePosition);
  const setVoucherValue = usePrintGeneratorStore((state) => state.setVoucherValue);
  const setBackSideText = usePrintGeneratorStore((state) => state.setBackSideText);
  const setPersonName = usePrintGeneratorStore((state) => state.setPersonName);
  const setContactEmail = usePrintGeneratorStore((state) => state.setContactEmail);
  const setContactPhone = usePrintGeneratorStore((state) => state.setContactPhone);
  const setContactWebsite = usePrintGeneratorStore((state) => state.setContactWebsite);
  const setQrCodeEnabled = usePrintGeneratorStore((state) => state.setQrCodeEnabled);
  const setQrCodeUrl = usePrintGeneratorStore((state) => state.setQrCodeUrl);
  const reset = usePrintGeneratorStore((state) => state.reset);

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

  // Create dynamic business color swatches with logo colors (white as primary + extracted colors)
  const businessColorSwatches = useMemo(() => ({
    ...BUSINESS_COLOR_SWATCHES,
    'from-logo': logoColors.length > 0 ? ['#FFFFFF', ...logoColors] : ['#FFFFFF', '#888888', '#AAAAAA', '#CCCCCC'],
  }), [logoColors]);

  // Handle logo change with color extraction
  const handleLogoChange = useCallback(async (imageDataUrl: string | null) => {
    setLogoImage(imageDataUrl);

    if (imageDataUrl) {
      try {
        // Extract max 3 colors from logo (white will be added as primary in the palette)
        const extractedColors = await extractColorsFromImage(imageDataUrl, 3, true);
        setLogoColors(extractedColors);
        // Auto-select "from-logo" color scheme when colors are extracted
        if (extractedColors.length > 0 && styleContext === 'business') {
          setColorScheme('from-logo');
        }
      } catch (error) {
        console.error('Failed to extract colors from logo:', error);
        setLogoColors([]);
      }
    } else {
      // Clear logo colors when logo is removed
      setLogoColors([]);
      // Switch back to default color scheme if using from-logo
      if (colorScheme === 'from-logo') {
        setColorScheme('navy-gold');
      }
    }
  }, [setLogoImage, setLogoColors, setColorScheme, styleContext, colorScheme]);

  // Generate default back side text based on current config
  const defaultBackSideText = useMemo(() => {
    return generateDefaultBackSideText({
      styleContext,
      promptLanguage,
      colorScheme,
      centralMotif,
      mood,
      energy,
      visualStyle,
      sources,
      textStyle: 'neutral-meditativ', // Default value - not exposed in UI anymore
      textClarity: 'klar', // Default value - not exposed in UI anymore
      feelings,
      industry: 'other', // Default value - not exposed in UI anymore
      tone: 'professional', // Default value - not exposed in UI anymore
      ctaStyle: 'invitation', // Default value - not exposed in UI anymore
      businessDesignStyle,
      businessValues,
      logoImage,
      logoColors,
      portraitImage,
      valueDisplay,
      valuePosition,
      customValueText,
      voucherValue,
      backSideStyle: 'einladung', // Default value - not exposed in UI anymore
      backSideText: '', // Ignore custom text to get default
      personName,
      contactEmail,
      contactPhone,
      contactWebsite,
      qrCodeEnabled,
      qrCodeUrl,
    });
  }, [
    styleContext, promptLanguage, colorScheme, centralMotif, mood, energy,
    visualStyle, sources, feelings, businessDesignStyle,
    businessValues, logoImage, logoColors, valueDisplay, valuePosition, customValueText,
    voucherValue, personName, contactEmail, contactPhone,
    contactWebsite, qrCodeEnabled, qrCodeUrl, portraitImage,
  ]);

  // Show loading skeleton while hydrating from IndexedDB
  if (!hasHydrated) {
    return (
      <div className="space-y-4">
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="skeleton h-4 w-24 mb-2"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
        </div>
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <div className="skeleton h-4 w-32 mb-2"></div>
            <div className="skeleton h-10 w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ====== 1. STYLE SELECTION ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <h3 className="font-semibold text-sm">{t.sections.style}</h3>
          <p className="text-xs text-base-content/60">{t.sectionInfo.style}</p>
          <SingleSelect<StyleContext>
            options={toOptions(t.styleContext)}
            tooltips={t.styleContextTooltip}
            currentValue={styleContext}
            onChange={setStyleContext}
          />
        </div>
      </div>

      {/* ====== 2. DESIGN ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-1">
          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm">{t.sections.farben}</h3>
            <p className="text-xs text-base-content/60">{t.sectionInfo.farben}</p>
          </div>
          {styleContext === 'spiritual' ? (
            <ColorSelect<SpiritualColorScheme>
              options={toOptions(t.spiritualColorScheme)}
              tooltips={t.spiritualColorSchemeTooltip}
              swatches={SPIRITUAL_COLOR_SWATCHES}
              currentValue={colorScheme as SpiritualColorScheme}
              onChange={(v) => setColorScheme(v)}
            />
          ) : (
            <ColorSelect<BusinessColorScheme>
              options={toOptions(t.businessColorScheme)}
              tooltips={t.businessColorSchemeTooltip}
              swatches={businessColorSwatches}
              currentValue={colorScheme as BusinessColorScheme}
              onChange={(v) => setColorScheme(v)}
            />
          )}

          <div className="divider my-0" />

          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm">{t.sections.motiv}</h3>
            <p className="text-xs text-base-content/60">{t.sectionInfo.motiv}</p>
          </div>
          {styleContext === 'spiritual' ? (
            <SingleSelect<SpiritualMotif>
              options={toOptions(t.spiritualMotif)}
              tooltips={t.spiritualMotifTooltip}
              currentValue={centralMotif as SpiritualMotif}
              onChange={(v) => setCentralMotif(v)}
            />
          ) : (
            <SingleSelect<BusinessMotif>
              options={toOptions(t.businessMotif)}
              tooltips={t.businessMotifTooltip}
              currentValue={centralMotif as BusinessMotif}
              onChange={(v) => setCentralMotif(v)}
            />
          )}
        </div>
      </div>

      {/* ====== PORTRAIT UPLOAD (when portrait motif selected) ====== */}
      {centralMotif === 'portrait' && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4">
            <LogoUpload
              label={t.portrait.title}
              uploadLabel={t.portrait.upload}
              dragDropLabel={t.portrait.dragDrop}
              removeLabel={t.portrait.remove}
              hintLabel={t.portrait.hint}
              logoImage={portraitImage}
              onLogoChange={setPortraitImage}
            />
          </div>
        </div>
      )}

      {/* ====== 3. SPIRITUAL-SPECIFIC ====== */}
      {styleContext === 'spiritual' && (
        <>
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4 space-y-1">
              <div className="space-y-0.5 mb-1">
                <h3 className="font-semibold text-sm">{t.sections.grundhaltung}</h3>
                <p className="text-xs text-base-content/60">{t.sectionInfo.grundhaltung}</p>
              </div>
              <SingleSelect<Mood>
                options={toOptions(t.mood)}
                tooltips={t.moodTooltip}
                currentValue={mood}
                onChange={setMood}
                showSeparator
              />
              <div className="divider my-0" />
              <SingleSelect<Energy>
                options={toOptions(t.energy)}
                tooltips={t.energyTooltip}
                currentValue={energy}
                onChange={setEnergy}
                showSeparator
              />
              <div className="divider my-0" />
              <SingleSelect<VisualStyle>
                options={toOptions(t.visualStyle)}
                tooltips={t.visualStyleTooltip}
                currentValue={visualStyle}
                onChange={setVisualStyle}
                showSeparator
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4 space-y-2">
              <h3 className="font-semibold text-sm">{t.sections.quellen}</h3>
              <p className="text-xs text-base-content/60">{t.sectionInfo.quellen}</p>
              <MultiSelect<SpiritualSource>
                options={toOptions(t.sources)}
                tooltips={t.sourcesTooltip}
                selected={sources}
                onToggle={toggleSource}
              />
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4 space-y-2">
              <h3 className="font-semibold text-sm">{t.sections.gefuehl}</h3>
              <p className="text-xs text-base-content/60">{t.sectionInfo.gefuehl}</p>
              <MultiSelect<Feeling>
                options={toOptions(t.feelings)}
                tooltips={t.feelingsTooltip}
                selected={feelings}
                onToggle={toggleFeeling}
              />
            </div>
          </div>
        </>
      )}

      {/* ====== 4. BUSINESS-SPECIFIC ====== */}
      {styleContext === 'business' && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body p-4 space-y-1">
            <div className="space-y-0.5 mb-1">
              <h3 className="font-semibold text-sm">{t.sections.business}</h3>
              <p className="text-xs text-base-content/60">{t.sectionInfo.business}</p>
            </div>
            <SingleSelect<BusinessDesignStyle>
              label={appLanguage === 'de' ? 'Design-Stil' : 'Design Style'}
              options={toOptions(t.businessDesignStyle)}
              tooltips={t.businessDesignStyleTooltip}
              currentValue={businessDesignStyle}
              onChange={setBusinessDesignStyle}
            />

            <div className="divider my-0" />

            <div className="space-y-0.5">
              <h3 className="font-semibold text-sm">{appLanguage === 'de' ? 'Werte beim Anfassen' : 'Values When Held'}</h3>
              <p className="text-xs text-base-content/60">{appLanguage === 'de' ? 'Welche Werte soll der Gutschein vermitteln?' : 'What values should the voucher convey?'}</p>
            </div>
            <MultiSelect<BusinessValue>
              options={toOptions(t.businessValues)}
              tooltips={t.businessValuesTooltip}
              selected={businessValues}
              onToggle={toggleBusinessValue}
            />

            <div className="divider my-0" />

            <LogoUpload
              label={t.logo.title}
              uploadLabel={t.logo.upload}
              dragDropLabel={t.logo.dragDrop}
              removeLabel={t.logo.remove}
              hintLabel={t.logo.hint}
              logoImage={logoImage}
              onLogoChange={handleLogoChange}
            />
          </div>
        </div>
      )}

      {/* ====== 5. VOUCHER CONFIGURATION ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-1">
          <div className="space-y-0.5 mb-1">
            <h3 className="font-semibold text-sm">{t.sections.wert}</h3>
            <p className="text-xs text-base-content/60">{t.sectionInfo.wert}</p>
          </div>

          {/* Voucher Value Presets + Input */}
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {VOUCHER_VALUE_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
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

          <div className="divider my-0" />

          <SingleSelect<ValuePosition>
            label={appLanguage === 'de' ? 'Position' : 'Position'}
            options={toOptions(t.valuePosition)}
            tooltips={t.valuePositionTooltip}
            currentValue={valuePosition}
            onChange={setValuePosition}
            showSeparator
          />

          <div className="divider my-0" />

          <div className="space-y-0.5">
            <h3 className="font-semibold text-sm">{t.sections.rueckseite}</h3>
            <p className="text-xs text-base-content/60">
              {appLanguage === 'de' ? 'Text auf der Rückseite des Gutscheins' : 'Text on the back of the voucher'}
            </p>
          </div>
          <textarea
            className="textarea textarea-bordered w-full text-sm"
            rows={3}
            value={backSideText || defaultBackSideText}
            onChange={(e) => setBackSideText(e.target.value)}
          />
        </div>
      </div>

      {/* ====== 6. CONTACT DETAILS ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-3">
          <h3 className="font-semibold text-sm">{t.sections.kontakt}</h3>
          <input
            type="text"
            className="input input-bordered w-full"
            placeholder={t.placeholders.name}
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            autoComplete="name"
          />
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
        </div>
      </div>

      {/* ====== 7. QR CODE ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t.sections.qrCode}</h3>
          <p className="text-xs text-base-content/60">{t.qrCode.description}</p>

          <div className="form-control">
            <label className="label cursor-pointer justify-start gap-3">
              <input
                type="checkbox"
                className="toggle toggle-primary"
                checked={qrCodeEnabled}
                onChange={(e) => setQrCodeEnabled(e.target.checked)}
              />
              <span className="label-text">{t.qrCode.enabled}</span>
            </label>
          </div>

          {qrCodeEnabled && (
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

      {/* ====== 8. PROMPT LANGUAGE ====== */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4 space-y-2">
          <h3 className="font-semibold text-sm">{t.sections.sprache}</h3>
          <SingleSelect<PromptLanguage>
            options={toOptions(t.promptLanguage)}
            currentValue={promptLanguage}
            onChange={setPromptLanguage}
          />
        </div>
      </div>

      {/* ====== RESET BUTTON ====== */}
      <div className="flex justify-end">
        <button type="button" className="btn btn-ghost text-error" onClick={reset}>
          {t.reset}
        </button>
      </div>
    </div>
  );
}
