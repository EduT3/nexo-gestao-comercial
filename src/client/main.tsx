import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LocalApp } from './LocalApp';
import './styles.css';
import './product.css';
import './local.css';

createRoot(document.getElementById('root')!).render(<StrictMode>{window.nexoLocal ? <LocalApp /> : <App />}</StrictMode>);
