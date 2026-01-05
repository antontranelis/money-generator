import type { Language } from '../types/bill';

interface Translations {
  header: {
    title: string;
    subtitle: string;
  };
  form: {
    personalInfo: {
      title: string;
      name: string;
      namePlaceholder: string;
      email: string;
      emailPlaceholder: string;
      phone: string;
      phonePlaceholder: string;
    };
    portrait: {
      title: string;
      upload: string;
      dragDrop: string;
      enhance: string;
      enhancing: string;
      useOriginal: string;
      useEnhanced: string;
      zoom: string;
    };
    voucher: {
      title: string;
      hours: string;
      hourLabel: string;
      hoursLabel: string;
      description: string;
      descriptionPlaceholder: string;
      billLanguage: string;
      billLanguageGerman: string;
      billLanguageEnglish: string;
    };
    billColor: {
      title: string;
      label: string;
    };
  };
  preview: {
    front: string;
    back: string;
    flip: string;
  };
  export: {
    button: string;
    exporting: string;
    success: string;
  };
  bill: {
    descriptionText: string;
    bannerText: {
      1: string;
      5: string;
      10: string;
    };
  };
}

const de: Translations = {
  header: {
    title: 'Money Generator',
    subtitle: 'Erstelle deinen persönlichen Zeitgutschein',
  },
  form: {
    personalInfo: {
      title: 'Persönliche Daten',
      name: 'Name',
      namePlaceholder: 'Dein Name',
      email: 'E-Mail',
      emailPlaceholder: 'deine@email.de',
      phone: 'Telefon',
      phonePlaceholder: '+49 123 456789',
    },
    portrait: {
      title: 'Portrait',
      upload: 'Bild hochladen',
      dragDrop: 'oder hierher ziehen',
      enhance: 'Mit AI verbessern',
      enhancing: 'Wird verbessert...',
      useOriginal: 'Original verwenden',
      useEnhanced: 'Verbessertes verwenden',
      zoom: 'Zoom',
    },
    voucher: {
      title: 'Gutschein',
      hours: 'Stunden',
      hourLabel: 'Stunde',
      hoursLabel: 'Stunden',
      description: 'Beschreibung',
      descriptionPlaceholder: 'Was kann mit diesem Gutschein eingelöst werden?',
      billLanguage: 'Schein-Sprache',
      billLanguageGerman: 'Deutsch',
      billLanguageEnglish: 'Englisch',
    },
    billColor: {
      title: 'Scheinfarbe',
      label: 'Farbton',
    },
  },
  preview: {
    front: 'Vorderseite',
    back: 'Rückseite',
    flip: 'Umdrehen',
  },
  export: {
    button: 'Als PDF herunterladen',
    exporting: 'PDF wird erstellt...',
    success: 'Download gestartet!',
  },
  bill: {
    descriptionText: 'Für diesen Schein erhältst du {bannerText} meiner Zeit oder ein gleichwertiges Dankeschön.',
    bannerText: {
      1: 'eine Stunde',
      5: 'fünf Stunden',
      10: 'zehn Stunden',
    },
  },
};

const en: Translations = {
  header: {
    title: 'Money Generator',
    subtitle: 'Create your personal time voucher',
  },
  form: {
    personalInfo: {
      title: 'Personal Information',
      name: 'Name',
      namePlaceholder: 'Your name',
      email: 'Email',
      emailPlaceholder: 'your@email.com',
      phone: 'Phone',
      phonePlaceholder: '+1 234 567890',
    },
    portrait: {
      title: 'Portrait',
      upload: 'Upload image',
      dragDrop: 'or drag and drop',
      enhance: 'Enhance with AI',
      enhancing: 'Enhancing...',
      useOriginal: 'Use original',
      useEnhanced: 'Use enhanced',
      zoom: 'Zoom',
    },
    voucher: {
      title: 'Voucher',
      hours: 'Hours',
      hourLabel: 'hour',
      hoursLabel: 'hours',
      description: 'Description',
      descriptionPlaceholder: 'What can be redeemed with this voucher?',
      billLanguage: 'Bill Language',
      billLanguageGerman: 'German',
      billLanguageEnglish: 'English',
    },
    billColor: {
      title: 'Bill Color',
      label: 'Hue',
    },
  },
  preview: {
    front: 'Front',
    back: 'Back',
    flip: 'Flip',
  },
  export: {
    button: 'Download as PDF',
    exporting: 'Creating PDF...',
    success: 'Download started!',
  },
  bill: {
    descriptionText: 'For this voucher, you will receive {bannerText} of my time or an equivalent appreciation in return.',
    bannerText: {
      1: 'one hour',
      5: 'five hours',
      10: 'ten hours',
    },
  },
};

const translations: Record<Language, Translations> = { de, en };

export function t(language: Language): Translations {
  return translations[language];
}

export function formatDescription(language: Language, hours: number, customDescription?: string): string {
  if (customDescription && customDescription.trim()) {
    return customDescription;
  }
  const trans = t(language);
  const bannerText = trans.bill.bannerText[hours as 1 | 5 | 10] || trans.bill.bannerText[1];
  return trans.bill.descriptionText.replace('{bannerText}', bannerText);
}
