import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';
import { captureBrowserReferral } from './services/deepLink';

captureBrowserReferral();

// Automatically handle stale chunks / deployment desyncs without blank screens
function triggerAutoReload(reason: string) {
  const lastReload = sessionStorage.getItem('edata_chunk_reload');
  const now = Date.now();
  if (!lastReload || now - parseInt(lastReload, 10) > 8000) {
    console.warn(`[eData] Auto-refresh triggered due to: ${reason}`);
    sessionStorage.setItem('edata_chunk_reload', String(now));
    window.location.reload();
  }
}

// 1. Vite built-in preload error event
window.addEventListener('vite:preloadError', (event) => {
  triggerAutoReload('Vite preloadError');
});

// 2. Global script syntax or network error on dynamic imports
window.addEventListener('error', (event) => {
  const msg = String(event?.message || '');
  if (
    msg.includes('Unexpected token') ||
    msg.includes('ChunkLoadError') ||
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk')
  ) {
    triggerAutoReload(msg);
  }
});

// 3. Unhandled promise rejections for chunk imports
window.addEventListener('unhandledrejection', (event) => {
  const reason = String(event?.reason?.message || event?.reason || '');
  if (
    reason.includes('Failed to fetch dynamically imported module') ||
    reason.includes('Importing a module script failed') ||
    reason.includes('Loading chunk') ||
    reason.includes('Unexpected token')
  ) {
    triggerAutoReload(reason);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
