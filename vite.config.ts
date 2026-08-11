import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      // esbuild is the minifier Vite uses by default. `drop` removes
      // console.* and debugger statements from production bundles, saving
      // parse + execute time on every startup on low-end phones. Dev
      // builds are unaffected (drop only applies in production).
      esbuild: {
        drop: ['console', 'debugger'],
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            // jsPDF is now dynamically imported by TransactionHistory, so
            // it forms its own chunk automatically — this manualChunks
            // entry is kept so if any other file ever imports jspdf
            // statically it still lands in the same vendor-pdf chunk
            // (avoids duplication) rather than the main bundle.
            'vendor-pdf': ['jspdf', 'html2canvas'],
            'vendor-capacitor': ['@capacitor/core', '@capacitor/app'],
          },
        },
      },
    },
  };
});
