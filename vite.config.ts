
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'lucide-react'],
          ai: ['@google/genai'],
          utils: ['marked', 'dompurify', 'mammoth', 'canvas-confetti']
        }
      }
    }
  },
  server: {
    host: true
  }
});
