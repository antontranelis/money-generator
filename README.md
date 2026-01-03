# Money Printer

Create personalized time vouchers that look like real currency. Design your own "Zeitgutscheine" (time vouchers) with custom portraits, names, and descriptions - perfect as unique gifts.

**[Live Demo](https://antontranelis.github.io/money-printer/)**

## Features

- **Custom Portrait**: Upload your photo with zoom and pan controls
- **Background Removal**: AI-powered background removal with adjustable opacity and blur
- **Sepia Effect**: Local vintage currency engraving effect (no API required)
- **Personalization**: Add your name, email, and phone number
- **Multiple Denominations**: Choose between 1, 5, or 10 hour vouchers
- **Bilingual**: Full support for German and English
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
- **Zustand** - State Management
- **jsPDF** - PDF Generation
- **Canvas API** - Image Processing

## Templates

The package includes two template sets:

- **German (DE)**: High-DPI templates (6144x3200px)
- **English (EN)**: Standard-DPI templates (1536x1024px)

Templates are bundled in `public/templates/`.

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

- **Image Caching**: Avoids reloading the same data URLs
- **Uint32Array**: Fast pixel manipulation for sepia effect
- **Reusable Canvas**: Reduces garbage collection pressure
- **Debounced Updates**: Slider changes are debounced to prevent lag

## License

MIT License - see [LICENSE](LICENSE) for details.
