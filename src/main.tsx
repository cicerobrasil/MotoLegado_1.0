import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Safe register PWA service worker only in production build
if (import.meta.env.PROD && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    import('virtual:pwa-register').then(({ registerSW }) => {
      registerSW({
        immediate: false,
        onNeedRefresh() {
          console.log('[MotoLegado PWA] Nova versão disponível');
        },
        onOfflineReady() {
          console.log('[MotoLegado PWA] Aplicativo pronto para uso offline');
        },
      });
    }).catch(() => {
      // PWA virtual module not active or restricted in iframe
    });
  } catch {
    // Ignore in restricted environments
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
