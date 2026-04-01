import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://127.0.0.1:3443',
        changeOrigin: true,
        secure: false,     // Allow self-signed cert from backend during dev
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  }
});
