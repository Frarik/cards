import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',   // path relativi → funziona con HA ingress (subpath variabile)
  build: {
    outDir: '../panel',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Hash automatico nel nome → cache busting perfetto
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      }
    },
    // Minifica CSS e JS
    minify: 'esbuild',
    cssMinify: true,
  },
  // In sviluppo (npm run dev) risolvi le stesse dipendenze
  resolve: {
    alias: {}
  }
});
