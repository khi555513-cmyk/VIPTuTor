
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'lucide-vendor': ['lucide-react'],
          'ai-vendor': ['@google/genai'],
          'utils-vendor': ['marked', 'dompurify', 'mammoth', 'canvas-confetti']
        }
      }
    }
  },
  server: {
    host: true
  }
});
