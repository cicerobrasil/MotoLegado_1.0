import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA service worker with auto-update
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('[MotoLegado PWA] Nova versão disponível');
  },
  onOfflineReady() {
    console.log('[MotoLegado PWA] Aplicativo pronto para uso offline');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
