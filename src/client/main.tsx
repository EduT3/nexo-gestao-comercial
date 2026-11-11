import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { visualPreview } from './api';
import { LocalApp } from './LocalApp';
import './styles.css';
import './product.css';
import './local.css';
import './nexo-balcao.css';

async function start() {
  let preview = false;
  if (visualPreview && !window.nexoLocal) {
    const { createLocalPreviewBridge } = await import('./preview/local-adapter');
    window.nexoLocal = createLocalPreviewBridge(); preview = true;
  }
  createRoot(document.getElementById('root')!).render(<StrictMode>{window.nexoLocal ? <LocalApp preview={preview} /> : <App />}</StrictMode>);
}
void start();
