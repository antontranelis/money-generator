import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { preloadBaseImages } from './services/templateCompositor';

// Preload base images for faster template compositing
preloadBaseImages();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
