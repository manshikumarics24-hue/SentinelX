import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          globe: ['react-globe.gl', 'three'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
  },
});
