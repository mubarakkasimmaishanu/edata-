import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Automatically handle stale chunks after new deployments without blank screens
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error detected, refreshing to fetch latest assets...', event);
  const lastReload = sessionStorage.getItem('edata_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem('edata_chunk_reload', String(now));
    window.location.reload();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
