# Money Printer

Create personalized time vouchers that look like real currency. Design your own "Zeitgutscheine" (time vouchers) with custom portraits, names, and descriptions - perfect as unique gifts.

**[Live Demo](https://antontranelis.github.io/money-printer/)**

## Features

- **Custom Portrait**: Upload your photo with zoom and pan controls
- **Background Removal**: AI-powered background removal with adjustable opacity and blur
- **Sepia Effect**: Local vintage currency engraving effect (no API required)
- **Personalization**: Add your name, email, and phone number
- **Multiple Denominations**: Choose between 1, 5, or 10 hour vouchers
- **Bilingual**: Full support for German and English (auto-detects browser language)
- **High-Quality Export**: Download as print-ready PDF (A4 landscape)
- **Responsive**: Works on desktop and mobile with touch support

## Installation

```bash
npm install @antontranelis/money-printer
```

## Usage

### As a React Component

```tsx
import { MoneyPrinter } from '@antontranelis/money-printer';

function App() {
  return <MoneyPrinter />;
}
```

### Individual Components

```tsx
import {
  BillForm,
  BillPreview,
  ExportButton,
  PortraitUpload,
  useBillStore
} from '@antontranelis/money-printer';

function CustomEditor() {
  const portrait = useBillStore((state) => state.portrait);

  return (
    <div>
      <PortraitUpload />
      <BillPreview />
      <ExportButton />
    </div>
  );
}
```

### Services

```tsx
import {
  // PDF Generation
  generateBillPDF,
  exportBillAsPDF,

  // Canvas Rendering
  renderFrontSide,
  renderBackSide,

  // Template Composition
  composeTemplate,
  composeTemplateFullRes,
  getTemplateLayers,
  preloadBaseImages,
  TEMPLATE_WIDTH,
  TEMPLATE_HEIGHT,
  PREVIEW_WIDTH,
  PREVIEW_HEIGHT,

  // Image Effects (local, no API)
  applyEngravingEffect,
  resizeImage,
  compositeWithBackground,
  clearImageCache,

  // AI Enhancement (requires API key)
  removeBackground,
  setApiKey,
  hasApiKey,
} from '@antontranelis/money-printer';
```

## Portrait Controls

### Zoom & Pan

- **Zoom Slider**: Adjust portrait size from 50% to 200%
- **Pan/Drag**: When zoomed in, drag the portrait to reposition (mouse & touch supported)
- Works in both the avatar preview and the bill preview canvas

### Background Removal

1. Toggle "Remove background" (requires Stability AI API key)
2. Adjust **Background Opacity** (0-100%) to blend original background
3. Adjust **Blur** (0-100%) for depth-of-field effect

### Sepia Effect

- Local processing, no API required
- Adjustable intensity (0-100%)
- Applies vintage currency engraving look

## AI Features (Optional)

Background removal uses Stability AI. To enable:

1. Get an API key from [Stability AI](https://stability.ai/)
2. Click "Remove background" toggle in the app
3. Enter your API key when prompted

The sepia/engraving effect runs locally and doesn't require an API key.

## Tech Stack

- **React 18/19** - UI Framework
- **TypeScript** - Type Safety
- **Zustand** - State Management with persistence
- **jsPDF** - PDF Generation
- **Canvas API** - Image Processing & Template Compositing

## Templates

Templates are dynamically composed at runtime from layered assets:

- **Background**: Base template background (3633x1920px @ 600 DPI)
- **Badges**: Hour denomination badges (1, 5, 10) positioned in corners
- **Frame**: Ornamental frame overlay
- **Banner Text**: Arc-curved text rendered on canvas

Both German and English use the same base templates with localized text.

## Development

```bash
# Clone the repository
git clone https://github.com/antontranelis/money-printer.git
cd money-printer

# Install dependencies
npm install

# Start development server
npm run dev

# Build library
npm run build:lib

# Build standalone app
npm run build
```

## Performance Optimizations

The image processing is optimized for smooth performance:

- **Layer Caching**: Composed templates are cached as data URLs
- **Image Caching**: Avoids reloading the same images
- **Uint32Array**: Fast pixel manipulation for effects
- **Reusable Canvas**: Reduces garbage collection pressure
- **Debounced Updates**: Slider changes are debounced to prevent lag
- **Preview Scale**: Lower resolution previews (50% scale) for faster rendering

## License

MIT License - see [LICENSE](LICENSE) for details.
