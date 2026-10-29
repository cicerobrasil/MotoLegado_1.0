import './utils/systemReset';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { initServiceWorker } from './lib/pushNotifications.ts';

// Inicialização segura do Service Worker para Notificações Push & PWA
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  initServiceWorker().catch(() => {});
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
