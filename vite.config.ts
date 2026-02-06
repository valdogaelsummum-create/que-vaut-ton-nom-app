
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Le point crucial : base relative pour que les assets soient trouvés peu importe le sous-dossier GitHub
  base: './', 
  define: {
    // On définit process.env de manière globale et sécurisée pour le navigateur
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    },
    'global': 'window'
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', '@google/genai'],
        },
      },
    },
  },
});
