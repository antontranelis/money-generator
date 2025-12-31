# Money Generator

Create personalized time vouchers that look like real currency. Design your own "Zeitgutscheine" (time vouchers) with custom portraits, names, and descriptions - perfect as unique gifts.

![Money Generator Preview](docs/preview.png)

## Features

- **Custom Portrait**: Upload your photo and optionally enhance it with AI for a vintage currency look
- **Personalization**: Add your name, email, and phone number
- **Multiple Denominations**: Choose between 1, 5, or 10 hour vouchers
- **Bilingual**: Full support for German and English
- **High-Quality Export**: Download as print-ready PDF (A4 landscape)
- **Portrait Zoom**: Adjust the portrait size with an intuitive zoom slider

## Demo

Try it live: [Money Generator Demo](https://yourusername.github.io/money-generator/)

## Tech Stack

- **React 19** - UI Framework
- **TypeScript** - Type Safety
- **Zustand** - State Management
- **jsPDF** - PDF Generation
- **Tailwind CSS + DaisyUI** - Styling
- **Vite** - Build Tool

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/money-generator.git
cd money-generator

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Upload a Portrait**: Click the upload area or drag & drop an image
2. **Adjust Zoom**: Use the slider to zoom in/out on your portrait
3. **Enter Details**: Fill in your name and contact information
4. **Choose Hours**: Select 1, 5, or 10 hours for your voucher
5. **Add Description**: Optionally add a custom description
6. **Download PDF**: Click the download button to get your print-ready voucher

## AI Portrait Enhancement (Optional)

The app includes optional AI-powered portrait enhancement using Stability AI. This transforms your photo into a vintage currency engraving style.

To enable:
1. Get an API key from [Stability AI](https://stability.ai/)
2. Click "Add API Key for better results" in the app
3. Or set the environment variable: `VITE_STABILITY_API_KEY=your-key`

Without an API key, a basic canvas-based enhancement is available.

## Customization

### Templates

Templates are located in `public/templates/`. The app supports two template sets:

- **German (DE)**: High-DPI templates (6144x4096px)
- **English (EN)**: Standard-DPI templates (1536x1024px)

To customize, replace the template images and update the layout coordinates in `src/constants/templates.ts`.

### Translations

All text is internationalized. Add or modify translations in `src/constants/translations.ts`.

## Project Structure

```
src/
├── components/          # React components
│   ├── BillForm.tsx     # Main form container
│   ├── BillPreview.tsx  # Canvas preview
│   ├── ExportButton.tsx # PDF download
│   ├── PortraitUpload.tsx
│   └── ...
├── services/            # Core services
│   ├── pdfGenerator.ts  # PDF creation
│   ├── canvasRenderer.ts # Canvas drawing
│   └── stabilityAI.ts   # AI enhancement
├── stores/              # Zustand stores
│   └── billStore.ts     # App state
├── types/               # TypeScript types
├── constants/           # Templates & translations
└── hooks/               # Custom React hooks
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the concept of "Zeitgutscheine" (time vouchers) as meaningful gifts
- Built with modern React patterns and best practices
