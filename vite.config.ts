
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Crucial pour GitHub Pages
  define: {
    // Empêche le crash si process.env est appelé dans le code
    'process.env': typeof process !== 'undefined' ? process.env : {}
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
  }
});
