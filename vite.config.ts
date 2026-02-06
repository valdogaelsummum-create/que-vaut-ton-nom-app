
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // Assure que les fichiers sont trouvés sur GitHub Pages
  define: {
    // Ce bloc est CRITIQUE : il définit process.env même si le serveur ne le fait pas
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
  },
  server: {
    // historyApiFallback removed as it is not a valid property in Vite's ServerOptions.
    // Vite serves index.html by default for 404s in development for SPAs.
  }
});
